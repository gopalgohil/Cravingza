const mongoose = require("mongoose");

const deliveryProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      trim: true,
    },
    vehicleType: {
      type: String,
      enum: ["bicycle", "motorcycle", "car", "electric_scooter"],
      required: [true, "Vehicle type is required"],
    },
    vehicleNumber: {
      type: String,
      trim: true,
      default: "",
    },
    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      trim: true,
    },
    documents: {
      drivingLicense: {
        type: String,
        default: "",
      },
      aadhaarCard: {
        type: String,
        required: [true, "Aadhaar Card is required"],
      },
    },
    bankDetails: {
      accountHolderName: {
        type: String,
        required: [true, "Account holder name is required"],
      },
      accountNumber: {
        type: String,
        required: [true, "Account number is required"],
      },
      ifscCode: {
        type: String,
        required: [true, "IFSC code is required"],
      },
      bankName: {
        type: String,
        required: [true, "Bank name is required"],
      },
    },
    approvalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    submittedAt: {
      type: Date,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    pushSubscription: {
      type: Object,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeliveryProfile", deliveryProfileSchema);
