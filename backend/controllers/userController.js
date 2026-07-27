const { z } = require("zod");
const bcrypt = require("bcryptjs");
const User = require("../models/User");

// Helper to format Zod validation errors
const formatZodErrors = (zodError) => {
  return zodError.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
};

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(50, { message: "Name cannot exceed 50 characters" }),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[1-9]\d{1,14}$|^[0-9]{10}$/, { message: "Invalid phone number format" })
    .optional()
    .or(z.literal("")),
});

const passwordStrengthSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters long" })
  .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
  .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
  .regex(/[0-9]/, { message: "Password must contain at least one number" })
  .regex(/[^A-Za-z0-9]/, { message: "Password must contain at least one special character" });

/**
 * PATCH /api/user/profile
 */
const updateProfile = async (req, res) => {
  try {
    const validation = profileSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formatZodErrors(validation.error),
      });
    }

    const { name, phone } = validation.data;
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.name = name;
    user.phone = phone || null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          avatar: user.avatar,
          addresses: user.addresses,
          notificationPreferences: user.notificationPreferences,
        },
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ success: false, message: "Server error updating profile" });
  }
};

/**
 * PATCH /api/user/password
 */
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Validate new password strength
    const passwordValidation = passwordStrengthSchema.safeParse(newPassword);
    if (!passwordValidation.success) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.error.errors[0].message,
        errors: formatZodErrors(passwordValidation.error),
      });
    }

    // Hash and save new password (relies on pre-save hook)
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Update password error:", error);
    return res.status(500).json({ success: false, message: "Server error updating password" });
  }
};

/**
 * GET /api/user/addresses
 */
const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({
      success: true,
      data: user.addresses || [],
    });
  } catch (error) {
    console.error("Get addresses error:", error);
    return res.status(500).json({ success: false, message: "Server error fetching addresses" });
  }
};

/**
 * POST /api/user/addresses
 */
const addAddress = async (req, res) => {
  try {
    const { label, addressLine, city, pincode, isDefault, lat, lng } = req.body;

    if (!addressLine || !city) {
      return res.status(400).json({
        success: false,
        message: "Address line and city are required",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Handle isDefault exclusivity
    if (isDefault) {
      user.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    user.addresses.push({
      label: label || "Home",
      addressLine,
      city,
      pincode,
      lat: lat || 0,
      lng: lng || 0,
      isDefault: isDefault || false,
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address added successfully",
      data: user.addresses,
    });
  } catch (error) {
    console.error("Add address error:", error);
    return res.status(500).json({ success: false, message: "Server error adding address" });
  }
};

/**
 * PATCH /api/user/addresses/:addressId
 */
const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { label, addressLine, city, pincode, isDefault, lat, lng } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    // Handle isDefault exclusivity
    if (isDefault) {
      user.addresses.forEach((addr) => {
        if (addr._id.toString() !== addressId) {
          addr.isDefault = false;
        }
      });
    }

    if (label) address.label = label;
    if (addressLine) address.addressLine = addressLine;
    if (city) address.city = city;
    if (pincode !== undefined) address.pincode = pincode;
    if (isDefault !== undefined) address.isDefault = isDefault;
    if (lat !== undefined) address.lat = lat;
    if (lng !== undefined) address.lng = lng;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully",
      data: user.addresses,
    });
  } catch (error) {
    console.error("Update address error:", error);
    return res.status(500).json({ success: false, message: "Server error updating address" });
  }
};

/**
 * DELETE /api/user/addresses/:addressId
 */
const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const address = user.addresses.id(addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found" });
    }

    const wasDefault = address.isDefault;
    
    // Mongoose pull/remove helper
    user.addresses.pull(addressId);

    // If deleted address was default, set the first remaining address as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully",
      data: user.addresses,
    });
  } catch (error) {
    console.error("Delete address error:", error);
    return res.status(500).json({ success: false, message: "Server error deleting address" });
  }
};

/**
 * PATCH /api/user/notifications
 */
const updateNotifications = async (req, res) => {
  try {
    const { orderUpdates, promotionalOffers, newRestaurantAlerts } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (!user.notificationPreferences) {
      user.notificationPreferences = {
        orderUpdates: true,
        promotionalOffers: true,
        newRestaurantAlerts: false,
      };
    }

    if (orderUpdates !== undefined) user.notificationPreferences.orderUpdates = orderUpdates;
    if (promotionalOffers !== undefined) user.notificationPreferences.promotionalOffers = promotionalOffers;
    if (newRestaurantAlerts !== undefined) user.notificationPreferences.newRestaurantAlerts = newRestaurantAlerts;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Notification preferences updated successfully",
      data: user.notificationPreferences,
    });
  } catch (error) {
    console.error("Update notifications error:", error);
    return res.status(500).json({ success: false, message: "Server error updating notifications" });
  }
};

/**
 * DELETE /api/user/account
 */
const deleteAccount = async (req, res) => {
  try {
    const { confirmText } = req.body;

    if (confirmText !== "DELETE") {
      return res.status(400).json({
        success: false,
        message: "Invalid confirmation text. Must type 'DELETE'.",
      });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // SOFT DELETE: Status set to "deleted"
    user.status = "deleted";
    // Anonymize personal details (free up email for future signup)
    const oldEmail = user.email;
    user.email = `deleted_${user._id}@cravingza.local`;
    user.name = "Deleted User";
    user.phone = null;
    user.addresses = []; // Clear addresses for privacy

    await user.save();

    // Clear the JWT token cookie
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Account has been successfully deleted.",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return res.status(500).json({ success: false, message: "Server error deleting account" });
  }
};

module.exports = {
  updateProfile,
  updatePassword,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  updateNotifications,
  deleteAccount,
};
