const Restaurant = require("../models/Restaurant");
const User = require("../models/User");
const { z } = require("zod");

// ── Zod Validation Schema ─────────────────────────────────────────
const applySchema = z.object({
  name: z.string().min(2, "Restaurant name must be at least 2 characters").trim(),
  description: z.string().min(10, "Description must be at least 10 characters").trim(),
  cuisineTags: z.array(z.string()).min(1, "At least one cuisine tag is required"),
  addressLine: z.string().min(5, "Address is required").trim(),
  city: z.string().min(2, "City is required").trim(),
  pincode: z.string().min(4, "Pincode is required").trim(),
  coverImageUrl: z.string().url("Cover image URL is invalid"),
  fssaiLicenseUrl: z.string().url("FSSAI License URL is invalid"),
  businessRegistrationUrl: z.string().url("Business Registration URL is invalid"),
  ownerPhone: z.string().min(10, "Phone number must be at least 10 digits").trim(),
});

// ── POST /api/restaurant/apply ────────────────────────────────────
const applyAsPartner = async (req, res, next) => {
  try {
    const validation = applySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.errors.map((e) => e.message),
      });
    }

    const {
      name, description, cuisineTags, addressLine, city, pincode,
      coverImageUrl, fssaiLicenseUrl, businessRegistrationUrl, ownerPhone,
    } = validation.data;

    // Check if user already has a pending or approved restaurant
    const existing = await Restaurant.findOne({
      owner: req.user._id,
      approvalStatus: { $in: ["pending", "approved"] },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `You already have a ${existing.approvalStatus} restaurant application. You cannot apply again.`,
      });
    }

    // Create the restaurant application
    const restaurant = await Restaurant.create({
      owner: req.user._id,
      name,
      description,
      cuisineTags,
      image: coverImageUrl,
      location: { address: addressLine, city },
      pincode,
      ownerPhone,
      documents: {
        fssaiLicense: fssaiLicenseUrl,
        businessRegistration: businessRegistrationUrl,
      },
      approvalStatus: "pending",
      submittedAt: new Date(),
    });

    // Upgrade role to "owner" if not already
    if (req.user.role !== "owner") {
      await User.findByIdAndUpdate(req.user._id, { role: "owner" });
    }

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully. We'll review it shortly.",
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/restaurant/my-application ───────────────────────────
const getMyApplication = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id }).sort({ createdAt: -1 });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "No restaurant application found for this account.",
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

// ── POST /api/restaurant/reapply ─────────────────────────────────
const reapplyAsPartner = async (req, res, next) => {
  try {
    const existing = await Restaurant.findOne({ owner: req.user._id });

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

    const validation = applySchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.errors.map((e) => e.message),
      });
    }

    const {
      name, description, cuisineTags, addressLine, city, pincode,
      coverImageUrl, fssaiLicenseUrl, businessRegistrationUrl, ownerPhone,
    } = validation.data;

    const updated = await Restaurant.findByIdAndUpdate(
      existing._id,
      {
        name,
        description,
        cuisineTags,
        image: coverImageUrl,
        "location.address": addressLine,
        "location.city": city,
        pincode,
        ownerPhone,
        "documents.fssaiLicense": fssaiLicenseUrl,
        "documents.businessRegistration": businessRegistrationUrl,
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
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { applyAsPartner, getMyApplication, reapplyAsPartner };
