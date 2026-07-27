const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const {
  getOffers,
  applyCoupon,
  getMerchantOffers,
  createMerchantOffer,
  deleteMerchantOffer,
} = require("../controllers/offerController");

router.get("/", getOffers);
router.post("/apply", protect, applyCoupon);

// Merchant / Admin Offer Routes
router.get("/merchant", protect, getMerchantOffers);
router.post("/merchant", protect, createMerchantOffer);
router.delete("/merchant/:id", protect, deleteMerchantOffer);

module.exports = router;
