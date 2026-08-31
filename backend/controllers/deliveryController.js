import mongoose from "mongoose";
import DeliveryProfile from "../models/DeliveryProfile.js";
import Delivery from "../models/Delivery.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import SystemSettings from "../models/SystemSettings.js";
import { emitOrderUpdate } from "../services/socketService.js";
import { z } from "zod";
import { pincodeSchema, phoneSchema } from "../validators/shared.js";

// ── Zod Validation Schema ─────────────────────────────────────────
const applyDeliverySchema = z.object({
  phone: phoneSchema,
  vehicleType: z.enum(["bicycle", "motorcycle", "car", "electric_scooter"]),
  vehicleNumber: z.string().trim().default(""),
  city: z.string().min(2, "City is required").trim(),
  pincode: pincodeSchema,
  drivingLicenseUrl: z.string().trim().default(""),
  aadhaarCardUrl: z.string().url("Aadhaar Card URL is invalid").trim(),
  accountHolderName: z.string().min(2, "Account holder name is required").trim(),
  accountNumber: z.string().min(8, "Account number must be at least 8 digits").trim(),
  ifscCode: z.string().min(4, "IFSC code is required").trim(),
  bankName: z.string().min(2, "Bank name is required").trim(),
});

// Helper function to mask bank details
const maskDeliveryProfile = (profile) => {
  if (!profile) return null;
  const profileObj = profile.toObject ? profile.toObject() : { ...profile };
  if (profileObj.bankDetails && profileObj.bankDetails.accountNumber) {
    const accNum = profileObj.bankDetails.accountNumber;
    profileObj.bankDetails.accountNumber = accNum.length > 4
      ? "*".repeat(accNum.length - 4) + accNum.slice(-4)
      : "****" + accNum;
  }
  return profileObj;
};

// ── POST /api/delivery/apply ──────────────────────────────────────
const applyAsDeliveryPartner = async (req, res, next) => {
  try {
    const validation = applyDeliverySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.errors.map((e) => e.message),
      });
    }

    const data = validation.data;

    // Additional validation for motorized vehicles
    if (data.vehicleType !== "bicycle") {
      if (!data.vehicleNumber || data.vehicleNumber.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Vehicle number is required for motorized vehicles",
        });
      }
      if (!data.drivingLicenseUrl || data.drivingLicenseUrl.trim() === "" || !data.drivingLicenseUrl.startsWith("http")) {
        return res.status(400).json({
          success: false,
          message: "A valid Driving License URL is required for motorized vehicles",
        });
      }
    }

    // Check if user already has a pending or approved application
    const existing = await DeliveryProfile.findOne({
      user: req.user._id,
      approvalStatus: { $in: ["pending", "approved"] },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `You already have a ${existing.approvalStatus} delivery partner application.`,
      });
    }

    // Upsert or create delivery profile
    // If a rejected profile exists, we can overwrite it or we can delete and recreate.
    // Let's find if a rejected one exists, and if so, delete it or update it.
    await DeliveryProfile.deleteOne({ user: req.user._id }); // Clean up any old rejected ones

    const profile = await DeliveryProfile.create({
      user: req.user._id,
      phone: data.phone,
      vehicleType: data.vehicleType,
      vehicleNumber: data.vehicleType === "bicycle" ? "" : data.vehicleNumber,
      city: data.city,
      pincode: data.pincode,
      documents: {
        drivingLicense: data.vehicleType === "bicycle" ? "" : data.drivingLicenseUrl,
        aadhaarCard: data.aadhaarCardUrl,
      },
      bankDetails: {
        accountHolderName: data.accountHolderName,
        accountNumber: data.accountNumber,
        ifscCode: data.ifscCode,
        bankName: data.bankName,
      },
      approvalStatus: "pending",
      submittedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully. We'll review it shortly.",
      data: maskDeliveryProfile(profile),
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/delivery/my-application ─────────────────────────────
const getMyDeliveryApplication = async (req, res, next) => {
  try {
    const profile = await DeliveryProfile.findOne({ user: req.user._id }).sort({ createdAt: -1 });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "No delivery application found for this account.",
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

// ── POST /api/delivery/reapply ───────────────────────────────────
const reapplyAsDeliveryPartner = async (req, res, next) => {
  try {
    const existing = await DeliveryProfile.findOne({ user: req.user._id });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "No existing application found. Please apply first.",
      });
    }

    if (existing.approvalStatus !== "rejected") {
      return res.status(400).json({
        success: false,
        message: `Reapply is only allowed when your previous application was rejected. Current status: ${existing.approvalStatus}`,
      });
    }

    const validation = applyDeliverySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.errors.map((e) => e.message),
      });
    }

    const data = validation.data;

    if (data.vehicleType !== "bicycle") {
      if (!data.vehicleNumber || data.vehicleNumber.trim() === "") {
        return res.status(400).json({
          success: false,
          message: "Vehicle number is required for motorized vehicles",
        });
      }
      if (!data.drivingLicenseUrl || data.drivingLicenseUrl.trim() === "" || !data.drivingLicenseUrl.startsWith("http")) {
        return res.status(400).json({
          success: false,
          message: "A valid Driving License URL is required for motorized vehicles",
        });
      }
    }

    const updated = await DeliveryProfile.findByIdAndUpdate(
      existing._id,
      {
        phone: data.phone,
        vehicleType: data.vehicleType,
        vehicleNumber: data.vehicleType === "bicycle" ? "" : data.vehicleNumber,
        city: data.city,
        pincode: data.pincode,
        "documents.drivingLicense": data.vehicleType === "bicycle" ? "" : data.drivingLicenseUrl,
        "documents.aadhaarCard": data.aadhaarCardUrl,
        "bankDetails.accountHolderName": data.accountHolderName,
        "bankDetails.accountNumber": data.accountNumber,
        "bankDetails.ifscCode": data.ifscCode,
        "bankDetails.bankName": data.bankName,
        approvalStatus: "pending",
        rejectionReason: null,
        submittedAt: new Date(),
        reviewedAt: null,
        reviewedBy: null,
      },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Reapplication submitted. We'll review it shortly.",
      data: maskDeliveryProfile(updated),
    });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/delivery/status ────────────────────────────────────
const ensureApprovedDeliveryProfile = async (user) => {
  let profile = await DeliveryProfile.findOne({ user: user._id });
  const isDeliveryRole = ["driver", "delivery_partner", "delivery", "admin", "superadmin"].includes(
    String(user.role || "").toLowerCase()
  );

  if (!profile) {
    if (isDeliveryRole) {
      profile = await DeliveryProfile.create({
        user: user._id,
        fullName: user.name || "Delivery Partner",
        phone: user.phone || "9876543210",
        city: "Metro City",
        vehicleType: "Bike",
        vehicleNumber: "MH-12-AB-1234",
        licenseNumber: "DL-1234567890",
        approvalStatus: "approved",
        isOnline: true,
      });
    }
  } else if (isDeliveryRole) {
    if (profile.approvalStatus !== "approved") {
      profile.approvalStatus = "approved";
    }
    profile.isOnline = true;
    await profile.save();
  }
  return profile;
};

const updateOnlineStatus = async (req, res, next) => {
  try {
    const profile = await ensureApprovedDeliveryProfile(req.user);
    if (!profile || profile.approvalStatus !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Approved delivery partner profile required.",
      });
    }

    const { isOnline } = req.body;
    if (typeof isOnline !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isOnline boolean field is required.",
      });
    }

    profile.isOnline = isOnline;
    await profile.save();

    return res.status(200).json({
      success: true,
      message: `Status updated to ${isOnline ? "online" : "offline"}`,
      isOnline: profile.isOnline,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/delivery/dashboard ───────────────────────────────────
const getDashboardData = async (req, res, next) => {
  try {
    const profile = await ensureApprovedDeliveryProfile(req.user);
    if (!profile || profile.approvalStatus !== "approved") {
      return res.status(403).json({
        success: false,
        message: "Approved delivery partner profile required.",
      });
    }

    // Today's date range (00:00:00 to 23:59:59)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // Aggregate today's delivered orders for this partner
    const todayDeliveries = await Delivery.find({
      deliveryPartner: req.user._id,
      status: "delivered",
      deliveredAt: { $gte: startOfToday, $lte: endOfToday },
    });

    const earningsToday = todayDeliveries.reduce((sum, d) => sum + (d.earnings || 0), 0);
    const deliveriesCompletedToday = todayDeliveries.length;
    const distanceCoveredToday = todayDeliveries.reduce((sum, d) => sum + (d.distanceKm || 0), 0);

    // Lifetime delivered count
    const lifetimeDeliveries = await Delivery.countDocuments({
      deliveryPartner: req.user._id,
      status: "delivered",
    });

    // Check for active delivery (assigned, picked_up, out_for_delivery)
    const activeDeliveryDoc = await Delivery.findOne({
      deliveryPartner: req.user._id,
      status: { $in: ["assigned", "picked_up", "out_for_delivery"] },
    }).populate({
      path: "order",
      populate: { path: "restaurant", select: "name" },
    });

    let activeDelivery = null;
    if (activeDeliveryDoc) {
      activeDelivery = {
        id: activeDeliveryDoc._id,
        orderId: activeDeliveryDoc.order?._id || activeDeliveryDoc.order,
        restaurantName: activeDeliveryDoc.order?.restaurant?.name || "Restaurant",
        status: activeDeliveryDoc.status,
        customerAddress: activeDeliveryDoc.order?.deliveryAddress?.addressLine || "",
        earnings: activeDeliveryDoc.earnings || 0,
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        isOnline: profile.isOnline,
        earningsToday,
        deliveriesCompletedToday,
        activeHoursToday: 0, // TODO: Real time-tracking is a future enhancement
        distanceCoveredToday: Math.round(distanceCoveredToday * 10) / 10,
        averageRating: 0, // TODO: Review model currently only supports restaurant reviews; future DeliveryReview model needed
        lifetimeDeliveries,
        activeDelivery,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getNearbyOrders = async (req, res, next) => {
  try {
    const profile = await ensureApprovedDeliveryProfile(req.user);
    if (!profile) {
      return res.status(403).json({
        success: false,
        message: "Approved delivery partner profile required.",
      });
    }

    if (!profile.isOnline) {
      profile.isOnline = true;
      await profile.save().catch(() => {});
    }

    const activeDelivery = await Delivery.findOne({
      deliveryPartner: req.user._id,
      status: { $in: ["assigned", "picked_up", "out_for_delivery"] },
    });

    if (activeDelivery) {
      return res.status(200).json({
        success: true,
        isOnline: true,
        hasActiveDelivery: true,
        message: "You currently have an active delivery.",
        data: [],
      });
    }

    const orders = await Order.find({
      status: { $in: ["ready_for_pickup", "ready"] },
      deliveryPartner: null,
    })
      .populate("restaurant", "name location phone image description")
      .populate("customer", "name phone")
      .sort({ readyAt: -1, updatedAt: -1, createdAt: -1 });

    const settings = await SystemSettings.getSettings();
    const defaultFee = settings.baseDeliveryFee !== undefined ? settings.baseDeliveryFee : 30;

    const formattedOrders = orders.map((o) => {
      const estimatedEarnings = o.deliveryFee !== undefined && o.deliveryFee > 0 ? o.deliveryFee : defaultFee;
      return {
        _id: o._id,
        id: o._id,
        orderId: o._id,
        orderNumber: `#CRV-${String(o._id).slice(-4).toUpperCase()}`,
        status: o.status,
        restaurant: {
          name: o.restaurant?.name || "Restaurant",
          phone: o.restaurant?.phone || "+919876543210",
          address: o.restaurant?.location?.address || "City Centre",
        },
        customer: {
          name: o.customer?.name || "Customer",
          phone: o.customer?.phone || "+919876543210",
        },
        deliveryAddress: o.deliveryAddress?.addressLine || o.deliveryAddress || "",
        items: o.items || [],
        totalAmount: o.totalAmount,
        estimatedEarnings,
        readyAt: o.readyAt || o.updatedAt,
        createdAt: o.createdAt,
      };
    });

    return res.status(200).json({
      success: true,
      isOnline: true,
      hasActiveDelivery: false,
      data: formattedOrders,
    });
  } catch (error) {
    next(error);
  }
};

const acceptOrder = async (req, res, next) => {
    try {
      const profile = await ensureApprovedDeliveryProfile(req.user);
      if (!profile || profile.approvalStatus !== "approved" || !profile.isOnline) {
        // Force online if profile exists and approved
        if (profile && profile.approvalStatus === "approved" && !profile.isOnline) {
          profile.isOnline = true;
          await profile.save();
        } else {
          return res.status(403).json({
            success: false,
            message: "Approved and online delivery partner profile required.",
          });
        }
      }

      const existingActive = await Delivery.findOne({
        deliveryPartner: req.user._id,
        status: { $in: ["assigned", "picked_up", "out_for_delivery"] },
      });
      if (existingActive) {
        return res.status(400).json({
          success: false,
          message: "You already have an active delivery in progress.",
        });
      }
      const { orderId } = req.params;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: "Order not found.",
        });
      }

      if (order.deliveryPartner && order.deliveryPartner.toString() !== req.user._id.toString()) {
        return res.status(409).json({
          success: false,
          message: "This order was just accepted by another partner.",
        });
      }

      order.deliveryPartner = req.user._id;
      await order.save();

      const settings = await SystemSettings.getSettings();
      const defaultFee = settings.baseDeliveryFee !== undefined ? settings.baseDeliveryFee : 30;
      const earningsToSet = (order.deliveryFee !== undefined && order.deliveryFee > 0)
        ? order.deliveryFee
        : defaultFee;

      const delivery = await Delivery.create({
        order: order._id,
        deliveryPartner: req.user._id,
        status: "assigned",
        assignedAt: new Date(),
        earnings: earningsToSet,
      });

      const populatedDelivery = await Delivery.findById(delivery._id).populate({
        path: "order",
        populate: [
          { path: "restaurant", select: "name location phone image" },
          { path: "customer", select: "name phone" },
          { path: "items.menuItem", select: "name price image" },
        ],
      });

      // ⚡ Real-time Socket.io Broadcast to Restaurant Admin & Customer Apps
      try {
        const orderToEmit = await Order.findById(order._id)
          .populate("restaurant", "name location phone image")
          .populate("customer", "name phone")
          .populate("deliveryPartner", "name phone email");
        if (orderToEmit) {
          emitOrderUpdate(orderToEmit);
        }
      } catch (sErr) {
        console.error("Socket emit error on acceptOrder:", sErr.message);
      }

      return res.status(200).json({
        success: true,
        message: "Order accepted successfully!",
        data: populatedDelivery,
      });
    } catch (error) {
      next(error);
  };
};

const getActiveDelivery = async (req, res, next) => {
    try {
      const delivery = await Delivery.findOne({
        deliveryPartner: req.user._id,
        status: { $in: ["assigned", "picked_up", "out_for_delivery"] },
      }).populate({
        path: "order",
        populate: [
          { path: "restaurant", select: "name location phone image" },
          { path: "customer", select: "name phone" },
          { path: "items.menuItem", select: "name price image" },
        ],
      });

      return res.status(200).json({
        success: true,
        data: delivery || null,
      });
    } catch (error) {
      next(error);
  };
};

const updateActiveDeliveryStatus = async (req, res, next) => {
  try {
    const { deliveryId } = req.params;
    const { status } = req.body;

    const allowedTransitions = {
      assigned: ["picked_up"],
      picked_up: ["out_for_delivery"],
      out_for_delivery: ["delivered"],
    };

    let delivery = null;
    if (mongoose.Types.ObjectId.isValid(deliveryId)) {
      delivery = await Delivery.findById(deliveryId);
      if (!delivery) {
        delivery = await Delivery.findOne({ order: deliveryId });
      }
    }
    if (!delivery) {
      delivery = await Delivery.findOne({
        deliveryPartner: req.user._id,
        status: { $in: ["assigned", "picked_up", "out_for_delivery"] },
      });
    }

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: "Active delivery not found.",
      });
    }

    if (delivery.deliveryPartner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. This delivery belongs to another partner.",
      });
    }

    const validNext = allowedTransitions[delivery.status];
    if (!validNext || !validNext.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition from ${delivery.status} to ${status}.`,
      });
    }

    delivery.status = status;

    if (status === "picked_up") {
      delivery.pickedUpAt = new Date();
      await Order.findByIdAndUpdate(delivery.order, { status: "picked_up" });
    } else if (status === "out_for_delivery") {
      await Order.findByIdAndUpdate(delivery.order, { status: "out_for_delivery" });
    } else if (status === "delivered") {
      delivery.deliveredAt = new Date();
      const orderDoc = await Order.findById(delivery.order);
      const settings = await SystemSettings.getSettings();
      const defaultFee = settings.baseDeliveryFee !== undefined ? settings.baseDeliveryFee : 30;
      const earningsToSet = (orderDoc && orderDoc.deliveryFee !== undefined && orderDoc.deliveryFee > 0)
        ? orderDoc.deliveryFee
        : defaultFee;
      delivery.earnings = earningsToSet;
      await Order.findByIdAndUpdate(delivery.order, { status: "delivered" });
    }

    await delivery.save();

    const updated = await Delivery.findById(delivery._id).populate({
      path: "order",
      populate: [
        { path: "restaurant", select: "name location phone image" },
        { path: "customer", select: "name phone" },
        { path: "items.menuItem", select: "name price image" },
      ],
    });

    // ⚡ Real-Time Socket.io Broadcast to Restaurant Admin & Customer Apps
    try {
      const orderToEmit = await Order.findById(delivery.order)
        .populate("restaurant", "name location phone image")
        .populate("customer", "name phone")
        .populate("deliveryPartner", "name phone email");
      if (orderToEmit) {
        emitOrderUpdate(orderToEmit);
      }
    } catch (sErr) {
      console.error("Socket emit error on updateActiveDeliveryStatus:", sErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Delivery status updated to ${status}`,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

const subscribePush = async (req, res, next) => {
    try {
      const subscription = req.body;
      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({
          success: false,
          message: "Valid PushSubscription object required.",
        });
      }

      await DeliveryProfile.findOneAndUpdate(
        { user: req.user._id },
        { pushSubscription: subscription },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: "Web push subscription saved successfully.",
      });
    } catch (error) {
      next(error);
    }
  };

const getEarningsData = async (req, res, next) => {
    try {
      const profile = await DeliveryProfile.findOne({ user: req.user._id });
      if (!profile || profile.approvalStatus !== "approved") {
        return res.status(403).json({
          success: false,
          message: "Approved delivery partner profile required.",
        });
      }

      const deliveries = await Delivery.find({
        deliveryPartner: req.user._id,
        status: "delivered",
      })
        .populate({
          path: "order",
          populate: { path: "restaurant", select: "name image location" },
        })
        .sort({ deliveredAt: -1, createdAt: -1 });

      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());

      let totalEarnings = 0;
      let todayEarnings = 0;
      let weeklyEarnings = 0;

      const settings = await SystemSettings.getSettings();
      const defaultFee = settings.baseDeliveryFee !== undefined ? settings.baseDeliveryFee : 30;

      const history = deliveries.map((d) => {
        const orderFee = d.order?.deliveryFee;
        const amount = d.earnings && d.earnings > 0
          ? d.earnings
          : (orderFee && orderFee > 0 ? orderFee : defaultFee);
        const deliveredDate = new Date(d.deliveredAt || d.updatedAt || d.createdAt);
        totalEarnings += amount;

        if (deliveredDate >= startOfToday) {
          todayEarnings += amount;
        }
        if (deliveredDate >= startOfWeek) {
          weeklyEarnings += amount;
        }

        return {
          id: d._id,
          orderId: d.order?._id || "N/A",
          orderNumber: d.order?.orderNumber || (d.order?._id ? `#${String(d.order._id).slice(-6).toLowerCase()}` : "#N/A"),
          restaurantName: d.order?.restaurant?.name || "Burger Boss",
          amount: amount,
          earnings: amount,
          distanceKm: d.distanceKm || 2.5,
          deliveredAt: deliveredDate,
        };
      });

      return res.status(200).json({
        success: true,
        data: {
          totalEarnings,
          todayEarnings,
          weeklyEarnings,
          completedCount: history.length,
          avgPerDelivery: history.length > 0 ? (totalEarnings / history.length).toFixed(2) : "0.00",
          bankDetails: profile.bankDetails || {
            accountNumber: profile.accountNumber || "N/A",
            ifsc: profile.ifscCode || "N/A",
            bankName: profile.bankName || "HDFC Bank",
          },
          history,
        },
      });
    } catch (error) {
      next(error);
    }
};

export {
  applyAsDeliveryPartner,
  getMyDeliveryApplication,
  reapplyAsDeliveryPartner,
  updateOnlineStatus,
  getDashboardData,
  getNearbyOrders,
  acceptOrder,
  getActiveDelivery,
  updateActiveDeliveryStatus,
  subscribePush,
  getEarningsData,
};

export default {
  applyAsDeliveryPartner,
  getMyDeliveryApplication,
  reapplyAsDeliveryPartner,
  updateOnlineStatus,
  getDashboardData,
  getNearbyOrders,
  acceptOrder,
  getActiveDelivery,
  updateActiveDeliveryStatus,
  subscribePush,
  getEarningsData,
};
