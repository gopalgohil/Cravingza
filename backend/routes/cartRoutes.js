import express from "express";
const router = express.Router();
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  replaceCart,
} from "../controllers/cartController.js";
import { protect } from "../middlewares/auth.js";

// Protect all cart routes
router.use(protect);

router.get("/", getCart);
router.post("/add", addToCart);
router.patch("/update", updateCartItem);
router.delete("/remove/:menuItemId", removeCartItem);
router.delete("/clear", clearCart);
router.post("/replace", replaceCart);

export default router;
