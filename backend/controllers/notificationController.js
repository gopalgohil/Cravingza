const Notification = require("../models/Notification");

// GET /api/notifications - Get all notifications for logged in user
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    return res.status(200).json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notifications/read - Mark all or specific notification as read
const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.body;

    if (notificationId) {
      await Notification.updateOne(
        { _id: notificationId, recipient: req.user._id },
        { $set: { isRead: true } }
      );
    } else {
      await Notification.updateMany(
        { recipient: req.user._id, isRead: false },
        { $set: { isRead: true } }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Notifications marked as read",
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/notifications - Clear all notifications for logged in user
const clearNotifications = async (req, res, next) => {
  try {
    await Notification.deleteMany({ recipient: req.user._id });

    return res.status(200).json({
      success: true,
      message: "Notifications cleared",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  clearNotifications,
};
