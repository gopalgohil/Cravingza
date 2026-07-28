const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const {
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
} = require("../controllers/deliveryController");

router.post("/apply", protect, applyAsDeliveryPartner);
router.get("/my-application", protect, getMyDeliveryApplication);
router.post("/reapply", protect, reapplyAsDeliveryPartner);

router.patch("/status", protect, updateOnlineStatus);
router.get("/dashboard", protect, getDashboardData);
router.get("/earnings", protect, getEarningsData);

// Order Fulfillment Routes
router.get("/nearby-orders", protect, getNearbyOrders);
router.post("/orders/:orderId/accept", protect, acceptOrder);
router.get("/active", protect, getActiveDelivery);
router.patch("/active/:deliveryId/status", protect, updateActiveDeliveryStatus);

// Web Push Notification Registration
router.post("/push-subscribe", protect, subscribePush);

module.exports = router;
