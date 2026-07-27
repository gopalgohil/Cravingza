const admin = require("firebase-admin");

if (!admin.apps.length) {
  const projectId = process.env.FIREBASE_PROJECT_ID ? process.env.FIREBASE_PROJECT_ID.trim() : undefined;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL ? process.env.FIREBASE_CLIENT_EMAIL.trim() : undefined;
  
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;
  if (privateKey) {
    privateKey = privateKey.trim();
    // Remove leading/trailing quotes if present
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
      privateKey = privateKey.slice(1, -1);
    }
    // Convert escaped newlines \n to actual newlines
    privateKey = privateKey.replace(/\\n/g, "\n");
  }

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
    console.warn("Firebase Admin SDK credentials missing or incomplete.", {
      hasProjectId: !!projectId,
      hasClientEmail: !!clientEmail,
      hasPrivateKey: !!privateKey,
    });
  }
}

module.exports = admin;
