const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const {
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
} = require("../controllers/paymentController");

router.post("/create-razorpay-order", protect, createRazorpayOrder);
router.post("/verify", protect, verifyRazorpayPayment);
router.post("/webhook", express.raw({ type: "application/json" }), razorpayWebhook);

module.exports = router;
