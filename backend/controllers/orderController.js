import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Restaurant from "../models/Restaurant.js";
import SystemSettings from "../models/SystemSettings.js";
import Coupon from "../models/Coupon.js";
import User from "../models/User.js";
import { notifyUserDual, notifyOnlineDeliveryPartners } from "../lib/push.js";
import razorpayInstance from "../lib/razorpay.js";
import { emitOrderUpdate } from "../services/socketService.js";

const createOrder = async (req, res, next) => {
  try {
    const settings = await SystemSettings.getSettings();
    if (settings && settings.maintenanceMode) {
      return res.status(503).json({
        success: false,
        message: "Cravingza is currently under maintenance. New orders are temporarily paused. Please try again later.",
      });
    }

    const {
      deliveryAddress,
      paymentMethod: inputPaymentMethod,
      paymentStatus: inputPaymentStatus,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      couponCode,
    } = req.body;

    if (!deliveryAddress || !deliveryAddress.addressLine) {
      return res.status(400).json({
        success: false,
        message: "Delivery address line is required",
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    let cartItemsToUse = cart && cart.items && cart.items.length > 0 ? cart.items : (req.body.items || []);
    let targetRestaurantId = (cart && cart.restaurant) || req.body.restaurant;

    if (!cartItemsToUse || cartItemsToUse.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    let restaurant = null;
    if (targetRestaurantId) {
      restaurant = await Restaurant.findById(targetRestaurantId);
    }
    if (!restaurant) {
      restaurant = await Restaurant.findOne();
    }

    if (restaurant && restaurant.isOpen === false) {
      return res.status(400).json({
        success: false,
        message: `${restaurant.name || "This restaurant"} is currently not accepting new orders. Please try again later.`,
      });
    }

    const subtotal = cart && cart.subtotal ? cart.subtotal : cartItemsToUse.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
    let discountAmount = 0;
    let isFreeDelivery = false;
    let appliedCouponCode = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: String(couponCode).toUpperCase().trim(),
        isActive: true,
        validTill: { $gt: new Date() },
      });

      if (coupon && subtotal >= coupon.minOrderAmount) {
        // Track coupon usage per user
        if (!coupon.usedByUsers.some((uid) => uid.toString() === req.user._id.toString())) {
          coupon.usedByUsers.push(req.user._id);
          await coupon.save();
        }

        appliedCouponCode = coupon.code;
        if (coupon.discountType === "percentage") {
          discountAmount = (subtotal * coupon.discountValue) / 100;
          if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
            discountAmount = coupon.maxDiscountAmount;
          }
        } else {
          discountAmount = coupon.discountValue;
        }
        discountAmount = Math.min(discountAmount, subtotal);
        if (coupon.category === "delivery") {
          isFreeDelivery = true;
        }
      }
    }

    // settings already loaded above
    discountAmount = Math.round(discountAmount * 100) / 100;
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);

    // Option 1 Calculations:
    // Base Delivery Fee: 100% passed to delivery rider
    const deliveryFee = isFreeDelivery
      ? 0
      : settings.baseDeliveryFee !== undefined
      ? settings.baseDeliveryFee
      : (restaurant.deliveryFee || 30);

    // Service Charge / Platform Fee: 100% revenue for Super Admin
    const serviceFeePercent = settings.serviceFeePercent !== undefined ? settings.serviceFeePercent : 5;
    const serviceFee = Math.round(((discountedSubtotal * serviceFeePercent) / 100) * 100) / 100;

    // GST Tax Ratio
    const taxPercent = settings.taxPercent !== undefined ? settings.taxPercent : 5;
    const taxes = Math.round(((discountedSubtotal * taxPercent) / 100) * 100) / 100;

    // Total Amount paid by Customer
    const totalAmount = Math.round((discountedSubtotal + serviceFee + deliveryFee + taxes) * 100) / 100;

    // Restaurant Commission deducted by Super Admin from Food Subtotal
    const commissionRate = settings.restaurantCommissionRate !== undefined ? settings.restaurantCommissionRate : 15;
    const adminCommission = Math.round(((discountedSubtotal * commissionRate) / 100) * 100) / 100;

    const orderItems = cart.items.map((item) => ({
      menuItem: item.menuItem,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    const finalPaymentMethod = ["cod", "razorpay"].includes(inputPaymentMethod)
      ? inputPaymentMethod
      : "cod";
    const finalPaymentStatus = ["pending", "paid", "failed", "refunded"].includes(inputPaymentStatus)
      ? inputPaymentStatus
      : finalPaymentMethod === "razorpay"
      ? "paid"
      : "pending";

    const order = new Order({
      customer: req.user._id,
      restaurant: restaurant._id,
      items: orderItems,
      deliveryAddress,
      paymentMethod: finalPaymentMethod,
      paymentStatus: finalPaymentStatus,
      razorpayOrderId: razorpayOrderId || null,
      razorpayPaymentId: razorpayPaymentId || null,
      razorpaySignature: razorpaySignature || null,
      subtotal,
      couponCode: appliedCouponCode,
      discount: discountAmount,
      deliveryFee,
      serviceFee,
      taxes,
      adminCommission,
      totalAmount,
      status: "placed",
    });

    await order.save();

    // Auto-sync entered phone number to Customer profile if provided
    if (deliveryAddress && deliveryAddress.phone) {
      try {
        await User.findByIdAndUpdate(req.user._id, { phone: deliveryAddress.phone.trim() });
      } catch (userErr) {
        console.error("Failed to sync phone to user profile:", userErr);
      }
    }

    // Send dual notifications (In-App + System Push)
    try {
      // Notify customer
      notifyUserDual(
        req.user._id,
        "Order Placed Successfully! 🛒",
        `Your order #${order._id.toString().slice(-6)} has been placed at ${restaurant.name}.`,
        `/orders/${order._id}`
      );

      // Notify restaurant owner
      if (restaurant.owner) {
        notifyUserDual(
          restaurant.owner,
          "New Order Received! 🛎️",
          `New COD Order #${order._id.toString().slice(-6)} received for ₹${totalAmount.toFixed(2)}.`,
          "/restaurant-owner/dashboard"
        );
      }
    } catch (e) {
      console.error("Error dispatching notifications on order creation:", e);
    }

    // Clear cart entirely
    cart.items = [];
    cart.restaurant = null;
    await cart.save();

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customer: req.user._id })
      .populate("restaurant")
      .populate("review")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("restaurant")
      .populate("items.menuItem")
      .populate("review");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this order",
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/orders/merchant/incoming - Get all orders for the owner's restaurant
const getMerchantOrders = async (req, res, next) => {
  try {
    let restaurant = await Restaurant.findOne({ owner: req.user._id });

    // Auto-recovery: If logged-in owner user is gopalgohel249@gmail.com, auto-link Burger Boss if needed
    if (!restaurant && req.user.email === "gopalgohel249@gmail.com") {
      restaurant = await Restaurant.findOne({ name: "Burger Boss" });
      if (restaurant) {
        restaurant.owner = req.user._id;
        await restaurant.save();
      }
    }

    if (!restaurant) {
      return res.status(200).json({
        success: true,
        data: [],
      });
    }

    const orders = await Order.find({ restaurant: restaurant._id })
      .populate("customer", "name email phone")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/orders/merchant/:id/status - Update order status (owner only)
const updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = [
      "placed",
      "accepted",
      "preparing",
      "ready_for_pickup",
      "picked_up",
      "out_for_delivery",
      "delivered",
      "cancelled",
    ];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
      });
    }

    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found for this partner account.",
      });
    }

    const updateFields = { status };
    if (status === "ready_for_pickup") {
      updateFields.readyAt = new Date();
    }
    if (status === "cancelled") {
      updateFields.cancelledAt = new Date();
      if (req.body.reason) {
        updateFields.cancellationReason = req.body.reason;
      }
    }

    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, restaurant: restaurant._id },
      updateFields,
      { new: true }
    ).populate("customer", "name email phone");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or you do not have permission to manage this order.",
      });
    }

    // Auto-Refund if Merchant cancels/rejects a paid online order
    if (status === "cancelled" && order.paymentMethod === "razorpay" && order.paymentStatus === "paid" && order.razorpayPaymentId) {
      try {
        const refundAmountPaise = Math.round(order.totalAmount * 100);
        const refund = await razorpayInstance.payments.refund(order.razorpayPaymentId, {
          amount: refundAmountPaise,
          notes: { reason: "Order Rejected/Cancelled by Restaurant" },
        });

        order.paymentStatus = "refunded";
        order.refundId = refund.id;
        order.refundAmount = order.totalAmount;
        order.refundedAt = new Date();
        order.refundReason = "Order rejected/cancelled by restaurant";
        await order.save();

        console.log(`[Merchant Reject - Auto Refund] Refunded ₹${order.totalAmount} for Order #${order._id}. Refund ID: ${refund.id}`);
      } catch (refundErr) {
        console.error(`[Merchant Reject - Refund Error] Failed for Order #${order._id}:`, refundErr);
      }
    }

    // Trigger Web Push Notification & In-App Notification for Customer when status changes
    if (order.customer?._id) {
      try {
        const orderShortId = order._id.toString().slice(-6);
        let title = `Order Update from ${restaurant.name}`;
        let msg = `Your order #${orderShortId} status is now: ${status}`;

        if (status === "accepted") {
          title = `Order Accepted by ${restaurant.name}! 🎉`;
          msg = `Your order #${orderShortId} has been accepted and is being prepared.`;
        } else if (status === "preparing") {
          title = `Food is Being Prepared! 🍳`;
          msg = `${restaurant.name} is preparing your delicious meal #${orderShortId}.`;
        } else if (status === "ready_for_pickup") {
          title = `Order Ready! 📦`;
          msg = `Your order #${orderShortId} at ${restaurant.name} is packed and ready.`;
        } else if (status === "out_for_delivery") {
          title = `Out for Delivery! 🛵`;
          msg = `Rider is on the way with your order #${orderShortId}.`;
        } else if (status === "delivered") {
          title = `Order Delivered! 😋`;
          msg = `Your order #${orderShortId} from ${restaurant.name} has been delivered. Enjoy!`;
        } else if (status === "cancelled") {
          const isRefunded = order.paymentStatus === "refunded";
          title = `Order Cancelled by Restaurant ❌`;
          msg = `Your order #${orderShortId} was rejected/cancelled by ${restaurant.name}.${
            isRefunded ? ` A full refund of ₹${order.totalAmount.toFixed(2)} has been initiated.` : ""
          }`;
        }

        notifyUserDual(order.customer._id, title, msg, `/orders/${order._id}`);
      } catch (pushErr) {
        console.error("Customer dual notification dispatch failed:", pushErr);
      }
    }

    // Trigger Web Push Notification asynchronously if marked ready_for_pickup
    if (status === "ready_for_pickup") {
      try {
        notifyOnlineDeliveryPartners(
          `New Delivery Available near ${restaurant.name}`,
          `New order ready for pickup at ${restaurant.name} — estimated earnings ₹40`,
          "/delivery-partner/nearby-orders"
        ).catch((err) => console.error("Web Push Error:", err));
      } catch (pushErr) {
        console.error("Web push dispatch failed:", pushErr);
      }
    }

    // ⚡ Real-Time Socket.io Event Broadcast to Mobile & Web Apps
    try {
      emitOrderUpdate(order);
    } catch (socketErr) {
      console.error("Socket emit error:", socketErr);
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status} successfully.`,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/orders/:id/cancel - Customer cancels placed order
const cancelOrder = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id)
      .populate("restaurant")
      .populate("customer", "name email phone");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    if (order.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this order.",
      });
    }

    const cancelableStatuses = ["placed", "accepted"];
    if (!cancelableStatuses.includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: "This order can no longer be cancelled as it is already being delivered.",
      });
    }

    // Calculate time elapsed in seconds since order creation
    const now = new Date();
    const orderTime = new Date(order.createdAt);
    const secondsElapsed = Math.floor((now.getTime() - orderTime.getTime()) / 1000);

    // Rule: 100% Full Refund if cancelled within 60 seconds (1 minute) AND status is 'placed'
    const isEligibleForRefund = order.status === "placed" && secondsElapsed <= 60;

    order.status = "cancelled";
    order.cancelledAt = new Date();
    if (reason) {
      order.cancellationReason = reason;
    }

    let refundStatusMsg = "";

    if (order.paymentMethod === "razorpay" && order.paymentStatus === "paid" && order.razorpayPaymentId) {
      if (isEligibleForRefund) {
        try {
          const refundAmountPaise = Math.round(order.totalAmount * 100);
          const refund = await razorpayInstance.payments.refund(order.razorpayPaymentId, {
            amount: refundAmountPaise,
            notes: { reason: reason || "Cancelled within 1 minute grace period" },
          });

          order.paymentStatus = "refunded";
          order.refundId = refund.id;
          order.refundAmount = order.totalAmount;
          order.refundedAt = new Date();
          order.refundReason = "Cancelled within 1 minute grace period";

          refundStatusMsg = `Full refund of ₹${order.totalAmount.toFixed(2)} initiated to your original payment source (Refund ID: ${refund.id}).`;
          console.log(`[Customer Cancel - Full Refund] Refunded ₹${order.totalAmount} for Order #${order._id}. Refund ID: ${refund.id}`);
        } catch (refundErr) {
          console.error(`[Customer Cancel - Refund Error] Failed to refund Order #${order._id}:`, refundErr);
        }
      } else {
        order.refundReason = `Cancelled after ${secondsElapsed}s / after restaurant acceptance (100% Cancellation Charge Applied - No Refund)`;
        refundStatusMsg = "Order cancelled. As cancellation occurred after 1 minute / restaurant acceptance, a 100% cancellation charge applies (No refund issued).";
      }
    }

    await order.save();

    // Trigger dual notifications (In-App + Web Push) to Restaurant Owner & Customer
    try {
      const orderShortId = order._id.toString().slice(-6);

      // Notify customer
      notifyUserDual(
        req.user._id,
        "Order Cancelled 🛒",
        refundStatusMsg || `Your order #${orderShortId} has been cancelled successfully.`,
        `/orders/${order._id}`
      );

      // Notify restaurant owner
      if (order.restaurant?.owner) {
        notifyUserDual(
          order.restaurant.owner,
          "Order Cancelled by Customer ❌",
          `Order #${orderShortId} was cancelled by customer.`,
          "/restaurant-owner/orders"
        );
      }
    } catch (pushErr) {
      console.error("Error dispatching dual notification for order cancellation:", pushErr);
    }

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

export {
  createOrder,
  getOrders,
  getOrderById,
  getMerchantOrders,
  updateOrderStatus,
  cancelOrder,
};
