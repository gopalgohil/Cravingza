import express from "express";
const router = express.Router();
import { protect } from "../middlewares/auth.js";
import {
  applyAsDeliveryPartner,
  getMyDeliveryApplication,
  reapplyAsDeliveryPartner,
  updateOnlineStatus,
  getDashboardData,
  getNearbyOrders,
  acceptOrder,
  getActiveDelivery,
  updateActiveDeliveryStatus,
  subscribePush,
  getEarningsData,
  updateDeliveryProfile,
  declineOrder,
} from "../controllers/deliveryController.js";

/**
 * @swagger
 * tags:
 *   name: Delivery Partner
 *   description: Rider Onboarding, Live Nearby Order Pickup, Route Tracking, and Earnings
 */

/**
 * @swagger
 * /delivery/nearby-orders:
 *   get:
 *     summary: Get nearby available orders for pickup (Rider live polling)
 *     tags: [Delivery Partner]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of nearby ready orders
 */
router.get("/nearby-orders", protect, getNearbyOrders);

/**
 * @swagger
 * /delivery/orders/{orderId}/accept:
 *   post:
 *     summary: Accept a ready order for delivery
 *     tags: [Delivery Partner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order assigned to rider
 */
router.post("/orders/:orderId/accept", protect, acceptOrder);

/**
 * @swagger
 * /delivery/active:
 *   get:
 *     summary: Get current active delivery assignment for rider
 *     tags: [Delivery Partner]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active delivery assignment details
 */
router.get("/active", protect, getActiveDelivery);

/**
 * @swagger
 * /delivery/active/{deliveryId}/status:
 *   patch:
 *     summary: Update active delivery status (picked_up, out_for_delivery, delivered)
 *     tags: [Delivery Partner]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deliveryId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [picked_up, out_for_delivery, delivered]
 *     responses:
 *       200:
 *         description: Delivery status updated successfully
 */
router.patch("/active/:deliveryId/status", protect, updateActiveDeliveryStatus);

/**
 * @swagger
 * /delivery/dashboard:
 *   get:
 *     summary: Get Delivery Partner dashboard stats
 *     tags: [Delivery Partner]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rider dashboard metrics
 */
router.get("/dashboard", protect, getDashboardData);

/**
 * @swagger
 * /delivery/earnings:
 *   get:
 *     summary: Get Rider daily/weekly earnings breakdown
 *     tags: [Delivery Partner]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rider earnings metrics
 */
router.get("/earnings", protect, getEarningsData);

/**
 * @swagger
 * /delivery/status:
 *   patch:
 *     summary: Toggle Rider Online / Offline status
 *     tags: [Delivery Partner]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isOnline
 *             properties:
 *               isOnline:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Online status updated
 */
router.patch("/status", protect, updateOnlineStatus);

router.post("/apply", protect, applyAsDeliveryPartner);
router.get("/my-application", protect, getMyDeliveryApplication);
router.post("/reapply", protect, reapplyAsDeliveryPartner);
router.post("/push-subscribe", protect, subscribePush);
router.patch("/profile", protect, updateDeliveryProfile);
router.post("/orders/:orderId/decline", protect, declineOrder);

export default router;
