import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Delivery from "../models/Delivery.js";
import DeliveryProfile from "../models/DeliveryProfile.js";

async function cleanupDeliveryOrders() {
  try {
    console.log("Connecting to MongoDB database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB successfully.");

    // Emails specified by user + all delivery partner users
    const targetEmails = [
      "rahul@example.com",
      "gopalg@intrnal.digifux.io",
      "gopalg@internal.digifux.io",
    ];

    // Find users matching target emails or role = "delivery"
    const deliveryUsers = await User.find({
      $or: [
        { email: { $in: targetEmails.map((e) => new RegExp(`^${e}$`, "i")) } },
        { role: "delivery" },
        { role: "driver" },
      ],
    });

    const deliveryUserIds = deliveryUsers.map((u) => u._id);
    console.log(`Found ${deliveryUsers.length} delivery user account(s):`, deliveryUsers.map((u) => u.email));

    // 1. Delete all Delivery records for these delivery partners
    const deletedDeliveriesResult = await Delivery.deleteMany({
      $or: [
        { deliveryPartner: { $in: deliveryUserIds } },
        { deliveryPartner: { $exists: true } },
      ],
    });
    console.log(`Deleted ${deletedDeliveriesResult.deletedCount} Delivery record(s).`);

    // 2. Unassign deliveryPartner from all Orders and reset status if assigned
    const resetOrdersResult = await Order.updateMany(
      { deliveryPartner: { $ne: null } },
      { $set: { deliveryPartner: null } }
    );
    console.log(`Reset deliveryPartner assignment on ${resetOrdersResult.modifiedCount} Order(s).`);

    // 3. Reset delivery profiles online status & statistics if needed
    if (deliveryUserIds.length > 0) {
      await DeliveryProfile.updateMany(
        { user: { $in: deliveryUserIds } },
        { $set: { isOnline: false } }
      );
      console.log(`Reset DeliveryProfile status for ${deliveryUserIds.length} partner(s).`);
    }

    console.log("✅ Cleanup complete! All delivery partner orders and delivery records removed. Dashboard is fresh.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Cleanup Error:", error);
    process.exit(1);
  }
}

cleanupDeliveryOrders();
