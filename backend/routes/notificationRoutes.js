import express from "express";
const router = express.Router();
import { protect } from "../middlewares/auth.js";
import {
  getNotifications,
  markAsRead,
  clearNotifications,
} from "../controllers/notificationController.js";

router.use(protect);

router.get("/", getNotifications);
router.patch("/read", markAsRead);
router.delete("/", clearNotifications);

export default router;
