import mongoose from "mongoose";

const deliverySchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: [true, "Order reference is required"],
    },
    deliveryPartner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Delivery partner user reference is required"],
    },
    status: {
      type: String,
      enum: ["assigned", "picked_up", "out_for_delivery", "delivered", "cancelled"],
      default: "assigned",
    },
    earnings: {
      type: Number,
      default: 0,
      min: [0, "Earnings cannot be negative"],
    },
    distanceKm: {
      type: Number,
      default: 0,
      min: [0, "Distance cannot be negative"],
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    pickedUpAt: {
      type: Date,
      default: null,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Delivery", deliverySchema);
