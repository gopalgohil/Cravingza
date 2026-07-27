const path = require("path");
const backendPath = path.resolve(__dirname, "../backend");
require(path.join(backendPath, "node_modules/dotenv")).config({ path: path.join(backendPath, ".env") });

const mongoose = require(path.join(backendPath, "node_modules/mongoose"));
const bcrypt = require(path.join(backendPath, "node_modules/bcryptjs"));
const User = require(path.join(backendPath, "models/User"));

const API_BASE = "http://localhost:5000/api";

async function runTestFlow() {
  console.log("=== STARTING ORDER TRACKING & CANCELLATION FLOW TEST ===");

  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/cravingza");
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    // Unlock customer rohan
    await User.updateOne(
      { email: "rohan@example.com" },
      { $set: { password: hashedPassword, loginAttempts: 0, lockUntil: null, isVerified: true } },
      { upsert: true }
    );

    // Get a restaurant owner email
    const restRes = await fetch(`${API_BASE}/restaurants`).then((r) => r.json());
    const restaurantSummary = restRes.data[0];
    const restDetailRes = await fetch(`${API_BASE}/restaurants/${restaurantSummary._id}`).then((r) => r.json());
    const restaurant = restDetailRes.data?.restaurant || restDetailRes.data || restDetailRes;

    const ownerUser = await User.findById(restaurant.owner);
    if (ownerUser) {
      await User.updateOne({ _id: ownerUser._id }, { $set: { password: hashedPassword, loginAttempts: 0, lockUntil: null, isVerified: true } });
    }
    await mongoose.disconnect();

    const ownerEmail = ownerUser ? ownerUser.email : "owner1@example.com";
    console.log(`Using Restaurant Owner email: ${ownerEmail}`);

    // 1. Login Customer
    const custLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "rohan@example.com", password: "password123" }),
    });

    const setCookie = custLoginRes.headers.get("set-cookie");
    const tokenMatch = setCookie ? setCookie.match(/token=([^;]+)/) : null;
    const custToken = tokenMatch ? tokenMatch[1] : null;

    const custHeader = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${custToken}`,
      Cookie: setCookie || "",
    };
    console.log("✅ Customer logged in successfully.");

    const menuList = restDetailRes.data?.menu || restaurantSummary.menu || [];
    const menuItem = menuList[0];
    console.log(`Using Restaurant: ${restaurant.name} (${restaurant._id})`);
    console.log(`Using Menu Item: ${menuItem.name} (${menuItem._id})`);

    // 2. Add to Cart & Place Test Order #1
    await fetch(`${API_BASE}/cart/add`, {
      method: "POST",
      headers: custHeader,
      body: JSON.stringify({ menuItemId: menuItem._id, quantity: 2 }),
    }).then((r) => r.json());

    const placeOrderRes = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: custHeader,
      body: JSON.stringify({
        deliveryAddress: {
          label: "Home",
          addressLine: "123 Main Street, City Centre",
          city: "Vadodara",
        },
      }),
    }).then((r) => r.json());

    const order1 = placeOrderRes.data;
    console.log(`✅ Test Order #1 Placed: ID ${order1._id}, Status: ${order1.status}`);

    // 3. Login Restaurant Owner to progress Order #1
    const ownerLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: ownerEmail, password: "password123" }),
    });
    const ownerCookie = ownerLoginRes.headers.get("set-cookie");
    const ownerTokenMatch = ownerCookie ? ownerCookie.match(/token=([^;]+)/) : null;
    const ownerToken = ownerTokenMatch ? ownerTokenMatch[1] : null;

    const ownerHeader = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ownerToken}`,
      Cookie: ownerCookie || "",
    };
    console.log("✅ Restaurant Owner logged in.");

    // Progress Order #1: accepted -> preparing -> ready_for_pickup
    for (const status of ["accepted", "preparing", "ready_for_pickup"]) {
      const updateRes = await fetch(`${API_BASE}/orders/merchant/${order1._id}/status`, {
        method: "PATCH",
        headers: ownerHeader,
        body: JSON.stringify({ status }),
      }).then((r) => r.json());

      const updatedStatus = updateRes.data?.status || updateRes.status;
      console.log(`  -> Status updated to: ${updatedStatus}`);
    }

    // 4. Test Cancellation Policy on Order #1 (status is now "ready_for_pickup" -> MUST FAIL with HTTP 400)
    console.log("\n--- Testing Cancel Policy on 'ready_for_pickup' order (Must fail with HTTP 400) ---");
    const cancelFailRes = await fetch(`${API_BASE}/orders/${order1._id}/cancel`, {
      method: "PATCH",
      headers: custHeader,
      body: JSON.stringify({ reason: "Too late" }),
    });

    const cancelFailBody = await cancelFailRes.json();
    if (cancelFailRes.status === 400) {
      console.log(`✅ PASS: Server correctly rejected cancellation with HTTP 400: "${cancelFailBody.message}"`);
    } else {
      console.error(`❌ Unexpected status ${cancelFailRes.status}:`, cancelFailBody);
    }

    // 5. Place Test Order #2 to test Successful Cancellation (status = "placed")
    await fetch(`${API_BASE}/cart/add`, {
      method: "POST",
      headers: custHeader,
      body: JSON.stringify({ menuItemId: menuItem._id, quantity: 1 }),
    }).then((r) => r.json());

    const placeOrder2Res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: custHeader,
      body: JSON.stringify({
        deliveryAddress: {
          label: "Office",
          addressLine: "456 Tech Park",
          city: "Vadodara",
        },
      }),
    }).then((r) => r.json());

    const order2 = placeOrder2Res.data;
    console.log(`\n✅ Test Order #2 Placed: ID ${order2._id}, Status: ${order2.status}`);

    // Cancel Order #2 while status is "placed"
    const cancelSuccessRes = await fetch(`${API_BASE}/orders/${order2._id}/cancel`, {
      method: "PATCH",
      headers: custHeader,
      body: JSON.stringify({ reason: "Ordered by mistake" }),
    }).then((r) => r.json());

    const cancelledOrder = cancelSuccessRes.data;
    console.log(`✅ PASS: Test Order #2 Cancelled successfully! Status: ${cancelledOrder.status}`);
    console.log(`   CancelledAt timestamp: ${cancelledOrder.cancelledAt}`);
    console.log(`   Cancellation Reason: ${cancelledOrder.cancellationReason}`);

    console.log("\n=== ALL TEST FLOW STEPS COMPLETED SUCCESSFULLY ===");
    process.exit(0);
  } catch (err) {
    console.error("❌ Test Flow Error:", err.message);
    process.exit(1);
  }
}

runTestFlow();
