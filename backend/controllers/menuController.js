const MenuItem = require("../models/MenuItem");
const Restaurant = require("../models/Restaurant");
const { z } = require("zod");

// Zod schema for validating menu item input
const menuItemInputSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  description: z.string().optional().default(""),
  price: z.coerce.number().min(0, "Price cannot be negative"),
  category: z.string().min(2, "Category is required").trim(),
  image: z.string().optional().default(""),
  isVeg: z.boolean().optional().default(true),
  isAvailable: z.boolean().optional().default(true),
  isBestSeller: z.boolean().optional().default(false),
});

// GET /api/restaurants/my-restaurant/menu - Get all menu items for the owner's restaurant
const getMyMenu = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found for this partner account.",
      });
    }

    const menuItems = await MenuItem.find({ restaurant: restaurant._id }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: menuItems,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/restaurants/my-restaurant/menu - Add a new menu item
const addMenuItem = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found for this partner account.",
      });
    }

    if (restaurant.adminDeactivated) {
      return res.status(403).json({
        success: false,
        message: "Your restaurant has been deactivated by Cravingza. Contact support.",
      });
    }

    const validation = menuItemInputSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.errors.map((e) => e.message),
      });
    }

    const menuItem = await MenuItem.create({
      restaurant: restaurant._id,
      ...validation.data,
    });

    return res.status(201).json({
      success: true,
      message: "Menu item added successfully",
      data: menuItem,
    });
  } catch (error) {
    next(error);
  }
};

// PUT /api/restaurants/my-restaurant/menu/:id - Update an existing menu item
const updateMenuItem = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found for this partner account.",
      });
    }

    if (restaurant.adminDeactivated) {
      return res.status(403).json({
        success: false,
        message: "Your restaurant has been deactivated by Cravingza. Contact support.",
      });
    }

    const validation = menuItemInputSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validation.error.errors.map((e) => e.message),
      });
    }

    const menuItem = await MenuItem.findOneAndUpdate(
      { _id: req.params.id, restaurant: restaurant._id },
      validation.data,
      { new: true, runValidators: true }
    );

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found or you do not have permission to edit it.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Menu item updated successfully",
      data: menuItem,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/restaurants/my-restaurant/menu/:id - Delete a menu item
const deleteMenuItem = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found for this partner account.",
      });
    }

    if (restaurant.adminDeactivated) {
      return res.status(403).json({
        success: false,
        message: "Your restaurant has been deactivated by Cravingza. Contact support.",
      });
    }

    const menuItem = await MenuItem.findOneAndDelete({
      _id: req.params.id,
      restaurant: restaurant._id,
    });

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found or you do not have permission to delete it.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyMenu,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
};
