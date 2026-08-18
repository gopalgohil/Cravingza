import webpush from "web-push";
import DeliveryProfile from "../models/DeliveryProfile.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

// Configure VAPID details if keys exist
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:contact@cravingza.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

/**
 * Send a web push notification to a specific user by userId
 */
const sendPushNotification = async (userId, title, body, dataUrl = "/delivery-partner/nearby-orders") => {
  try {
    const profile = await DeliveryProfile.findOne({ user: userId });
    if (!profile || !profile.pushSubscription) {
      return { success: false, reason: "No push subscription found" };
    }

    const payload = JSON.stringify({
      title: title || "Cravingza Partner Alert",
      body: body || "You have a new update",
      icon: "/logo.svg",
      data: { url: dataUrl },
    });

    await webpush.sendNotification(profile.pushSubscription, payload);
    return { success: true };
  } catch (error) {
    console.error(`Error sending push notification to user ${userId}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send web push notification to all online delivery partners
 */
const notifyOnlineDeliveryPartners = async (title, body, dataUrl = "/delivery-partner/nearby-orders") => {
  try {
    const onlineProfiles = await DeliveryProfile.find({
      approvalStatus: "approved",
      isOnline: true,
      pushSubscription: { $ne: null },
    });

    const results = await Promise.allSettled(
      onlineProfiles.map((profile) =>
        sendPushNotification(profile.user, title, body, dataUrl)
      )
    );

    return {
      success: true,
      count: onlineProfiles.length,
      results,
    };
  } catch (error) {
    console.error("Error notifying online delivery partners:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send web push notification to a specific customer user
 */
const sendUserNotification = async (userId, title, body, dataUrl = "/orders") => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.pushSubscription) {
      return { success: false, reason: "No push subscription found for user" };
    }

    const payload = JSON.stringify({
      title: title || "Cravingza Order Update",
      body: body || "Your order status has been updated",
      icon: "/logo.svg",
      data: { url: dataUrl },
    });

    await webpush.sendNotification(user.pushSubscription, payload);
    return { success: true };
  } catch (error) {
    console.error(`Error sending push notification to user ${userId}:`, error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Dual Notification Helper: Saves to DB for In-App Bell Center & sends System Web Push
 */
const notifyUserDual = async (userId, title, message, link = "/orders", type = "order_update") => {
  try {
    // 1. Create In-App Notification in DB
    await Notification.create({
      recipient: userId,
      title,
      message,
      type,
      link,
    });

    // 2. Trigger System Web Push
    await sendUserNotification(userId, title, message, link);
  } catch (error) {
    console.error(`Error in notifyUserDual for user ${userId}:`, error.message);
  }
};

export {
  sendPushNotification,
  notifyOnlineDeliveryPartners,
  sendUserNotification,
  notifyUserDual,
};
