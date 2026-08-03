const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { protect, adminOnly } = require("../middlewares/auth");

// All admin routes require token authentication and admin role
router.use(protect, adminOnly);

// Restaurant Approval Management
router.get("/restaurants", adminController.getRestaurants);
router.get("/restaurants/:id", adminController.getRestaurantById);
router.patch("/restaurants/:id/approve", adminController.approveRestaurant);
router.patch("/restaurants/:id/reject", adminController.rejectRestaurant);
router.patch("/restaurants/:id/deactivate", adminController.deactivateRestaurant);
router.patch("/restaurants/:id/reactivate", adminController.reactivateRestaurant);

// Delivery Partner Approval Management
router.get("/delivery", adminController.getDeliveryProfiles);
router.get("/delivery/:id", adminController.getDeliveryProfileById);
router.patch("/delivery/:id/approve", adminController.approveDeliveryPartner);
router.patch("/delivery/:id/reject", adminController.rejectDeliveryPartner);

router.get("/delivery-partners", adminController.getDeliveryProfiles);
router.get("/delivery-partners/:id", adminController.getDeliveryProfileById);
router.patch("/delivery-partners/:id/approve", adminController.approveDeliveryPartner);
router.patch("/delivery-partners/:id/reject", adminController.rejectDeliveryPartner);

// Admin Dashboard Analytics
router.get("/dashboard", adminController.getDashboardData);
router.get("/analytics-stats", adminController.getAnalyticsStats);

// User Management
router.get("/users", adminController.getUsers);
router.get("/users/:id", adminController.getUserById);
router.patch("/users/:id/status", adminController.updateUserStatus);
router.delete("/users/:id", adminController.deleteUser);

// System Settings
router.get("/settings", adminController.getSettings);
router.patch("/settings", adminController.updateSettings);

module.exports = router;
