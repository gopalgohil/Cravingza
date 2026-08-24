import Coupon from "../models/Coupon.js";
import Cart from "../models/Cart.js";
import Restaurant from "../models/Restaurant.js";

// Default pre-seeded industry standard coupons
const DEFAULT_COUPONS = [
  {
    code: "CRAVE50",
    title: "50% OFF up to ₹120",
    description: "Get 50% discount on your favorite meals. Applicable on orders above ₹199.",
    discountType: "percentage",
    discountValue: 50,
    minOrderAmount: 199,
    maxDiscountAmount: 120,
    badgeText: "50% OFF",
    bgGradient: "from-orange-500 to-amber-500",
    category: "flat",
  },
  {
    code: "WELCOME100",
    title: "FLAT ₹100 OFF",
    description: "Special welcome deal for foodies! Flat ₹100 discount on orders above ₹299.",
    discountType: "fixed",
    discountValue: 100,
    minOrderAmount: 299,
    maxDiscountAmount: 100,
    badgeText: "FLAT ₹100",
    bgGradient: "from-rose-500 to-red-600",
    category: "flat",
  },
  {
    code: "FREEDEL50",
    title: "Free Delivery + ₹50 OFF",
    description: "Enjoy zero delivery fee and flat ₹50 OFF on all orders above ₹149.",
    discountType: "fixed",
    discountValue: 50,
    minOrderAmount: 149,
    maxDiscountAmount: 50,
    badgeText: "FREE DELIVERY",
    bgGradient: "from-emerald-500 to-teal-600",
    category: "delivery",
  },
  {
    code: "RAZORPAY20",
    title: "20% Instant Cashback",
    description: "Get 20% instant discount up to ₹100 when you pay online via Razorpay.",
    discountType: "percentage",
    discountValue: 20,
    minOrderAmount: 249,
    maxDiscountAmount: 100,
    badgeText: "ONLINE SPECIAL",
    bgGradient: "from-indigo-600 to-blue-500",
    category: "payment",
  },
];

/**
 * GET /api/offers
 * Returns list of all active coupons & promo deals. Auto-seeds defaults if DB empty.
 */
const getOffers = async (req, res, next) => {
  try {
    let coupons = await Coupon.find({ isActive: true, validTill: { $gt: new Date() } })
      .populate("restaurant", "name image location")
      .sort({ createdAt: -1 });

    if (coupons.length === 0) {
      console.log("[Offers] Seeding default coupons...");
      await Coupon.insertMany(DEFAULT_COUPONS);
      coupons = await Coupon.find({ isActive: true, validTill: { $gt: new Date() } })
        .populate("restaurant", "name image location")
        .sort({ createdAt: -1 });
    }

    return res.status(200).json({
      success: true,
      count: coupons.length,
      data: coupons,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/offers/apply
 * Validates requested coupon against current user cart and calculates discount
 */
const applyCoupon = async (req, res, next) => {
  try {
    const { code, cartTotal } = req.body;
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required.",
      });
    }

    const cleanCode = code.toUpperCase().trim();

    let coupon = await Coupon.findOne({
      code: cleanCode,
      isActive: true,
    }).populate("restaurant", "name");

    // Fallback to pre-seeded DEFAULT_COUPONS if not found in DB
    if (!coupon) {
      const defaultMatch = DEFAULT_COUPONS.find((c) => c.code === cleanCode);
      if (defaultMatch) {
        coupon = defaultMatch;
      }
    }

    if (!coupon) {
      // Demo fallbacks for CRAVE30 / FREEDEL / RESTAURANT30
      if (cleanCode === "CRAVE30" || cleanCode === "RESTAURANT30") {
        coupon = {
          code: cleanCode,
          title: "30% OFF up to ₹150",
          discountType: "percentage",
          discountValue: 30,
          minOrderAmount: 199,
          maxDiscountAmount: 150,
          category: "flat",
        };
      } else if (cleanCode === "FREEDEL" || cleanCode === "REEDEL50" || cleanCode === "FREEDEL50" || cleanCode.includes("REDEL")) {
        coupon = {
          code: cleanCode,
          title: "Free Delivery + ₹50 OFF",
          discountType: "fixed",
          discountValue: 50,
          minOrderAmount: 0,
          maxDiscountAmount: 50,
          category: "delivery",
        };
      }
    }

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid or expired coupon code.",
      });
    }

    // 🔒 Strictly enforce ONE-TIME per account usage across all orders
    if (req.user?._id) {
      const Order = (await import("../models/Order.js")).default;
      const alreadyUsedOrder = await Order.findOne({
        customer: req.user._id,
        couponCode: cleanCode,
        status: { $ne: "cancelled" },
      });

      if (alreadyUsedOrder) {
        return res.status(400).json({
          success: false,
          message: `Coupon code "${cleanCode}" has already been used on a previous order. Each coupon code can only be used ONCE per account!`,
        });
      }
    }

    // Check if one-time coupon was already marked in DB
    if (coupon.isOneTimePerUser && coupon.usedByUsers && req.user?._id) {
      const alreadyUsed = coupon.usedByUsers.some((userId) => userId.toString() === req.user._id.toString());
      if (alreadyUsed) {
        return res.status(400).json({
          success: false,
          message: `You have already used coupon code ${coupon.code} on a previous order.`,
        });
      }
    }

    // Calculate subtotal from cart or body cartTotal
    let subtotal = Number(cartTotal || 0);
    if (!subtotal && req.user?._id) {
      const cart = await Cart.findOne({ user: req.user._id });
      if (cart) subtotal = cart.subtotal || 0;
    }
    if (!subtotal) subtotal = 300; // Default dev fallback

    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${coupon.minOrderAmount} required for coupon ${coupon.code}.`,
      });
    }

    // Calculate discount amount
    let discountAmount = 0;
    if (coupon.discountType === "percentage") {
      discountAmount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount && discountAmount > coupon.maxDiscountAmount) {
        discountAmount = coupon.maxDiscountAmount;
      }
    } else {
      discountAmount = coupon.discountValue;
    }

    discountAmount = Math.min(discountAmount, subtotal); // Cannot exceed subtotal

    const isFreeDel = coupon.category === "delivery" || cleanCode.includes("FREEDEL") || cleanCode.includes("REEDEL");

    return res.status(200).json({
      success: true,
      message: `Coupon ${coupon.code} applied successfully! Saved ₹${Math.round(discountAmount * 100) / 100}${isFreeDel ? " + Free Delivery" : ""}`,
      discountAmount: Math.round(discountAmount * 100) / 100,
      isFreeDelivery: isFreeDel,
      data: {
        code: coupon.code,
        title: coupon.title,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: Math.round(discountAmount * 100) / 100,
        subtotal,
        finalSubtotal: Math.max(0, Math.round((subtotal - discountAmount) * 100) / 100),
        category: coupon.category,
        isFreeDelivery: isFreeDel,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/offers/merchant
 * Returns all coupons for merchant management
 */
const getMerchantOffers = async (req, res, next) => {
  try {
    let coupons = await Coupon.find().sort({ createdAt: -1 });
    if (coupons.length === 0) {
      await Coupon.insertMany(DEFAULT_COUPONS);
      coupons = await Coupon.find().sort({ createdAt: -1 });
    }
    return res.status(200).json({
      success: true,
      count: coupons.length,
      data: coupons,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/offers/merchant
 * Creates a new merchant coupon
 */
const createMerchantOffer = async (req, res, next) => {
  try {
    const {
      code,
      title,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      badgeText,
      bgGradient,
      validDays,
      category,
    } = req.body;

    if (!code || !title || !discountType || discountValue === undefined) {
      return res.status(400).json({
        success: false,
        message: "Code, Title, Discount Type, and Discount Value are required.",
      });
    }

    const cleanCode = code.toUpperCase().trim();
    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Coupon code "${cleanCode}" already exists.`,
      });
    }

    const validTill = new Date(Date.now() + (validDays || 30) * 24 * 60 * 60 * 1000);
    const ownerRestaurant = await Restaurant.findOne({ owner: req.user._id });

    const coupon = new Coupon({
      code: cleanCode,
      title,
      description: description || `${badgeText || "Special Offer"} on your favorite meals!`,
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount || 0),
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
      badgeText: badgeText || "PARTNER DEAL",
      bgGradient: bgGradient || "from-orange-500 to-amber-500",
      category: category || "flat",
      restaurant: ownerRestaurant ? ownerRestaurant._id : null,
      validTill,
      isActive: true,
    });

    await coupon.save();

    return res.status(201).json({
      success: true,
      message: `Coupon ${coupon.code} created successfully!`,
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/offers/merchant/:id
 * Deletes a merchant coupon
 */
const deleteMerchantOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const coupon = await Coupon.findByIdAndDelete(id);
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found.",
      });
    }
    return res.status(200).json({
      success: true,
      message: `Coupon ${coupon.code} deleted successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

export {
  getOffers,
  applyCoupon,
  getMerchantOffers,
  createMerchantOffer,
  deleteMerchantOffer,
};
