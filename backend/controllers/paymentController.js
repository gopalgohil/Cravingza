const crypto = require("crypto");
const razorpayInstance = require("../lib/razorpay");
const Cart = require("../models/Cart");
const Restaurant = require("../models/Restaurant");
const Order = require("../models/Order");

/**
 * POST /api/payment/create-razorpay-order
 * Initiates Razorpay Order for current cart contents
 */
const createRazorpayOrder = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty.",
      });
    }

    const restaurant = await Restaurant.findById(cart.restaurant);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      });
    }

    const subtotal = cart.subtotal;
    const deliveryFee = restaurant.deliveryFee || 0;
    const taxes = subtotal * 0.05; // 5% tax
    const totalAmount = subtotal + deliveryFee + taxes;
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
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, deliveryAddress } = req.body;

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
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty. Order could not be created.",
      });
    }

    const restaurant = await Restaurant.findById(cart.restaurant);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      });
    }

    const subtotal = cart.subtotal;
    const deliveryFee = restaurant.deliveryFee || 0;
    const taxes = subtotal * 0.05;
    const totalAmount = subtotal + deliveryFee + taxes;

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
      deliveryFee,
      taxes,
      totalAmount,
      status: "placed",
    });

    await order.save();

    // 4. Send Notifications
    try {
      const { notifyUserDual } = require("../lib/push");
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

module.exports = {
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
};
