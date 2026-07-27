const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
    minOrderAmount: {
      type: Number,
      default: 0,
    },
    maxDiscountAmount: {
      type: Number,
      default: null,
    },
    badgeText: {
      type: String,
      default: "SPECIAL OFFER",
    },
    bgGradient: {
      type: String,
      default: "from-orange-500 to-amber-500",
    },
    validTill: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    category: {
      type: String,
      enum: ["flat", "payment", "delivery", "festive"],
      default: "flat",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
