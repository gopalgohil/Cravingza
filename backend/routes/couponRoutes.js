import express from "express";
const router = express.Router();
import { protect } from "../middlewares/auth.js";
import { applyCoupon, getOffers } from "../controllers/offerController.js";

/**
 * @swagger
 * /coupons/apply:
 *   post:
 *     summary: Validate and apply coupon code to cart
 *     tags: [Offers & Coupons]
 */
router.post("/apply", applyCoupon);
router.get("/", getOffers);

export default router;
