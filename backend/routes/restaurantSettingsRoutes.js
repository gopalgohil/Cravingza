import express from "express";
const router = express.Router();
import { protect } from "../middlewares/auth.js";
import {
  updateRestaurantProfile,
  updateBusinessHours,
  updateRestaurantStatus,
  updatePayoutDetails,
  getPayoutDetails,
  closeRestaurantPermanently,
  getRestaurantAnalytics,
} from "../controllers/restaurantSettingsController.js";

// All settings & analytics routes require authentication
router.patch("/profile", protect, updateRestaurantProfile);
router.patch("/business-hours", protect, updateBusinessHours);
router.patch("/status", protect, updateRestaurantStatus);
router.patch("/payout-details", protect, updatePayoutDetails);
router.get("/payout-details", protect, getPayoutDetails);
router.patch("/close-permanently", protect, closeRestaurantPermanently);
router.get("/analytics", protect, getRestaurantAnalytics);

export default router;
