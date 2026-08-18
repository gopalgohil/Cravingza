import express from "express";
const router = express.Router();
import { protect } from "../middlewares/auth.js";
import {
  updateProfile,
  updatePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  updateNotifications,
  deleteAccount,
} from "../controllers/userController.js";

router.patch("/profile", protect, updateProfile);
router.patch("/password", protect, updatePassword);
router.get("/addresses", protect, getAddresses);
router.post("/addresses", protect, addAddress);
router.patch("/addresses/:addressId", protect, updateAddress);
router.delete("/addresses/:addressId", protect, deleteAddress);
router.patch("/notifications", protect, updateNotifications);
router.delete("/account", protect, deleteAccount);

export default router;
