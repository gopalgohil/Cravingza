import crypto from "crypto";
import razorpayInstance from "../lib/razorpay.js";
import Cart from "../models/Cart.js";
import Restaurant from "../models/Restaurant.js";
import Order from "../models/Order.js";
import Coupon from "../models/Coupon.js";
import SystemSettings from "../models/SystemSettings.js";
import { notifyUserDual } from "../lib/push.js";

/**
 * POST /api/payment/create-razorpay-order
 * Initiates Razorpay Order for current cart contents
 */
const createRazorpayOrder = async (req, res, next) => {
  try {
    const { couponCode, items, restaurant: bodyRestaurant } = req.body || {};

    let cart = await Cart.findOne({ user: req.user._id });
    let cartItemsToUse = cart && cart.items && cart.items.length > 0 ? cart.items : (items || []);
    let targetRestaurantId = (cart && cart.restaurant) || bodyRestaurant;

    if (!cartItemsToUse || cartItemsToUse.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty.",
      });
    }

    let restaurant = null;
    if (targetRestaurantId) {
      restaurant = await Restaurant.findById(targetRestaurantId);
    }
    if (!restaurant) {
      restaurant = await Restaurant.findOne();
    }

    const subtotal = cart && cart.subtotal ? cart.subtotal : cartItemsToUse.reduce((sum, item) => sum + ((item.price || 0) * (item.quantity || 1)), 0);
    let discountAmount = 0;
    let isFreeDelivery = false;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: String(couponCode).toUpperCase().trim(),
        isActive: true,
        validTill: { $gt: new Date() },
      });

      if (coupon && subtotal >= coupon.minOrderAmount) {
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

    const settings = await SystemSettings.getSettings();

    discountAmount = Math.round(discountAmount * 100) / 100;
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);

    const deliveryFee = isFreeDelivery
      ? 0
      : settings.baseDeliveryFee !== undefined
      ? settings.baseDeliveryFee
      : (restaurant.deliveryFee || 30);

    const serviceFeePercent = settings.serviceFeePercent !== undefined ? settings.serviceFeePercent : 5;
    const serviceFee = Math.round(((discountedSubtotal * serviceFeePercent) / 100) * 100) / 100;

    const taxPercent = settings.taxPercent !== undefined ? settings.taxPercent : 5;
    const taxes = Math.round(((discountedSubtotal * taxPercent) / 100) * 100) / 100;

    const totalAmount = Math.round((discountedSubtotal + serviceFee + deliveryFee + taxes) * 100) / 100;
    const totalInPaise = Math.round(totalAmount * 100);

    const options = {
      amount: totalInPaise,
      currency: "INR",
      receipt: `cravingza_${Date.now()}`,
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.API_key || "rzp_test_TIQT6DdrsWqxAT";

    return res.status(200).json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payment/verify
 * Verifies Razorpay payment HMAC SHA256 signature and creates Cravingza Order
 */
const verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, deliveryAddress, couponCode } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing Razorpay verification parameters.",
      });
    }

    if (!deliveryAddress || !deliveryAddress.addressLine) {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required.",
      });
    }

    // 1. Verify Signature
    const secret = process.env.RAZORPAY_KEY_SECRET || process.env.Secret || "fIHVsqDdaClXHWcNom6uEA1E";
    const bodyToSign = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(bodyToSign)
      .digest("hex");

    const expectedBuf = Buffer.from(expectedSignature, "utf-8");
    const receivedBuf = Buffer.from(razorpay_signature, "utf-8");

    if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed: invalid signature.",
      });
    }

    // 2. Fetch User Cart and Restaurant
    let cart = await Cart.findOne({ user: req.user._id });
    let cartItemsToUse = cart && cart.items && cart.items.length > 0 ? cart.items : (req.body.items || []);
    let targetRestaurantId = (cart && cart.restaurant) || req.body.restaurant;

    if (!cartItemsToUse || cartItemsToUse.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty. Order could not be created.",
      });
    }

    let restaurant = null;
    if (targetRestaurantId) {
      restaurant = await Restaurant.findById(targetRestaurantId);
    }
    if (!restaurant) {
      restaurant = await Restaurant.findOne();
    }

    const subtotal = cart && cart.subtotal ? cart.subtotal : cartItemsToUse.reduce((sum, i) => sum + ((i.price || 0) * (i.quantity || 1)), 0);
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

    const settings = await SystemSettings.getSettings();

    discountAmount = Math.round(discountAmount * 100) / 100;
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);

    const deliveryFee = isFreeDelivery
      ? 0
      : settings.baseDeliveryFee !== undefined
      ? settings.baseDeliveryFee
      : (restaurant.deliveryFee || 30);

    const serviceFeePercent = settings.serviceFeePercent !== undefined ? settings.serviceFeePercent : 5;
    const serviceFee = Math.round(((discountedSubtotal * serviceFeePercent) / 100) * 100) / 100;

    const taxPercent = settings.taxPercent !== undefined ? settings.taxPercent : 5;
    const taxes = Math.round(((discountedSubtotal * taxPercent) / 100) * 100) / 100;

    const totalAmount = Math.round((discountedSubtotal + serviceFee + deliveryFee + taxes) * 100) / 100;

    const orderItems = cart.items.map((item) => ({
      menuItem: item.menuItem,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
    }));

    // 3. Create Paid Order Document
    const order = new Order({
      customer: req.user._id,
      restaurant: restaurant._id,
      items: orderItems,
      deliveryAddress,
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      subtotal,
      couponCode: appliedCouponCode,
      discount: discountAmount,
      deliveryFee,
      serviceFee,
      taxes,
      totalAmount,
      status: "placed",
    });

    await order.save();

    // 4. Send Notifications
    try {
      notifyUserDual(
        req.user._id,
        "Online Payment Successful! 💳",
        `Your order #${order._id.toString().slice(-6)} of ₹${totalAmount.toFixed(2)} has been placed at ${restaurant.name}.`,
        `/orders/${order._id}`
      );

      if (restaurant.owner) {
        notifyUserDual(
          restaurant.owner,
          "New Paid Order Received! 🛎️",
          `Paid Online Order #${order._id.toString().slice(-6)} received for ₹${totalAmount.toFixed(2)}.`,
          "/restaurant-owner/dashboard"
        );
      }
    } catch (pushErr) {
      console.error("Error dispatching notifications for Razorpay order:", pushErr);
    }

    // 5. Clear Cart
    cart.items = [];
    cart.restaurant = null;
    await cart.save();

    return res.status(201).json({
      success: true,
      message: "Payment verified and order placed successfully",
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/payment/webhook
 * Server-to-server webhook handler for Razorpay events
 */
const razorpayWebhook = async (req, res, next) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || "cravingza_webhook_secret_123";
    const signature = req.headers["x-razorpay-signature"];

    let rawBody = req.body;
    if (typeof req.body !== "string" && !Buffer.isBuffer(req.body)) {
      rawBody = JSON.stringify(req.body);
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    if (signature && signature === expectedSignature) {
      const payload = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (payload.event === "payment.captured") {
        console.log(`[Razorpay Webhook] Payment Captured for payment ID: ${payload.payload?.payment?.entity?.id}`);
      }
    }

    return res.status(200).json({ status: "ok" });
  } catch (error) {
    console.error("Webhook processing error:", error);
    return res.status(200).json({ status: "ok" });
  }
};

export {
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
};
