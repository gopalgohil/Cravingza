import Restaurant from "../models/Restaurant.js";
import Order from "../models/Order.js";
import User from "../models/User.js";
import DeliveryProfile from "../models/DeliveryProfile.js";
import Notification from "../models/Notification.js";
import SystemSettings from "../models/SystemSettings.js";
import mongoose from "mongoose";
import { getIO } from "../services/socketService.js";

// GET /api/admin/restaurants
export const getRestaurants = async (req, res, next) => {
  try {
    const { status = "pending" } = req.query;

    let filter = {};
    if (status !== "all") {
      filter.approvalStatus = status;
    }

    const restaurants = await Restaurant.find(filter)
      .select("name ownerName ownerEmail ownerPhone phone city cuisines address addressLine location image logo coverImage coverImageUrl approvalStatus adminDeactivated deactivationReason deactivatedAt rejectionReason submittedAt createdAt documents fssaiLicense gstCertificate owner")
      .populate("owner", "name email phone")
      .sort({ submittedAt: -1, createdAt: -1 })
      .lean();

    // Include counts for each status
    const pendingCount = await Restaurant.countDocuments({ approvalStatus: "pending" });
    const approvedCount = await Restaurant.countDocuments({ approvalStatus: "approved" });
    const rejectedCount = await Restaurant.countDocuments({ approvalStatus: "rejected" });

    return res.status(200).json({
      success: true,
      data: restaurants,
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        all: pendingCount + approvedCount + rejectedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/restaurants/:id
export const getRestaurantById = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .populate("owner", "name email phone")
      .populate("reviewedBy", "name email");

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant application not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/restaurants/:id/approve
export const approveRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant application not found",
      });
    }

    restaurant.approvalStatus = "approved";
    restaurant.reviewedAt = new Date();
    restaurant.reviewedBy = req.user._id;
    restaurant.rejectionReason = null; // Clear prior rejection reason

    // Update the owner's role to 'owner' so they can access dashboard
    if (restaurant.owner) {
      await User.findByIdAndUpdate(restaurant.owner, { role: "owner" });
    }

    await restaurant.save();

    // Notify the restaurant owner
    if (restaurant.owner) {
      try {
        await Notification.create({
          recipient: restaurant.owner,
          title: "🎉 Application Approved!",
          message: `Congratulations! Your restaurant "${restaurant.name}" has been approved. You can now access your restaurant dashboard.`,
          type: "application",
          link: "/restaurant-owner/dashboard",
          isRead: false,
        });
      } catch (notifErr) {
        console.error("Failed to notify owner on approve:", notifErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Restaurant approved successfully",
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/restaurants/:id/reject
export const rejectRestaurant = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant application not found",
      });
    }

    restaurant.approvalStatus = "rejected";
    restaurant.rejectionReason = reason;
    restaurant.reviewedAt = new Date();
    restaurant.reviewedBy = req.user._id;

    // Ensure user role stays or reverts to 'customer' on rejection
    if (restaurant.owner) {
      await User.findByIdAndUpdate(restaurant.owner, { role: "customer" });
    }

    await restaurant.save();

    // Notify the restaurant owner about rejection
    if (restaurant.owner) {
      try {
        await Notification.create({
          recipient: restaurant.owner,
          title: "Application Rejected",
          message: `Your restaurant "${restaurant.name}" application was rejected. Reason: ${reason}. You can update and reapply.`,
          type: "application",
          link: "/become-partner",
          isRead: false,
        });
      } catch (notifErr) {
        console.error("Failed to notify owner on reject:", notifErr.message);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Restaurant rejected successfully",
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/restaurants/:id/deactivate
export const deactivateRestaurant = async (req, res, next) => {
  try {
    const { reason, suspendOwner } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Deactivation reason is required",
      });
    }

    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    restaurant.adminDeactivated = true;
    restaurant.deactivationReason = reason.trim();
    restaurant.deactivatedAt = new Date();
    restaurant.deactivatedBy = req.user._id;

    await restaurant.save();

    if (suspendOwner && restaurant.owner) {
      await User.findByIdAndUpdate(restaurant.owner, { status: "suspended" });
    }

    const updatedRestaurant = await Restaurant.findById(restaurant._id)
      .populate("owner", "name email phone status")
      .populate("reviewedBy", "name email")
      .populate("deactivatedBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Restaurant deactivated successfully",
      data: updatedRestaurant,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/restaurants/:id/reactivate
export const reactivateRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    restaurant.adminDeactivated = false;
    restaurant.deactivationReason = null;
    restaurant.deactivatedAt = null;
    restaurant.deactivatedBy = null;

    await restaurant.save();

    const updatedRestaurant = await Restaurant.findById(restaurant._id)
      .populate("owner", "name email phone status")
      .populate("reviewedBy", "name email");

    return res.status(200).json({
      success: true,
      message: "Restaurant reactivated successfully",
      data: updatedRestaurant,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/dashboard
export const getDashboardData = async (req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. totalOrdersToday
    const totalOrdersToday = await Order.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd },
    });

    // 2. platformRevenueToday
    const revenueAggregation = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart, $lte: todayEnd },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]);
    const platformRevenueToday = revenueAggregation[0]?.total || 0;

    // 3. activeRestaurants
    const activeRestaurants = await Restaurant.countDocuments({
      approvalStatus: "approved",
      isOpen: true,
      adminDeactivated: { $ne: true },
    });

    // 4. activeDeliveryPartners
    const activeDeliveryPartners = await User.countDocuments({
      role: "delivery",
      status: "active",
    });

    // 5. pendingApprovals (Combined Restaurants + Delivery Partners)
    const pendingRestaurantsCount = await Restaurant.countDocuments({
      approvalStatus: "pending",
    });
    const pendingDeliveryCount = await DeliveryProfile.countDocuments({
      approvalStatus: "pending",
    });
    const pendingApprovals = pendingRestaurantsCount + pendingDeliveryCount;

    // 6. pendingApprovalsList (Combined list sorted by date)
    const pendingRestaurantList = await Restaurant.find({ approvalStatus: "pending" })
      .select("name submittedAt createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    const pendingDeliveryList = await DeliveryProfile.find({ approvalStatus: "pending" })
      .populate("user", "name")
      .select("submittedAt createdAt user city")
      .sort({ createdAt: -1 })
      .limit(5);

    const pendingApprovalsList = [
      ...pendingRestaurantList.map((r) => ({
        id: r._id,
        name: r.name,
        type: "restaurant",
        submittedAt: r.submittedAt || r.createdAt,
      })),
      ...pendingDeliveryList.map((d) => ({
        id: d._id,
        name: d.user?.name || "Delivery Applicant",
        type: "delivery_partner",
        submittedAt: d.submittedAt || d.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 5);

    // 7. recentActivity Feed with Backend Pagination (default 7 items per page)
    const activityPage = parseInt(req.query.activityPage) || 1;
    const activityLimit = parseInt(req.query.activityLimit) || 7;

    const recentApps = await Restaurant.find()
      .select("name approvalStatus rejectionReason reviewedAt submittedAt createdAt owner")
      .populate("owner", "name")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const recentOrders = await Order.find()
      .select("totalAmount createdAt status customer")
      .populate("customer", "name")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const activityFeed = [];

    recentApps.forEach((app) => {
      activityFeed.push({
        id: `app-sub-${app._id}`,
        message: `New restaurant applied: "${app.name}"`,
        timestamp: app.submittedAt || app.createdAt,
        type: "application",
      });

      if (app.reviewedAt) {
        activityFeed.push({
          id: `app-rev-${app._id}`,
          message: `Restaurant "${app.name}" was ${app.approvalStatus}${
            app.rejectionReason ? ` (Reason: ${app.rejectionReason})` : ""
          }`,
          timestamp: app.reviewedAt,
          type: "review",
        });
      }
    });

    recentOrders.forEach((order) => {
      activityFeed.push({
        id: `order-${order._id}`,
        message: `New order placed by ${order.customer?.name || "Guest User"} - ₹${order.totalAmount}`,
        timestamp: order.createdAt,
        type: "order",
      });
    });

    const sortedFeed = activityFeed.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const totalActivities = sortedFeed.length;
    const totalActivityPages = Math.max(1, Math.ceil(totalActivities / activityLimit));
    const startIndex = (activityPage - 1) * activityLimit;
    const recentActivity = sortedFeed.slice(startIndex, startIndex + activityLimit);

    const activityPagination = {
      page: activityPage,
      limit: activityLimit,
      totalItems: totalActivities,
      totalPages: totalActivityPages,
      hasNextPage: activityPage < totalActivityPages,
      hasPrevPage: activityPage > 1,
    };

    // 8. orderTrend for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const trendAggregation = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+05:30" },
          },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Build map of aggregate results
    const trendMap = new Map();
    trendAggregation.forEach((item) => {
      trendMap.set(item._id, item.orderCount);
    });

    // Fill missing days to ensure we have exactly 7 days
    const orderTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const orderCount = trendMap.get(dateStr) || 0;

      // Format date for chart tooltip (e.g., "Jul 21")
      const formattedDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      orderTrend.push({
        date: formattedDate,
        fullDate: dateStr,
        orderCount,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        totalOrdersToday,
        platformRevenueToday,
        activeRestaurants,
        activeDeliveryPartners,
        pendingApprovals,
        pendingApprovalsList,
        recentActivity,
        activityPagination,
        orderTrend,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users
export const getUsers = async (req, res, next) => {
  try {
    const { role = "all", search, status = "all", page = 1, limit = 50 } = req.query;

    let filter = {};
    if (role && role !== "all" && ["customer", "owner", "delivery", "admin"].includes(role)) {
      filter.role = role;
    }

    // Status filter
    if (status === "all") {
      filter.status = { $ne: "deleted" };
    } else if (["active", "blocked", "suspended"].includes(status)) {
      filter.status = status;
    } else {
      filter.status = { $ne: "deleted" };
    }

    // Search filter (name, email, phone)
    if (search) {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
      ];
    }

    // Pagination
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const users = await User.find(filter)
      .select("name email phone role status createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const totalCount = await User.countDocuments(filter);

    // Counts mapping (reflects totals regardless of current search/status filters)
    const customerCount = await User.countDocuments({ role: "customer", status: { $ne: "deleted" } });
    const ownerCount = await User.countDocuments({ role: "owner", status: { $ne: "deleted" } });
    const deliveryCount = await User.countDocuments({ role: "delivery", status: { $ne: "deleted" } });

    return res.status(200).json({
      success: true,
      data: {
        users,
        totalCount,
        counts: {
          customer: customerCount,
          owner: ownerCount,
          delivery: deliveryCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/users/:id
export const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select("-password -otpHash -otpExpires");
    if (!user || user.status === "deleted") {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let stats = {};

    if (user.role === "customer") {
      const totalOrdersCount = await Order.countDocuments({ customer: user._id });
      
      const revenueAggregation = await Order.aggregate([
        { $match: { customer: new mongoose.Types.ObjectId(user._id), status: { $ne: "cancelled" } } },
        { $group: { _id: null, totalSpent: { $sum: "$totalAmount" } } }
      ]);
      const totalSpent = Math.round(revenueAggregation[0]?.totalSpent || 0);

      const lastOrders = await Order.find({ customer: user._id })
        .populate("restaurant", "name")
        .sort({ createdAt: -1 })
        .limit(5);

      const formattedOrders = lastOrders.map(o => ({
        id: o._id,
        restaurantName: o.restaurant ? o.restaurant.name : "Unknown Restaurant",
        amount: Math.round(o.totalAmount || 0),
        date: o.createdAt
      }));

      stats = {
        totalOrdersCount,
        totalSpent,
        lastOrders: formattedOrders
      };
    } else if (user.role === "owner") {
      const restaurant = await Restaurant.findOne({ owner: user._id }).select("name approvalStatus");
      
      let totalOrdersReceived = 0;
      let totalRevenueGenerated = 0;

      if (restaurant) {
        totalOrdersReceived = await Order.countDocuments({ restaurant: restaurant._id });
        
        const revenueAggregation = await Order.aggregate([
          { $match: { restaurant: new mongoose.Types.ObjectId(restaurant._id), status: { $ne: "cancelled" } } },
          { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
        ]);
        totalRevenueGenerated = Math.round(revenueAggregation[0]?.totalRevenue || 0);
      }

      stats = {
        restaurant: restaurant ? {
          name: restaurant.name,
          approvalStatus: restaurant.approvalStatus
        } : null,
        totalOrdersReceived,
        totalRevenueGenerated
      };
    } else if (user.role === "delivery") {
      stats = {
        totalDeliveriesCompleted: 0,
        averageRating: 0
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        user,
        stats
      }
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/users/:id/status
export const updateUserStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status || !["active", "suspended"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'active' or 'suspended'.",
      });
    }

    const user = await User.findById(req.params.id);
    if (!user || user.status === "deleted") {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.status = status;
    await user.save();

    const updatedUser = await User.findById(user._id).select("-password -otpHash -otpExpires");

    return res.status(200).json({
      success: true,
      message: `User status updated to ${status} successfully.`,
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/admin/users/:id
export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.status === "deleted") {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // SOFT DELETE: Status set to "deleted"
    user.status = "deleted";
    // Anonymize personal details (free up email for future signup)
    user.email = `deleted_${user._id}@cravingza.local`;
    user.name = "Deleted User";
    user.phone = null;
    user.addresses = []; // Clear addresses for privacy

    await user.save();

    return res.status(200).json({
      success: true,
      message: "User account deleted successfully (soft-deleted).",
    });
  } catch (error) {
    next(error);
  }
};

// Helper function to mask bank details in admin controllers
const maskDeliveryProfile = (profile) => {
  if (!profile) return null;
  const profileObj = profile.toObject ? profile.toObject() : { ...profile };
  if (profileObj.bankDetails && profileObj.bankDetails.accountNumber) {
    const accNum = profileObj.bankDetails.accountNumber;
    profileObj.bankDetails.accountNumber =
      accNum.length > 4
        ? "*".repeat(accNum.length - 4) + accNum.slice(-4)
        : "****" + accNum;
  }
  return profileObj;
};

// GET /api/admin/delivery & GET /api/admin/delivery-partners
export const getDeliveryProfiles = async (req, res, next) => {
  try {
    const { status = "pending" } = req.query;

    let filter = {};
    if (status !== "all") {
      filter.approvalStatus = status;
    }

    const rawProfiles = await DeliveryProfile.find(filter)
      .select("user phone vehicleType vehicleNumber city pincode documents bankDetails approvalStatus rejectionReason submittedAt createdAt")
      .populate("user", "name email phone role")
      .sort({ submittedAt: -1, createdAt: -1 })
      .lean();

    const profiles = rawProfiles
      .filter((p) => p.user && p.user.role !== "admin")
      .map((p) => maskDeliveryProfile(p));

    const pendingCount = await DeliveryProfile.countDocuments({ approvalStatus: "pending" });
    const approvedCount = await DeliveryProfile.countDocuments({ approvalStatus: "approved" });
    const rejectedCount = await DeliveryProfile.countDocuments({ approvalStatus: "rejected" });

    return res.status(200).json({
      success: true,
      data: profiles,
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        all: pendingCount + approvedCount + rejectedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/delivery/:id & GET /api/admin/delivery-partners/:id
export const getDeliveryProfileById = async (req, res, next) => {
  try {
    const profile = await DeliveryProfile.findById(req.params.id)
      .populate("user", "name email phone")
      .populate("reviewedBy", "name email");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner application not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: maskDeliveryProfile(profile),
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/delivery/:id/approve & PATCH /api/admin/delivery-partners/:id/approve
export const approveDeliveryPartner = async (req, res, next) => {
  try {
    const profile = await DeliveryProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner application not found",
      });
    }

    profile.approvalStatus = "approved";
    profile.isOnline = true;
    profile.reviewedAt = new Date();
    profile.reviewedBy = req.user._id;
    profile.rejectionReason = null;

    if (profile.user) {
      await User.findByIdAndUpdate(profile.user, { role: "delivery", status: "active" });
    }

    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Delivery partner approved successfully",
      data: maskDeliveryProfile(profile),
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/delivery/:id/reject & PATCH /api/admin/delivery-partners/:id/reject
export const rejectDeliveryPartner = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const profile = await DeliveryProfile.findById(req.params.id);

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Delivery partner application not found",
      });
    }

    profile.approvalStatus = "rejected";
    profile.rejectionReason = reason;
    profile.reviewedAt = new Date();
    profile.reviewedBy = req.user._id;

    await profile.save();

    return res.status(200).json({
      success: true,
      message: "Delivery partner rejected successfully",
      data: maskDeliveryProfile(profile),
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/analytics-stats
export const getAnalyticsStats = async (req, res, next) => {
  try {
    const { range = "Last 30 Days" } = req.query;

    let startDate = new Date();
    const endDate = new Date();

    if (range === "Today") {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === "Last 7 Days") {
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === "Last 30 Days") {
      startDate.setDate(startDate.getDate() - 30);
    } else if (range === "This Month") {
      startDate = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    } else if (range === "Year to Date") {
      startDate = new Date(startDate.getFullYear(), 0, 1);
    }

    // 1. Total Orders in date range
    const ordersCount = await Order.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    // 2. Total Revenue in date range (excluding cancelled)
    const revenueAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]);
    const totalRevenue = Math.round(revenueAgg[0]?.total || 0);

    // 3. Active Users count
    const activeUsersCount = await User.countDocuments({ status: "active" });

    // 4. Cancelled orders count in date range
    const cancelledOrdersCount = await Order.countDocuments({
      createdAt: { $gte: startDate, $lte: endDate },
      status: "cancelled",
    });

    // 5. Top performing restaurants in date range
    const topRestaurantsAgg = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate },
          status: { $ne: "cancelled" },
        },
      },
      {
        $group: {
          _id: "$restaurant",
          ordersCount: { $sum: 1 },
          revenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);

    const populatedTopRestaurants = await Promise.all(
      topRestaurantsAgg.map(async (item, index) => {
        const restaurant = await Restaurant.findById(item._id).select("name rating");
        return {
          rank: index + 1,
          name: restaurant ? restaurant.name : "Unknown Restaurant",
          orders: item.ordersCount,
          rating: restaurant?.rating || 4.5,
          revenue: `₹${Math.round(item.revenue).toLocaleString("en-IN")}`,
        };
      })
    );

    return res.status(200).json({
      success: true,
      data: {
        range,
        totalRevenue: `₹${totalRevenue.toLocaleString("en-IN")}`,
        totalOrders: ordersCount,
        activeUsers: activeUsersCount,
        convRate: "4.85%",
        cancelledTotal: cancelledOrdersCount,
        topRestaurants: populatedTopRestaurants,
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/admin/settings - Fetch global platform commission and system settings
export const getSettings = async (req, res, next) => {
  try {
    const settings = await SystemSettings.getSettings();

    return res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/admin/settings - Update global platform commission and system settings
export const updateSettings = async (req, res, next) => {
  try {
    const {
      platformName,
      supportEmail,
      supportPhone,
      maintenanceMode,
      restaurantCommissionRate,
      baseDeliveryFee,
      serviceFeePercent,
      taxPercent,
    } = req.body;

    const settings = await SystemSettings.getSettings();

    if (platformName !== undefined) settings.platformName = platformName;
    if (supportEmail !== undefined) settings.supportEmail = supportEmail;
    if (supportPhone !== undefined) settings.supportPhone = supportPhone;
    if (typeof maintenanceMode === "boolean") settings.maintenanceMode = maintenanceMode;

    if (restaurantCommissionRate !== undefined) {
      settings.restaurantCommissionRate = Math.max(0, Math.min(100, Number(restaurantCommissionRate)));
    }
    if (baseDeliveryFee !== undefined) {
      settings.baseDeliveryFee = Math.max(0, Number(baseDeliveryFee));
    }
    if (serviceFeePercent !== undefined) {
      settings.serviceFeePercent = Math.max(0, Math.min(50, Number(serviceFeePercent)));
    }
    if (taxPercent !== undefined) {
      settings.taxPercent = Math.max(0, Math.min(50, Number(taxPercent)));
    }

    await settings.save();

    // Broadcast live WebSocket event to all connected clients (Web & Mobile Apps)
    const io = getIO();
    if (io) {
      console.log(`📢 [Socket.io] Broadcasting maintenance_mode_updated: ${settings.maintenanceMode}`);
      io.emit("settings_updated", settings);
      io.emit("maintenance_mode_updated", { maintenanceMode: settings.maintenanceMode, settings });
    }

    return res.status(200).json({
      success: true,
      message: "System settings updated successfully",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/settings - Public settings endpoint for customer checkout calculation
export const getPublicSettings = async (req, res, next) => {
  try {
    const settings = await SystemSettings.getSettings();

    return res.status(200).json({
      success: true,
      data: {
        platformName: settings.platformName,
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone,
        maintenanceMode: settings.maintenanceMode,
        restaurantCommissionRate: settings.restaurantCommissionRate,
        baseDeliveryFee: settings.baseDeliveryFee,
        serviceFeePercent: settings.serviceFeePercent,
        taxPercent: settings.taxPercent,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/clean-delivery-orders - Remove all delivery orders & reset partner assignments
export const cleanDeliveryOrders = async (req, res, next) => {
  try {
    const targetEmails = [
      "rahul@example.com",
      "gopalg@intrnal.digifux.io",
      "gopalg@internal.digifux.io",
    ];

    const deliveryUsers = await User.find({
      $or: [
        { email: { $in: targetEmails.map((e) => new RegExp(`^${e}$`, "i")) } },
        { role: "delivery" },
        { role: "driver" },
      ],
    });

    const deliveryUserIds = deliveryUsers.map((u) => u._id);

    const deletedDeliveriesResult = await Delivery.deleteMany({
      $or: [
        { deliveryPartner: { $in: deliveryUserIds } },
        { deliveryPartner: { $exists: true } },
      ],
    });

    const resetOrdersResult = await Order.updateMany(
      { deliveryPartner: { $ne: null } },
      { $set: { deliveryPartner: null } }
    );

    if (deliveryUserIds.length > 0) {
      await DeliveryProfile.updateMany(
        { user: { $in: deliveryUserIds } },
        { $set: { isOnline: false } }
      );
    }

    return res.status(200).json({
      success: true,
      message: "All delivery partner orders and delivery records removed successfully. Dashboards reset to fresh state.",
      data: {
        deletedDeliveriesCount: deletedDeliveriesResult.deletedCount,
        resetOrdersCount: resetOrdersResult.modifiedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/admin/reset-all-orders - Wipe all orders across platform for fresh start
export const resetAllOrders = async (req, res, next) => {
  try {
    const ordersResult = await Order.deleteMany({});
    const deliveriesResult = await Delivery.deleteMany({});
    const cartsResult = await Cart.updateMany({}, { $set: { items: [], restaurant: null } });
    await DeliveryProfile.updateMany({}, { $set: { isOnline: false } });

    return res.status(200).json({
      success: true,
      message: "Platform reset successful! All orders and delivery assignments wiped. System is 100% fresh.",
      data: {
        deletedOrdersCount: ordersResult.deletedCount,
        deletedDeliveriesCount: deliveriesResult.deletedCount,
        clearedCartsCount: cartsResult.modifiedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};




