const API_BASE = "http://localhost:5000/api";

async function runDeliveryFulfillmentTests() {
  console.log("==================================================");
  console.log("STARTING DELIVERY ORDER FULFILLMENT INTEGRATION TESTS");
  console.log("==================================================\n");

  try {
    // 1. Customer Login & Create Order
    console.log("Step 1: Logging in as Customer (rohan@example.com)...");
    const customerLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "rohan@example.com", password: "customer123" }),
      credentials: "omit",
    });
    const customerLogin = await customerLoginRes.json();
    const customerToken = customerLogin.data.token;
    console.log("✔ Customer logged in successfully.");

    // Fetch a restaurant to order from
    const restRes = await (await fetch(`${API_BASE}/restaurants`, { credentials: "omit" })).json();
    const restaurant = restRes.data[0];
    console.log(`✔ Selected Restaurant: ${restaurant.name} (${restaurant._id})`);

    // Add item to cart & place order
    const menuRes = await (await fetch(`${API_BASE}/restaurants/${restaurant._id}`, { credentials: "omit" })).json();
    let menuList = menuRes.data?.menu || [];
    let menuItem = menuList[0];

    console.log(`✔ Using Menu Item: ${menuItem?.name || "Item"} (${menuItem?._id})`);

    // Clear cart & add item
    await fetch(`${API_BASE}/cart`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${customerToken}` },
      credentials: "omit",
    });

    await fetch(`${API_BASE}/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ menuItemId: menuItem._id, quantity: 2 }),
      credentials: "omit",
    });

    const orderReq = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        deliveryAddress: {
          addressLine: "A-12 Hariom Nagar, Subhanpura, Vadodara",
          city: "Vadodara",
          label: "Home",
        },
      }),
      credentials: "omit",
    });
    const orderRes = await orderReq.json();
    const orderObj = orderRes.data?.order || orderRes.data || orderRes;
    const orderId = orderObj._id || orderObj.id;
    console.log(`✔ Order placed successfully. Order ID: ${orderId}`);

    // 2. Restaurant Owner Login & Progress Order to ready_for_pickup
    console.log("\nStep 2: Logging in as Restaurant Owner (chef@bistro.com)...");
    const ownerLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "chef@bistro.com", password: "owner123" }),
      credentials: "omit",
    });
    const ownerLogin = await ownerLoginRes.json();
    const ownerToken = ownerLogin.data.token;

    console.log("-> Moving Order status: placed -> accepted...");
    await fetch(`${API_BASE}/orders/merchant/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: "accepted" }),
      credentials: "omit",
    });

    console.log("-> Moving Order status: accepted -> preparing...");
    await fetch(`${API_BASE}/orders/merchant/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: "preparing" }),
      credentials: "omit",
    });

    console.log("-> Moving Order status: preparing -> ready_for_pickup...");
    const readyReq = await fetch(`${API_BASE}/orders/merchant/${orderId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: "ready_for_pickup" }),
      credentials: "omit",
    });
    const readyRes = await readyReq.json();
    console.log(`✔ Order is ready for pickup! (readyAt: ${readyRes.data.readyAt})`);

    // 3. Delivery Partner 1 Login & Set Online
    console.log("\nStep 3: Logging in as Delivery Partner 1 (drakpatel2004@gmail.com)...");
    const deliveryLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "drakpatel2004@gmail.com", password: "delivery123" }),
      credentials: "omit",
    });
    const deliveryLogin1 = await deliveryLoginRes.json();
    const partnerToken1 = deliveryLogin1.data.token;

    // Set online
    await fetch(`${API_BASE}/delivery/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${partnerToken1}`,
      },
      body: JSON.stringify({ isOnline: true }),
      credentials: "omit",
    });
    console.log("✔ Delivery Partner 1 is ONLINE.");

    // 4. Fetch Nearby Orders
    console.log("\nStep 4: Fetching nearby orders for Delivery Partner 1...");
    const nearbyReq = await fetch(`${API_BASE}/delivery/nearby-orders`, {
      headers: { Authorization: `Bearer ${partnerToken1}` },
      credentials: "omit",
    });
    const nearbyRes = await nearbyReq.json();
    console.log(`✔ Nearby orders count: ${nearbyRes.data.length}`);
    const foundOrder = nearbyRes.data.find((o) => o._id === orderId);
    if (!foundOrder) {
      throw new Error(`Order ${orderId} not found in nearby orders list!`);
    }
    console.log(`✔ Confirmed order ${orderId} is present in nearby orders!`);

    // 5. Accept Order
    console.log("\nStep 5: Delivery Partner 1 accepting order...");
    const acceptReq = await fetch(`${API_BASE}/delivery/orders/${orderId}/accept`, {
      method: "POST",
      headers: { Authorization: `Bearer ${partnerToken1}` },
      credentials: "omit",
    });
    const acceptRes = await acceptReq.json();
    const deliveryDoc = acceptRes.data;
    console.log(`✔ Order accepted! Delivery ID: ${deliveryDoc._id}, Status: ${deliveryDoc.status}`);

    // 6. Test Race Condition Guard (409 Conflict)
    console.log("\nStep 6: Testing race condition conflict (second acceptance attempt)...");
    const raceReq = await fetch(`${API_BASE}/delivery/orders/${orderId}/accept`, {
      method: "POST",
      headers: { Authorization: `Bearer ${partnerToken1}` },
      credentials: "omit",
    });
    if (raceReq.status === 409) {
      console.log("✔ SUCCESS: Race condition guard returned HTTP 409 Conflict as expected!");
    } else {
      console.error(`❌ ERROR: Expected status 409, but got ${raceReq.status}`);
      process.exit(1);
    }

    // 7. Active Delivery Check
    console.log("\nStep 7: Checking GET /api/delivery/active...");
    const activeReq = await fetch(`${API_BASE}/delivery/active`, {
      headers: { Authorization: `Bearer ${partnerToken1}` },
      credentials: "omit",
    });
    const activeRes = await activeReq.json();
    console.log(`✔ Active Delivery returned: ${activeRes.data._id} (Status: ${activeRes.data.status})`);

    // 8. Progress Delivery Status: assigned -> picked_up -> out_for_delivery -> delivered
    console.log("\nStep 8: Progressing delivery status sequentially...");

    console.log("-> Transitioning to picked_up...");
    const pickedUpReq = await fetch(`${API_BASE}/delivery/active/${deliveryDoc._id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${partnerToken1}`,
      },
      body: JSON.stringify({ status: "picked_up" }),
      credentials: "omit",
    });
    const pickedUpRes = await pickedUpReq.json();
    console.log(`✔ Status updated: Delivery = ${pickedUpRes.data.status}, Order = ${pickedUpRes.data.order.status}`);

    console.log("-> Transitioning to out_for_delivery...");
    const outReq = await fetch(`${API_BASE}/delivery/active/${deliveryDoc._id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${partnerToken1}`,
      },
      body: JSON.stringify({ status: "out_for_delivery" }),
      credentials: "omit",
    });
    const outRes = await outReq.json();
    console.log(`✔ Status updated: Delivery = ${outRes.data.status}, Order = ${outRes.data.order.status}`);

    console.log("-> Transitioning to delivered...");
    const deliveredReq = await fetch(`${API_BASE}/delivery/active/${deliveryDoc._id}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${partnerToken1}`,
      },
      body: JSON.stringify({ status: "delivered" }),
      credentials: "omit",
    });
    const deliveredRes = await deliveredReq.json();
    console.log(
      `✔ Delivery completed! Status = ${deliveredRes.data.status}, Earnings = ₹${deliveredRes.data.earnings}`
    );

    // 9. Delivery Dashboard Stats Check
    console.log("\nStep 9: Verifying updated Delivery Partner Dashboard stats...");
    const dashReq = await fetch(`${API_BASE}/delivery/dashboard`, {
      headers: { Authorization: `Bearer ${partnerToken1}` },
      credentials: "omit",
    });
    const dashRes = await dashReq.json();
    console.log(`✔ Today's Earnings: ₹${dashRes.data.earningsToday}`);
    console.log(`✔ Today's Completed Deliveries: ${dashRes.data.deliveriesCompletedToday}`);
    console.log(`✔ Lifetime Deliveries: ${dashRes.data.lifetimeDeliveries}`);

    console.log("\n==================================================");
    console.log("ALL DELIVERY FULFILLMENT TESTS PASSED SUCCESSFULLY! 🚀");
    console.log("==================================================");
  } catch (error) {
    console.error("❌ TEST FAILED:", error);
    process.exit(1);
  }
}

runDeliveryFulfillmentTests();
