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

// Merchant routes (Define first to avoid /:id collision)
router.get("/merchant/incoming", getMerchantOrders);
router.patch("/merchant/:id/status", updateOrderStatus);

// Customer/General routes
router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrderById);
router.patch("/:id/cancel", cancelOrder);

module.exports = router;
