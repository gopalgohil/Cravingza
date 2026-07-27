const admin = require("firebase-admin");

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined;

  if (projectId && clientEmail && privateKey) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("Firebase Admin SDK initialized successfully.");
    } catch (error) {
      console.error("Error initializing Firebase Admin SDK:", error);
    }
  } else {
    console.warn("Firebase Admin SDK credentials not fully configured. Google login will not be operational until credentials are provided in .env");
  }
}

module.exports = admin;
