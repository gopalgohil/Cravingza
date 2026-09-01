import mongoose from "mongoose";

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

    // ── Dynamic Restaurant Offer & Promo Settings ────────────────
    offerDiscountPercentage: { type: Number, default: 30 },
    offerMaxDiscount: { type: Number, default: 150 },
    offerMinOrderAmount: { type: Number, default: 199 },
    offerLabel: { type: String, default: "30% OFF UPTO ₹150" },

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
      type: Object,
      select: false,
      default: {
        monday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
        tuesday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
        wednesday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
        thursday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
        friday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
        saturday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
        sunday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
      },
    },
    payoutDetails: {
      type: Object,
      select: false,
      default: {
        accountHolderName: "",
        accountNumber: "",
        ifscCode: "",
      },
    },
    ownerClosedPermanently: { type: Boolean, default: false },
    ownerClosureReason: { type: String, default: null },
    ownerClosedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("Restaurant", restaurantSchema);
