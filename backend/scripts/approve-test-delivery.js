require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const DeliveryProfile = require("../models/DeliveryProfile");
const User = require("../models/User");

async function run() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    console.log("Connecting to MongoDB database...");
    await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/cravingza");
    console.log("Connected successfully.\n");

    if (command === "--list" || command === "-l") {
      await listApplications();
    } else if (command === "--all" || command === "-a") {
      await approveAll();
    } else if (command === "--reject" || command === "-r") {
      const target = args[1];
      const reason = args.slice(2).join(" ");
      if (!target || !reason) {
        console.error("Error: Please provide a delivery profile ID/User Name and a rejection reason.");
        console.log("Usage: node scripts/approve-test-delivery.js --reject <id_or_user_name> <reason>");
      } else {
        await rejectApplication(target, reason);
      }
    } else if (command && !command.startsWith("-")) {
      await approveSpecific(command);
    } else {
      console.log("=== Cravingza Delivery Onboarding Admin CLI ===");
      console.log("Usage:");
      console.log("  node scripts/approve-test-delivery.js --list                List all pending/rejected applications");
      console.log("  node scripts/approve-test-delivery.js --all                 Approve all pending applications");
      console.log("  node scripts/approve-test-delivery.js <id_or_user_name>     Approve a specific application");
      console.log("  node scripts/approve-test-delivery.js --reject <id_or_user_name> <reason>   Reject a specific application");
      console.log("\nActive applications status overview:");
      await listApplications(true);
    }
  } catch (error) {
    console.error("Error running script:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected from database.");
  }
}

async function listApplications(silentIfEmpty = false) {
  const apps = await DeliveryProfile.find({
    approvalStatus: { $in: ["pending", "rejected"] }
  }).populate("user", "name email role");

  if (apps.length === 0) {
    if (!silentIfEmpty) console.log("No pending or rejected delivery partner applications found.");
    return;
  }

  console.log("--------------------------------------------------------------------------------");
  console.log(`Found ${apps.length} applications:`);
  console.log("--------------------------------------------------------------------------------");
  apps.forEach((app) => {
    console.log(`Profile ID: ${app._id}`);
    console.log(`User:       ${app.user?.name} (${app.user?.email})`);
    console.log(`Phone:      ${app.phone}`);
    console.log(`Vehicle:    ${app.vehicleType} (${app.vehicleNumber || "N/A"})`);
    console.log(`City:       ${app.city} (${app.pincode})`);
    console.log(`Status:     ${app.approvalStatus.toUpperCase()}`);
    if (app.approvalStatus === "rejected") {
      console.log(`Reason:     ${app.rejectionReason}`);
    }
    console.log(`Docs:       Aadhaar: ${app.documents?.aadhaarCard ? "Yes" : "No"}, DL: ${app.documents?.drivingLicense ? "Yes" : "No"}`);
    console.log("--------------------------------------------------------------------------------");
  });
}

async function approveSpecific(target) {
  let app;
  // Try finding by ID first
  if (mongoose.Types.ObjectId.isValid(target)) {
    app = await DeliveryProfile.findById(target);
  }
  
  if (!app) {
    // Try finding user by name and then finding their profile
    const user = await User.findOne({ name: new RegExp(target, "i") });
    if (user) {
      app = await DeliveryProfile.findOne({ user: user._id });
    }
  }

  if (!app) {
    console.error(`Error: Could not find delivery application matching "${target}".`);
    return;
  }

  app.approvalStatus = "approved";
  app.rejectionReason = null;
  app.reviewedAt = new Date();
  await app.save();

  // Upgrade the user role to delivery
  if (app.user) {
    await User.findByIdAndUpdate(app.user, { role: "delivery" });
  }

  console.log(`SUCCESS: Approved delivery partner application (ID: ${app._id}).`);
}

async function approveAll() {
  const pendingApps = await DeliveryProfile.find({ approvalStatus: "pending" });

  if (pendingApps.length === 0) {
    console.log("No pending delivery partner applications to approve.");
    return;
  }

  for (const app of pendingApps) {
    app.approvalStatus = "approved";
    app.rejectionReason = null;
    app.reviewedAt = new Date();
    await app.save();

    if (app.user) {
      await User.findByIdAndUpdate(app.user, { role: "delivery" });
    }
    console.log(`Approved: ID ${app._id}`);
  }

  console.log(`SUCCESS: Approved all ${pendingApps.length} pending applications.`);
}

async function rejectApplication(target, reason) {
  let app;
  if (mongoose.Types.ObjectId.isValid(target)) {
    app = await DeliveryProfile.findById(target);
  }
  
  if (!app) {
    const user = await User.findOne({ name: new RegExp(target, "i") });
    if (user) {
      app = await DeliveryProfile.findOne({ user: user._id });
    }
  }

  if (!app) {
    console.error(`Error: Could not find application matching "${target}".`);
    return;
  }

  app.approvalStatus = "rejected";
  app.rejectionReason = reason;
  app.reviewedAt = new Date();
  await app.save();

  console.log(`SUCCESS: Rejected delivery partner application (ID: ${app._id}).`);
  console.log(`Reason: "${reason}"`);
}

run();
