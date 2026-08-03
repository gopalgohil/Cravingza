const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { protect, adminOnly } = require("../middlewares/auth");

// All admin routes require token authentication and admin role
router.use(protect, adminOnly);

/**
 * @swagger
 * tags:
 *   name: Super Admin
 *   description: Platform Settings, Commission Rates, Dashboard Analytics, Vendor & Rider Approvals
 */

/**
 * @swagger
 * /admin/settings:
 *   get:
 *     summary: Get live Super Admin system settings (Commissions, Delivery fees, Tax %)
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System settings object
 *   patch:
 *     summary: Update Commission rates, Base delivery fee, Service fee & Tax
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               restaurantCommissionRate:
 *                 type: number
 *                 example: 15
 *               baseDeliveryFee:
 *                 type: number
 *                 example: 30
 *               serviceFeePercent:
 *                 type: number
 *                 example: 5
 *               taxPercent:
 *                 type: number
 *                 example: 5
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */
router.get("/settings", adminController.getSettings);
router.patch("/settings", adminController.updateSettings);

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     summary: Get Super Admin dashboard stats and revenue breakdown
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard metrics
 */
router.get("/dashboard", adminController.getDashboardData);

/**
 * @swagger
 * /admin/analytics-stats:
 *   get:
 *     summary: Get platform analytics and growth metrics
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform analytics stats
 */
router.get("/analytics-stats", adminController.getAnalyticsStats);

/**
 * @swagger
 * /admin/restaurants:
 *   get:
 *     summary: Get all pending & approved restaurant applications
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of restaurants
 */
router.get("/restaurants", adminController.getRestaurants);
router.get("/restaurants/:id", adminController.getRestaurantById);
router.patch("/restaurants/:id/approve", adminController.approveRestaurant);
router.patch("/restaurants/:id/reject", adminController.rejectRestaurant);
router.patch("/restaurants/:id/deactivate", adminController.deactivateRestaurant);
router.patch("/restaurants/:id/reactivate", adminController.reactivateRestaurant);

/**
 * @swagger
 * /admin/delivery-partners:
 *   get:
 *     summary: Get delivery partner applications for verification
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Delivery profiles list
 */
router.get("/delivery", adminController.getDeliveryProfiles);
router.get("/delivery/:id", adminController.getDeliveryProfileById);
router.patch("/delivery/:id/approve", adminController.approveDeliveryPartner);
router.patch("/delivery/:id/reject", adminController.rejectDeliveryPartner);

router.get("/delivery-partners", adminController.getDeliveryProfiles);
router.get("/delivery-partners/:id", adminController.getDeliveryProfileById);
router.patch("/delivery-partners/:id/approve", adminController.approveDeliveryPartner);
router.patch("/delivery-partners/:id/reject", adminController.rejectDeliveryPartner);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all platform users (Customers, Owners, Delivery Partners)
 *     tags: [Super Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Users list
 */
router.get("/users", adminController.getUsers);
router.get("/users/:id", adminController.getUserById);
router.patch("/users/:id/status", adminController.updateUserStatus);
router.delete("/users/:id", adminController.deleteUser);

module.exports = router;
