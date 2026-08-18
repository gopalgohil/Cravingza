import "dotenv/config";
import mongoose from "mongoose";

async function migrateLocalToAtlas() {
  try {
    console.log("=== Migrating Localhost MongoDB to Atlas Cloud Database ===");

    const localUri = "mongodb://127.0.0.1:27017/cravingza";
    const atlasUri = process.env.MONGO_URI;

    if (!atlasUri || !atlasUri.startsWith("mongodb+srv")) {
      console.error("❌ Please set your MongoDB Atlas connection string in backend/.env first!");
      process.exit(1);
    }

    console.log("1. Connecting to Local MongoDB...");
    const localConn = await mongoose.createConnection(localUri).asPromise();
    console.log("✅ Connected to Localhost.");

    console.log("2. Connecting to Atlas Cloud MongoDB...");
    const atlasConn = await mongoose.createConnection(atlasUri).asPromise();
    console.log("✅ Connected to Atlas Cloud.");

    const collections = await localConn.db.listCollections().toArray();
    console.log(`\nFound ${collections.length} collections locally to migrate:`);

    for (const colInfo of collections) {
      const colName = colInfo.name;
      const docs = await localConn.db.collection(colName).find().toArray();
      if (docs.length > 0) {
        // Clear destination collection on Atlas and insert local docs
        await atlasConn.db.collection(colName).deleteMany({});
        await atlasConn.db.collection(colName).insertMany(docs);
        console.log(`  - 📦 Migrated collection "${colName}" (${docs.length} documents) ➔ Atlas`);
      } else {
        console.log(`  - ⚪ Collection "${colName}" is empty, skipped.`);
      }
    }

    console.log("\n🎉 Migration completed successfully! All your local data is now live on MongoDB Atlas!");
    process.exit(0);
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

migrateLocalToAtlas();
