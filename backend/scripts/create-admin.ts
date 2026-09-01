import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User";

// Load environment variables
dotenv.config({ path: path.resolve(".env") });

async function createAdmin() {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error("Usage: npx tsx scripts/create-admin.ts <email> <password> <name>");
    process.exit(1);
  }

  const [email, password, name] = args;

  if (!email || !password || !name) {
    console.error("Error: email, password, and name are all required.");
    process.exit(1);
  }

  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("Error: MONGO_URI is not defined in the backend environment variables.");
      process.exit(1);
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri);
    console.log("Connected successfully.");

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log(`User with email ${email} already exists. Updating credentials and setting role to admin...`);
      existingUser.role = "admin";
      existingUser.password = password; // Will be hashed by pre-save hook
      existingUser.isVerified = true;
      // Add custom isEmailVerified if needed dynamically
      (existingUser as any).isEmailVerified = true;
      await existingUser.save();
      console.log("User updated to Admin successfully!");
    } else {
      console.log(`Creating new admin user: ${name} (${email})...`);
      const admin = new User({
        name,
        email,
        password,
        role: "admin",
        isVerified: true,
        status: "active",
      });
      // also set isEmailVerified dynamically just in case
      (admin as any).isEmailVerified = true;
      await admin.save();
      console.log("Admin user created successfully!");
    }

    process.exit(0);
  } catch (error: any) {
    console.error("Failed to create admin:", error);
    process.exit(1);
  }
}

createAdmin();
