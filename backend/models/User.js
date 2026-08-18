import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [3, "Name must be at least 3 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    otpHash: {
      type: String,
      default: null,
    },
    otpExpires: {
      type: Date,
      default: null,
    },
    otpResendAttempts: {
      type: Number,
      default: 0,
    },
    otpLastSent: {
      type: Date,
      default: null,
    },
    resetPasswordOtpHash: {
      type: String,
      default: null,
    },
    resetPasswordOtpExpires: {
      type: Date,
      default: null,
    },
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
    role: {
      type: String,
      default: "customer",
    },
    avatar: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["active", "suspended", "deleted"],
      default: "active",
    },
    pushSubscription: {
      type: Object,
      default: null,
    },
    addresses: [
      {
        label: {
          type: String,
          enum: ["Home", "Work", "Other"],
          default: "Home",
        },
        addressLine: {
          type: String,
          required: [true, "Address line is required"],
        },
        city: {
          type: String,
          required: [true, "City is required"],
        },
        pincode: {
          type: String,
        },
        lat: {
          type: Number,
        },
        lng: {
          type: Number,
        },
        isDefault: {
          type: Boolean,
          default: false,
        },
      },
    ],
    notificationPreferences: {
      orderUpdates: {
        type: Boolean,
        default: true,
      },
      promotionalOffers: {
        type: Boolean,
        default: true,
      },
      newRestaurantAlerts: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // Avoid double hashing if already hashed manually
  if (this.password.startsWith("$2a$") || this.password.startsWith("$2b$")) {
    return next();
  }
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

export default mongoose.model("User", userSchema);
