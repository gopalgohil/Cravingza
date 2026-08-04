const mongoose = require("mongoose");

const restaurantSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    name: {
      type: String,
      required: [true, "Restaurant name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    cuisineTags: [
      {
        type: String,
        trim: true,
      },
    ],
    image: {
      type: String,
      default: "",
    },
    location: {
      address: { type: String, default: "" },
      city: { type: String, default: "" },
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    deliveryTime: { type: String, default: "25-35 min" },
    deliveryFee: { type: Number, default: 0 },
    minOrderAmount: { type: Number, default: 0 },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    isOpen: { type: Boolean, default: true },
    adminDeactivated: { type: Boolean, default: false },
    deactivationReason: { type: String, default: null },
    deactivatedAt: { type: Date },
    deactivatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: { type: Date },
    rejectionReason: { type: String, default: null },

    // ── Application Verification Documents & Contact ─────────────
    documents: {
      fssaiLicense: { type: String, default: "" },
      businessRegistration: { type: String, default: "" },
    },
    pincode: { type: String, default: "" },
    ownerPhone: { type: String, default: "" },

    // ── Owner Settings & Business Fields ─────────────────────────
    businessHours: {
      monday: { isOpen: { type: Boolean, default: true }, openTime: { type: String, default: "09:00" }, closeTime: { type: String, default: "22:00" } },
      tuesday: { isOpen: { type: Boolean, default: true }, openTime: { type: String, default: "09:00" }, closeTime: { type: String, default: "22:00" } },
      wednesday: { isOpen: { type: Boolean, default: true }, openTime: { type: String, default: "09:00" }, closeTime: { type: String, default: "22:00" } },
      thursday: { isOpen: { type: Boolean, default: true }, openTime: { type: String, default: "09:00" }, closeTime: { type: String, default: "22:00" } },
      friday: { isOpen: { type: Boolean, default: true }, openTime: { type: String, default: "09:00" }, closeTime: { type: String, default: "22:00" } },
      saturday: { isOpen: { type: Boolean, default: true }, openTime: { type: String, default: "09:00" }, closeTime: { type: String, default: "22:00" } },
      sunday: { isOpen: { type: Boolean, default: true }, openTime: { type: String, default: "09:00" }, closeTime: { type: String, default: "22:00" } },
    },
    payoutDetails: {
      accountHolderName: { type: String, default: "" },
      accountNumber: { type: String, default: "" },
      ifscCode: { type: String, default: "" },
    },
    ownerClosedPermanently: { type: Boolean, default: false },
    ownerClosureReason: { type: String, default: null },
    ownerClosedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Restaurant", restaurantSchema);
