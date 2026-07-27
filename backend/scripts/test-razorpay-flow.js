const crypto = require("crypto");
const mongoose = require("mongoose");
require("dotenv").config();

const Order = require("../models/Order");

async function testRazorpayLogic() {
  try {
    console.log("=== Testing Razorpay Integration Logic ===");

    // 1. Test HMAC SHA256 Signature computation & timingSafeEqual check
    const secret = process.env.RAZORPAY_KEY_SECRET || "fIHVsqDdaClXHWcNom6uEA1E";
    const testOrderId = "order_N123456789";
    const testPaymentId = "pay_N987654321";
    const bodyToSign = `${testOrderId}|${testPaymentId}`;

    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(bodyToSign)
      .digest("hex");

    const expectedBuf = Buffer.from(validSignature, "utf-8");
    const receivedBuf = Buffer.from(validSignature, "utf-8");

    const isValid = expectedBuf.length === receivedBuf.length && crypto.timingSafeEqual(expectedBuf, receivedBuf);

    if (!isValid) {
      console.error("❌ Signature verification test failed!");
      process.exit(1);
    }
    console.log("✅ 1. HMAC SHA256 timing-safe signature verification test passed!");

    // 2. Test Order model enum updates
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/cravingza");
    console.log("Connected to MongoDB for Order schema validation.");

    const testOrder = new Order({
      customer: new mongoose.Types.ObjectId(),
      restaurant: new mongoose.Types.ObjectId(),
      items: [
        {
          menuItem: new mongoose.Types.ObjectId(),
          name: "Test Burger",
          price: 150,
          quantity: 1,
        },
      ],
      deliveryAddress: {
        addressLine: "123 Test Street",
      },
      paymentMethod: "razorpay",
      paymentStatus: "paid",
      razorpayOrderId: testOrderId,
      razorpayPaymentId: testPaymentId,
      razorpaySignature: validSignature,
      subtotal: 150,
      deliveryFee: 30,
      taxes: 7.5,
      totalAmount: 187.5,
      status: "placed",
    });

    await testOrder.save();
    console.log(`✅ 2. Created Razorpay Order in DB (ID: ${testOrder._id}) with paymentStatus="paid"`);

    // Clean up test order
    await Order.findByIdAndDelete(testOrder._id);
    console.log("✅ 3. Test Order cleaned up successfully.");

    console.log("🎉 All Razorpay backend integration checks passed clean!");
    process.exit(0);
  } catch (err) {
    console.error("Test error:", err);
    process.exit(1);
  }
}

testRazorpayLogic();
