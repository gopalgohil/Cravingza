import mongoose from "mongoose";

const systemSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "global_settings",
      unique: true,
    },
    platformName: {
      type: String,
      default: "Cravingza",
    },
    supportEmail: {
      type: String,
      default: "support@cravingza.com",
    },
    supportPhone: {
      type: String,
      default: "+91 98765 43210",
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    restaurantCommissionRate: {
      type: Number,
      default: 15, // 15%
    },
    baseDeliveryFee: {
      type: Number,
      default: 30, // ₹30 (100% pass-through to delivery partner)
    },
    serviceFeePercent: {
      type: Number,
      default: 5, // 5% platform convenience fee for Super Admin
    },
    taxPercent: {
      type: Number,
      default: 5, // 5% GST tax ratio
    },
  },
  { timestamps: true }
);

// Helper static method to get or create initial settings singleton
systemSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ key: "global_settings" });
  if (!settings) {
    settings = await this.create({ key: "global_settings" });
  }
  return settings;
};

export default mongoose.model("SystemSettings", systemSettingsSchema);
