
import "dotenv/config";
import mongoose from "mongoose";
import Restaurant from "../models/Restaurant.js";
import User from "../models/User.js";

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
        console.error("Error: Please provide a restaurant ID/Name and a rejection reason.");
        console.log("Usage: node scripts/approve.js --reject <id_or_name> <reason>");
      } else {
        await rejectApplication(target, reason);
      }
    } else if (command && !command.startsWith("-")) {
      await approveSpecific(command);
    } else {
      console.log("=== Cravingza Onboarding Admin CLI ===");
      console.log("Usage:");
      console.log("  node scripts/approve.js --list                List all pending/rejected applications");
      console.log("  node scripts/approve.js --all                 Approve all pending applications");
      console.log("  node scripts/approve.js <id_or_name>          Approve a specific application");
      console.log("  node scripts/approve.js --reject <id_or_name> <reason>   Reject a specific application");
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
  const apps = await Restaurant.find({
    approvalStatus: { $in: ["pending", "rejected"] }
  }).populate("owner", "name email role");

  if (apps.length === 0) {
    if (!silentIfEmpty) console.log("No pending or rejected applications found.");
    return;
  }

  console.log("--------------------------------------------------------------------------------");
  console.log(`Found ${apps.length} applications:`);
  console.log("--------------------------------------------------------------------------------");
  apps.forEach((app) => {
    console.log(`ID:     ${app._id}`);
    console.log(`Name:   ${app.name}`);
    console.log(`Owner:  ${app.owner?.name} (${app.owner?.email})`);
    console.log(`Phone:  ${app.ownerPhone}`);
    console.log(`Status: ${app.approvalStatus.toUpperCase()}`);
    if (app.approvalStatus === "rejected") {
      console.log(`Reason: ${app.rejectionReason}`);
    }
    console.log(`Docs:   FSSAI: ${app.documents?.fssaiLicense ? "Yes" : "No"}, Reg: ${app.documents?.businessRegistration ? "Yes" : "No"}`);
    console.log("--------------------------------------------------------------------------------");
  });
}

async function approveSpecific(target) {
  let app;
  // Try finding by ID first, then by name
  if (mongoose.Types.ObjectId.isValid(target)) {
    app = await Restaurant.findById(target);
  }

  if (!app) {
    app = await Restaurant.findOne({ name: new RegExp(target, "i") });
  }

  if (!app) {
    console.error(`Error: Could not find application matching "${target}".`);
    return;
  }

  app.approvalStatus = "approved";
  app.rejectionReason = null;
  app.reviewedAt = new Date();
  await app.save();

  // Upgrade the user role to owner
  if (app.owner) {
    await User.findByIdAndUpdate(app.owner, { role: "owner" });
  }

  console.log(`SUCCESS: Approved restaurant "${app.name}" (ID: ${app._id}).`);
}

async function approveAll() {
  const pendingApps = await Restaurant.find({ approvalStatus: "pending" });

  if (pendingApps.length === 0) {
    console.log("No pending applications to approve.");
    return;
  }

  for (const app of pendingApps) {
    app.approvalStatus = "approved";
    app.rejectionReason = null;
    app.reviewedAt = new Date();
    await app.save();

    if (app.owner) {
      await User.findByIdAndUpdate(app.owner, { role: "owner" });
    }
    console.log(`Approved: "${app.name}"`);
  }

  console.log(`SUCCESS: Approved all ${pendingApps.length} pending applications.`);
}

async function rejectApplication(target, reason) {
  let app;
  if (mongoose.Types.ObjectId.isValid(target)) {
    app = await Restaurant.findById(target);
  }

  if (!app) {
    app = await Restaurant.findOne({ name: new RegExp(target, "i") });
  }

  if (!app) {
    console.error(`Error: Could not find application matching "${target}".`);
    return;
  }

  app.approvalStatus = "rejected";
  app.rejectionReason = reason;
  app.reviewedAt = new Date();
  await app.save();

  console.log(`SUCCESS: Rejected restaurant "${app.name}" (ID: ${app._id}).`);
  console.log(`Reason: "${reason}"`);
}

run();
