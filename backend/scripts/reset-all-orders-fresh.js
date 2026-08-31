import "dotenv/config";
import mongoose from "mongoose";
import Order from "../models/Order.js";
import Delivery from "../models/Delivery.js";
import Cart from "../models/Cart.js";
import Notification from "../models/Notification.js";
import DeliveryProfile from "../models/DeliveryProfile.js";
import Review from "../models/Review.js";

async function resetAllOrdersFresh() {
  try {
    console.log("Connecting to MongoDB database...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB successfully.");

    // 1. Delete ALL Order records
    const ordersResult = await Order.deleteMany({});
    console.log(`Deleted ${ordersResult.deletedCount} Order(s).`);

    // 2. Delete ALL Delivery records
    const deliveriesResult = await Delivery.deleteMany({});
    console.log(`Deleted ${deliveriesResult.deletedCount} Delivery record(s).`);

    // 3. Clear ALL Cart items across all users
    const cartsResult = await Cart.updateMany(
      {},
      { $set: { items: [], restaurant: null } }
    );
    console.log(`Cleared ${cartsResult.modifiedCount} Cart(s).`);

    // 4. Delete order-related notifications
    const notifsResult = await Notification.deleteMany({
      $or: [
        { type: "order" },
        { type: "delivery" },
        { title: { $regex: /order/i } },
      ],
    });
    console.log(`Deleted ${notifsResult.deletedCount} Notification(s).`);

    // 5. Delete order-related reviews (optional reset)
    const reviewsResult = await Review.deleteMany({ order: { $exists: true } });
    console.log(`Reset ${reviewsResult.deletedCount} Review(s).`);

    // 6. Reset all delivery partner statuses to offline
    const profileResult = await DeliveryProfile.updateMany(
      {},
      { $set: { isOnline: false } }
    );
    console.log(`Reset ${profileResult.modifiedCount} DeliveryProfile(s) to offline.`);

    console.log("🎉 Complete Platform Reset Success! MongoDB has 0 orders. Everything is fresh for customers, owners, and delivery partners!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Reset Error:", error);
    process.exit(1);
  }
}

resetAllOrdersFresh();
