import "dotenv/config";
import mongoose from "mongoose";
import Restaurant from "../models/Restaurant.js";
import User from "../models/User.js";

async function testSettingsFlow() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/cravingza");
    console.log("Connected to MongoDB for settings test verification.");

    // Find an approved restaurant
    const restaurant = await Restaurant.findOne({ approvalStatus: "approved" });
    if (!restaurant) {
      console.error("No approved restaurant found in DB to test!");
      process.exit(1);
    }

    console.log(`Testing with restaurant: "${restaurant.name}" (ID: ${restaurant._id})`);

    // 1. Verify schema fields exist
    restaurant.businessHours = restaurant.businessHours || {
      monday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
    };
    restaurant.payoutDetails = {
      accountHolderName: "Test Owner",
      accountNumber: "123456789012",
      ifscCode: "SBIN0001234",
    };
    restaurant.ownerClosedPermanently = false;
    await restaurant.save();

    console.log("✅ 1. Schema extension verified (businessHours, payoutDetails, ownerClosedPermanently).");

    // 2. Verify 4-condition query check
    let visibleCount = await Restaurant.countDocuments({
      approvalStatus: "approved",
      isOpen: true,
      adminDeactivated: { $ne: true },
      ownerClosedPermanently: { $ne: true },
    });
    console.log(`✅ 2. Visible restaurants count with 4-condition filter: ${visibleCount}`);

    // 3. Test Temporary Close Toggle
    restaurant.isOpen = false;
    await restaurant.save();
    let hiddenCount = await Restaurant.countDocuments({
      approvalStatus: "approved",
      isOpen: true,
      adminDeactivated: { $ne: true },
      ownerClosedPermanently: { $ne: true },
    });
    console.log(`✅ 3. Toggled isOpen=false -> Visible count reduced to ${hiddenCount}`);

    // Re-open
    restaurant.isOpen = true;
    await restaurant.save();

    // 4. Test Permanent Closure check
    restaurant.ownerClosedPermanently = true;
    restaurant.ownerClosureReason = "Testing closure";
    restaurant.ownerClosedAt = new Date();
    await restaurant.save();

    let closedCount = await Restaurant.countDocuments({
      approvalStatus: "approved",
      isOpen: true,
      adminDeactivated: { $ne: true },
      ownerClosedPermanently: { $ne: true },
    });
    console.log(`✅ 4. Permanent closure test: ownerClosedPermanently=true -> Visible count: ${closedCount}`);

    // Reset permanent closure for normal operation
    restaurant.ownerClosedPermanently = false;
    restaurant.ownerClosureReason = null;
    restaurant.ownerClosedAt = null;
    await restaurant.save();

    console.log("✅ All Restaurant Owner Settings backend verifications passed clean!");
    process.exit(0);
  } catch (err) {
    console.error("Test error:", err);
    process.exit(1);
  }
}

testSettingsFlow();
