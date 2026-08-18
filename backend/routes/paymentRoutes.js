import express from "express";
const router = express.Router();
import { protect } from "../middlewares/auth.js";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  razorpayWebhook,
} from "../controllers/paymentController.js";

router.post("/create-razorpay-order", protect, createRazorpayOrder);
router.post("/verify", protect, verifyRazorpayPayment);
router.post("/webhook", express.raw({ type: "application/json" }), razorpayWebhook);

export default router;
