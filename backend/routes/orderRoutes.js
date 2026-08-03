const express = require("express");
const router = express.Router();
const {
  createOrder,
  getOrders,
  getOrderById,
  getMerchantOrders,
  updateOrderStatus,
  cancelOrder,
} = require("../controllers/orderController");
const { protect } = require("../middlewares/auth");

// Protect all order routes
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order Placement, Tracking, Merchant Acceptance, and Auto-Refund Cancellations
 */

/**
 * @swagger
 * /orders/merchant/incoming:
 *   get:
 *     summary: Get all incoming orders for restaurant owner
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of merchant orders
 */
router.get("/merchant/incoming", getMerchantOrders);

/**
 * @swagger
 * /orders/merchant/{id}/status:
 *   patch:
 *     summary: Update order status (Accepted, Preparing, Cancelled with Auto-Refund, etc.)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order Mongo ID
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
 *                 enum: [accepted, preparing, ready_for_pickup, out_for_delivery, delivered, cancelled]
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated successfully
 */
router.patch("/merchant/:id/status", updateOrderStatus);

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create and place a new food order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - restaurant
 *               - items
 *               - deliveryAddress
 *               - paymentMethod
 *             properties:
 *               restaurant:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *               deliveryAddress:
 *                 type: object
 *               paymentMethod:
 *                 type: string
 *                 enum: [cod, razorpay]
 *     responses:
 *       201:
 *         description: Order created successfully
 *   get:
 *     summary: Get list of orders for logged-in customer
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of customer orders
 */
router.post("/", createOrder);
router.get("/", getOrders);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order details by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Single Order Details
 */
router.get("/:id", getOrderById);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   patch:
 *     summary: Cancel order (1-minute grace period full refund vs 100% cancellation charge)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order cancelled (with refund status)
 */
router.patch("/:id/cancel", cancelOrder);

module.exports = router;
