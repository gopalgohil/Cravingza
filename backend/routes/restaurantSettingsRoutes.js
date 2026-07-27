const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const {
  updateRestaurantProfile,
  updateBusinessHours,
  updateRestaurantStatus,
  updatePayoutDetails,
  getPayoutDetails,
  closeRestaurantPermanently,
} = require("../controllers/restaurantSettingsController");

// All settings routes require authentication
router.patch("/profile", protect, updateRestaurantProfile);
router.patch("/business-hours", protect, updateBusinessHours);
router.patch("/status", protect, updateRestaurantStatus);
router.patch("/payout-details", protect, updatePayoutDetails);
router.get("/payout-details", protect, getPayoutDetails);
router.patch("/close-permanently", protect, closeRestaurantPermanently);

module.exports = router;
