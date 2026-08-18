import "dotenv/config";
import mongoose from "mongoose";
import DeliveryProfile from "../models/DeliveryProfile.js";
import User from "../models/User.js";

async function run() {
  try {
    console.log("Connecting to MongoDB database...");
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/cravingza");
    console.log("Connected successfully.\n");

    // 1. Approve all existing pending DeliveryProfile entries
    const updatedPending = await DeliveryProfile.updateMany(
      { approvalStatus: { $ne: "approved" } },
      { $set: { approvalStatus: "approved", isOnline: true } }
    );
    console.log(`✅ Approved ${updatedPending.modifiedCount || 0} existing DeliveryProfile(s).`);

    // 2. Find any User with role 'driver' or 'delivery_partner' who doesn't have a DeliveryProfile yet
    const driverUsers = await User.find({ role: { $in: ["driver", "delivery_partner"] } });
    let createdCount = 0;

    for (const driver of driverUsers) {
      const existing = await DeliveryProfile.findOne({ user: driver._id });
      if (!existing) {
        await DeliveryProfile.create({
          user: driver._id,
          fullName: driver.name || "Test Delivery Boy",
          phone: driver.phone || "9876543210",
          city: "Metro City",
          vehicleType: "Bike",
          vehicleNumber: "MH-12-AB-1234",
          licenseNumber: "DL-1234567890",
          approvalStatus: "approved",
          isOnline: true,
        });
        createdCount++;
      }
    }

    console.log(`✅ Auto-created & Approved ${createdCount} missing DeliveryProfile(s) for driver user accounts.`);
    console.log("\n🎉 All Delivery Boys are now APPROVED and ONLINE!");
  } catch (error) {
    console.error("Error approving drivers:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

run();
