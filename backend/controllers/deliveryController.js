import DeliveryProfile from "../models/DeliveryProfile.js";
import Delivery from "../models/Delivery.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
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
  if (!profile) {
    // If user has driver or admin role, auto-create approved profile
    if (user.role === "driver" || user.role === "delivery_partner" || user.role === "admin") {
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
  } else if (profile.approvalStatus !== "approved" && (user.role === "driver" || user.role === "delivery_partner" || user.role === "admin")) {
    profile.approvalStatus = "approved";
    if (profile.isOnline === undefined) profile.isOnline = true;
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
      if (!profile || profile.approvalStatus !== "approved") {
        return res.status(403).json({
          success: false,
          message: "Approved delivery partner profile required.",
        });
      }

      if (!profile.isOnline) {
        return res.status(200).json({
          success: true,
          isOnline: false,
          message: "You are currently offline. Go online to view nearby orders.",
          data: [],
        });
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

      // TODO: Real distance-based filtering requires delivery partner live geolocation (Mapbox/Google Maps integration planned)
      const orders = await Order.find({
        status: { $in: ["ready_for_pickup", "accepted", "preparing"] },
        deliveryPartner: null,
      })
        .populate("restaurant", "name location phone image description")
        .populate("customer", "name phone")
        .sort({ readyAt: -1, updatedAt: -1, createdAt: -1 });

      const formattedOrders = orders.map((o) => ({
        _id: o._id,
        orderId: o._id,
        restaurantName: o.restaurant?.name || "Restaurant",
        restaurantAddress: o.restaurant?.location?.address || "City Centre",
        deliveryAddress: o.deliveryAddress?.addressLine || "",
        itemsCount: o.items ? o.items.length : 0,
        totalAmount: o.totalAmount,
        estimatedEarnings: 40,
        readyAt: o.readyAt || o.updatedAt,
        createdAt: o.createdAt,
      }));

      return res.status(200).json({
        success: true,
        isOnline: true,
        hasActiveDelivery: false,
        data: formattedOrders,
      });
    } catch (error) {
      next(error);
  };
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

      if (order.deliveryPartner) {
        return res.status(409).json({
          success: false,
          message: "This order was just accepted by another partner.",
        });
      }

      order.deliveryPartner = req.user._id;
      await order.save();

      const delivery = await Delivery.create({
        order: order._id,
        deliveryPartner: req.user._id,
        status: "assigned",
        assignedAt: new Date(),
        earnings: 40,
      });

      const populatedDelivery = await Delivery.findById(delivery._id).populate({
        path: "order",
        populate: [
          { path: "restaurant", select: "name location phone image" },
          { path: "customer", select: "name phone" },
        ],
      });

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

    const delivery = await Delivery.findById(deliveryId);
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
      delivery.earnings = 40;
      await Order.findByIdAndUpdate(delivery.order, { status: "delivered" });
    }

    await delivery.save();

    const updated = await Delivery.findById(delivery._id).populate({
      path: "order",
      populate: [
        { path: "restaurant", select: "name location phone image" },
        { path: "customer", select: "name phone" },
      ],
    });

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

      const history = deliveries.map((d) => {
        const amount = d.earnings || 40;
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
          restaurantName: d.order?.restaurant?.name || "Cravingza Order",
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
