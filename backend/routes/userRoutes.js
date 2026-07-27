const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const {
  updateProfile,
  updatePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  updateNotifications,
  deleteAccount,
} = require("../controllers/userController");

router.patch("/profile", protect, updateProfile);
router.patch("/password", protect, updatePassword);
router.get("/addresses", protect, getAddresses);
router.post("/addresses", protect, addAddress);
router.patch("/addresses/:addressId", protect, updateAddress);
router.delete("/addresses/:addressId", protect, deleteAddress);
router.patch("/notifications", protect, updateNotifications);
router.delete("/account", protect, deleteAccount);

module.exports = router;
