import express from "express";
const router = express.Router();
import { protect } from "../middlewares/auth.js";
import {
  getOffers,
  applyCoupon,
  getMerchantOffers,
  createMerchantOffer,
  deleteMerchantOffer,
} from "../controllers/offerController.js";

/**
 * @swagger
 * tags:
 *   name: Offers & Coupons
 *   description: Promo Codes, Discount Vouchers, and Coupon Validation
 */

/**
 * @swagger
 * /offers:
 *   get:
 *     summary: Get all active promotional offers & discount coupons
 *     tags: [Offers & Coupons]
 *     responses:
 *       200:
 *         description: Array of active coupons
 */
router.get("/", getOffers);

/**
 * @swagger
 * /offers/apply:
 *   post:
 *     summary: Validate and apply coupon code to cart
 *     tags: [Offers & Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - cartTotal
 *             properties:
 *               code:
 *                 type: string
 *                 example: CRAVE50
 *               cartTotal:
 *                 type: number
 *                 example: 300
 *     responses:
 *       200:
 *         description: Discount applied successfully
 */
router.post("/apply", protect, applyCoupon);

// Merchant / Admin Offer Routes
router.get("/merchant", protect, getMerchantOffers);
router.post("/merchant", protect, createMerchantOffer);
router.delete("/merchant/:id", protect, deleteMerchantOffer);

export default router;
