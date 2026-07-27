const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const {
  getNotifications,
  markAsRead,
  clearNotifications,
} = require("../controllers/notificationController");

router.use(protect);

router.get("/", getNotifications);
router.patch("/read", markAsRead);
router.delete("/", clearNotifications);

module.exports = router;
