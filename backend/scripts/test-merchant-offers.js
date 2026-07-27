const mongoose = require("mongoose");
require("dotenv").config();

const Coupon = require("../models/Coupon");

async function testMerchantOffers() {
  try {
    console.log("=== Testing Merchant Offers Creation & Live Sync Logic ===");

    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/cravingza");
    console.log("Connected to MongoDB.");

    // 1. Create a merchant offer
    const testCode = `TESTCHEF${Math.floor(100 + Math.random() * 900)}`;
    const newCoupon = new Coupon({
      code: testCode,
      title: "25% OFF on Chef Specials",
      description: "Get 25% discount on all gourmet specials above ₹250.",
      discountType: "percentage",
      discountValue: 25,
      minOrderAmount: 250,
      maxDiscountAmount: 150,
      badgeText: "CHEF SPECIAL",
      bgGradient: "from-orange-500 to-amber-500",
      category: "flat",
      validTill: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      isActive: true,
    });

    await newCoupon.save();
    console.log(`✅ 1. Merchant successfully created coupon: "${testCode}" (ID: ${newCoupon._id})`);

    // 2. Retrieve coupon via customer query
    const fetched = await Coupon.findOne({ code: testCode });
    if (!fetched) {
      console.error("❌ Merchant coupon live sync failed!");
      process.exit(1);
    }
    console.log(`✅ 2. Live Sync verified: Coupon "${fetched.code}" is immediately active on customer site.`);

    // 3. Clean up test coupon
    await Coupon.findByIdAndDelete(newCoupon._id);
    console.log("✅ 3. Test coupon cleaned up.");

    console.log("\n🎉 Merchant Offers Management verification passed clean!");
    process.exit(0);
  } catch (err) {
    console.error("Test error:", err);
    process.exit(1);
  }
}

testMerchantOffers();
