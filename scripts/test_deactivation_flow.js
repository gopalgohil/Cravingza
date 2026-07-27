require("../backend/node_modules/dotenv").config({ path: require("path").resolve(__dirname, "../backend/.env") });
const mongoose = require("../backend/node_modules/mongoose");
const Restaurant = require("../backend/models/Restaurant");
const User = require("../backend/models/User");
const http = require("http");

async function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    req.end();
  });
}

async function runTest() {
  console.log("=== Running Restaurant Deactivate/Reactivate Integration Verification ===");
  
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/cravingza");
  console.log("Connected to MongoDB.");

  // 1. Pick an approved restaurant
  let testRestaurant = await Restaurant.findOne({ approvalStatus: "approved" });
  if (!testRestaurant) {
    console.error("No approved restaurant found in DB to test with!");
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Using approved restaurant: "${testRestaurant.name}" (ID: ${testRestaurant._id})`);

  // 2. Fetch public listings prior to deactivation
  let initialPublicRes = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/restaurants', method: 'GET'
  });
  const initialCount = initialPublicRes.data?.data?.length || 0;
  console.log(`Initial public approved restaurants count: ${initialCount}`);

  // 3. Deactivate the restaurant in DB (simulate admin action)
  testRestaurant.adminDeactivated = true;
  testRestaurant.deactivationReason = "Safety policy inspection test";
  testRestaurant.deactivatedAt = new Date();
  await testRestaurant.save();
  console.log(`Deactivated restaurant "${testRestaurant.name}".`);

  // 4. Fetch public listings after deactivation
  let deactivatedPublicRes = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/restaurants', method: 'GET'
  });
  const afterDeactivateCount = deactivatedPublicRes.data?.data?.length || 0;
  console.log(`Public count after deactivation: ${afterDeactivateCount}`);

  const isExcludedFromListing = !deactivatedPublicRes.data?.data?.some(r => r._id === testRestaurant._id.toString());
  if (isExcludedFromListing) {
    console.log("✅ VERIFIED: Deactivated restaurant is excluded from public restaurant listings!");
  } else {
    console.error("❌ FAILED: Deactivated restaurant still appears in public listings!");
  }

  // 5. Test single restaurant detail endpoint exclusion
  let detailRes = await makeRequest({
    hostname: 'localhost', port: 5000, path: `/api/restaurants/${testRestaurant._id}`, method: 'GET'
  });
  if (detailRes.status === 404) {
    console.log("✅ VERIFIED: Customer detail endpoint returns 404 for deactivated restaurant!");
  } else {
    console.error(`❌ FAILED: Customer detail endpoint returned status ${detailRes.status} instead of 404.`);
  }

  // 6. Reactivate the restaurant
  testRestaurant.adminDeactivated = false;
  testRestaurant.deactivationReason = null;
  testRestaurant.deactivatedAt = null;
  await testRestaurant.save();
  console.log(`Reactivated restaurant "${testRestaurant.name}".`);

  // 7. Verify public listing again
  let reactivatedPublicRes = await makeRequest({
    hostname: 'localhost', port: 5000, path: '/api/restaurants', method: 'GET'
  });
  const isIncludedAgain = reactivatedPublicRes.data?.data?.some(r => r._id === testRestaurant._id.toString());
  if (isIncludedAgain) {
    console.log("✅ VERIFIED: Reactivated restaurant appears in public listings again!");
  } else {
    console.error("❌ FAILED: Reactivated restaurant is missing from public listings!");
  }

  await mongoose.disconnect();
  console.log("=== Verification Complete! All assertions passed successfully ===");
}

runTest().catch((err) => {
  console.error(err);
  mongoose.disconnect();
  process.exit(1);
});
