const Restaurant = require("../models/Restaurant");
const { z } = require("zod");

// Helper to mask account number (e.g. "XXXXXX1234")
function maskAccountNumber(accNum) {
  if (!accNum) return "";
  const str = String(accNum).trim();
  if (str.length <= 4) return "XXXX" + str;
  return "XXXXXX" + str.slice(-4);
}

// Zod schemas
const profileSchema = z.object({
  name: z.string().min(2, "Restaurant name must be at least 2 characters").trim().optional(),
  description: z.string().optional().default(""),
  cuisineTags: z.array(z.string()).optional(),
  address: z.string().optional(),
  coverImageUrl: z.string().optional(),
  image: z.string().optional(),
});

const payoutSchema = z.object({
  accountHolderName: z.string().min(2, "Account holder name is required").trim(),
  accountNumber: z.string().min(6, "Account number must be at least 6 digits").trim(),
  ifscCode: z
    .string()
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/i, "Invalid IFSC code format (e.g. SBIN0001234)")
    .trim(),
});

// Helper to find approved restaurant for owner
async function getApprovedOwnerRestaurant(ownerId) {
  const restaurant = await Restaurant.findOne({ owner: ownerId });
  if (!restaurant) {
    const err = new Error("Restaurant not found for this account.");
    err.status = 404;
    throw err;
  }
  if (restaurant.approvalStatus !== "approved") {
    const err = new Error("Restaurant application must be approved to access settings.");
    err.status = 403;
    throw err;
  }
  return restaurant;
}

/**
 * PATCH /api/restaurant/profile
 */
const updateRestaurantProfile = async (req, res, next) => {
  try {
    const restaurant = await getApprovedOwnerRestaurant(req.user._id);

    const validation = profileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.errors,
      });
    }

    const { name, description, cuisineTags, address, coverImageUrl, image } = validation.data;

    if (name !== undefined) restaurant.name = name;
    if (description !== undefined) restaurant.description = description;
    if (cuisineTags !== undefined) restaurant.cuisineTags = cuisineTags;
    if (address !== undefined) {
      restaurant.location = restaurant.location || {};
      restaurant.location.address = address;
    }
    const finalImage = coverImageUrl || image;
    if (finalImage !== undefined) {
      restaurant.image = finalImage;
    }

    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: "Restaurant profile updated successfully.",
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/restaurant/business-hours
 */
const updateBusinessHours = async (req, res, next) => {
  try {
    const restaurant = await getApprovedOwnerRestaurant(req.user._id);
    const { businessHours } = req.body;

    if (!businessHours || typeof businessHours !== "object") {
      return res.status(400).json({
        success: false,
        message: "businessHours object is required.",
      });
    }

    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    for (const day of days) {
      const schedule = businessHours[day];
      if (!schedule) continue;

      if (schedule.isOpen) {
        if (!schedule.openTime || !timeRegex.test(schedule.openTime)) {
          return res.status(400).json({
            success: false,
            message: `Invalid open time format for ${day}. Expected HH:mm (24-hour).`,
          });
        }
        if (!schedule.closeTime || !timeRegex.test(schedule.closeTime)) {
          return res.status(400).json({
            success: false,
            message: `Invalid close time format for ${day}. Expected HH:mm (24-hour).`,
          });
        }
        if (schedule.closeTime <= schedule.openTime) {
          return res.status(400).json({
            success: false,
            message: `Closing time must be after opening time on ${day}.`,
          });
        }
      }
    }

    // Merge business hours
    restaurant.businessHours = {
      ...restaurant.businessHours,
      ...businessHours,
    };

    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: "Business hours updated successfully.",
      data: restaurant.businessHours,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/restaurant/status
 */
const updateRestaurantStatus = async (req, res, next) => {
  try {
    const restaurant = await getApprovedOwnerRestaurant(req.user._id);
    const { isOpen } = req.body;

    if (typeof isOpen !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isOpen boolean field is required.",
      });
    }

    restaurant.isOpen = isOpen;
    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: `Restaurant is now ${isOpen ? "Open" : "Temporarily Closed"}.`,
      data: { isOpen: restaurant.isOpen },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/restaurant/payout-details
 */
const updatePayoutDetails = async (req, res, next) => {
  try {
    const restaurant = await getApprovedOwnerRestaurant(req.user._id);

    const validation = payoutSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: validation.error.errors[0]?.message || "Invalid payout details.",
        errors: validation.error.errors,
      });
    }

    const { accountHolderName, accountNumber, ifscCode } = validation.data;

    restaurant.payoutDetails = {
      accountHolderName,
      accountNumber,
      ifscCode: ifscCode.toUpperCase(),
    };

    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: "Payout details updated successfully.",
      data: {
        accountHolderName: restaurant.payoutDetails.accountHolderName,
        accountNumber: maskAccountNumber(restaurant.payoutDetails.accountNumber),
        ifscCode: restaurant.payoutDetails.ifscCode,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/restaurant/payout-details
 */
const getPayoutDetails = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found.",
      });
    }

    const details = restaurant.payoutDetails || {};

    return res.status(200).json({
      success: true,
      data: {
        accountHolderName: details.accountHolderName || "",
        accountNumber: maskAccountNumber(details.accountNumber),
        ifscCode: details.ifscCode || "",
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/restaurant/close-permanently
 */
const closeRestaurantPermanently = async (req, res, next) => {
  try {
    const restaurant = await getApprovedOwnerRestaurant(req.user._id);
    const { reason } = req.body;

    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "A non-empty reason is required to close the restaurant permanently.",
      });
    }

    restaurant.ownerClosedPermanently = true;
    restaurant.ownerClosureReason = reason.trim();
    restaurant.ownerClosedAt = new Date();

    await restaurant.save();

    // Clear JWT Cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Restaurant has been permanently closed. You have been logged out.",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateRestaurantProfile,
  updateBusinessHours,
  updateRestaurantStatus,
  updatePayoutDetails,
  getPayoutDetails,
  closeRestaurantPermanently,
};
