const express = require("express");
const router = express.Router();
const {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  replaceCart,
} = require("../controllers/cartController");
const { protect } = require("../middlewares/auth");

// Protect all cart routes
router.use(protect);

router.get("/", getCart);
router.post("/add", addToCart);
router.patch("/update", updateCartItem);
router.delete("/remove/:menuItemId", removeCartItem);
router.delete("/clear", clearCart);
router.post("/replace", replaceCart);

module.exports = router;
