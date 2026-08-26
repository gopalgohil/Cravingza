import Cart from "../models/Cart.js";
import MenuItem from "../models/MenuItem.js";
import Restaurant from "../models/Restaurant.js";
import mongoose from "mongoose";

const RESTAURANT_PUBLIC_FIELDS =
  "name image rating reviewCount deliveryTime deliveryFee minOrderAmount isOpen location.address location.city offerDiscountPercentage offerMaxDiscount offerMinOrderAmount offerLabel";
const MENUITEM_PUBLIC_FIELDS = "name price image isVeg description category";

const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate("restaurant", RESTAURANT_PUBLIC_FIELDS)
      .populate("items.menuItem", MENUITEM_PUBLIC_FIELDS);

    if (!cart) {
      return res.status(200).json({
        success: true,
        data: {
          items: [],
          restaurant: null,
          subtotal: 0,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: cart._id,
        restaurant: cart.restaurant,
        items: cart.items,
        subtotal: cart.subtotal,
      },
    });
  } catch (error) {
    next(error);
  }
};

const addToCart = async (req, res, next) => {
  try {
    const { menuItemId, quantity = 1 } = req.body;

    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Single-restaurant rule check
    if (cart.restaurant && cart.restaurant.toString() !== menuItem.restaurant.toString()) {
      const currentRestaurant = await Restaurant.findById(cart.restaurant).select("name image");
      return res.status(409).json({
        success: false,
        conflict: true,
        currentRestaurant: currentRestaurant || { name: "Another Restaurant" },
        message: "Your cart already contains items from another restaurant.",
      });
    }

    // Set restaurant reference if empty
    if (!cart.restaurant) {
      cart.restaurant = menuItem.restaurant;
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.menuItem.toString() === menuItemId
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += Number(quantity);
    } else {
      cart.items.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: Number(quantity),
        isVeg: menuItem.isVeg,
      });
    }

    await cart.save();
    await cart.populate("restaurant", RESTAURANT_PUBLIC_FIELDS);
    await cart.populate("items.menuItem", MENUITEM_PUBLIC_FIELDS);

    return res.status(200).json({
      success: true,
      message: "Item added to cart",
      data: {
        id: cart._id,
        restaurant: cart.restaurant,
        items: cart.items,
        subtotal: cart.subtotal,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateCartItem = async (req, res, next) => {
  try {
    const { menuItemId, quantity } = req.body;

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.menuItem.toString() === menuItemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart",
      });
    }

    const newQty = Number(quantity);
    if (newQty <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = newQty;
    }

    if (cart.items.length === 0) {
      cart.restaurant = null;
    }

    await cart.save();
    await cart.populate("restaurant", RESTAURANT_PUBLIC_FIELDS);
    await cart.populate("items.menuItem", MENUITEM_PUBLIC_FIELDS);

    return res.status(200).json({
      success: true,
      message: "Cart updated",
      data: {
        id: cart._id,
        restaurant: cart.restaurant,
        items: cart.items,
        subtotal: cart.subtotal,
      },
    });
  } catch (error) {
    next(error);
  }
};

const removeCartItem = async (req, res, next) => {
  try {
    const { menuItemId } = req.params;

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.menuItem.toString() === menuItemId
    );

    if (itemIndex > -1) {
      cart.items.splice(itemIndex, 1);
    }

    if (cart.items.length === 0) {
      cart.restaurant = null;
    }

    await cart.save();
    await cart.populate("restaurant", RESTAURANT_PUBLIC_FIELDS);
    await cart.populate("items.menuItem", MENUITEM_PUBLIC_FIELDS);

    return res.status(200).json({
      success: true,
      message: "Item removed from cart",
      data: {
        id: cart._id,
        restaurant: cart.restaurant,
        items: cart.items,
        subtotal: cart.subtotal,
      },
    });
  } catch (error) {
    next(error);
  }
};

const clearCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id });
    if (cart) {
      cart.items = [];
      cart.restaurant = null;
      await cart.save();
    }

    return res.status(200).json({
      success: true,
      message: "Cart cleared",
      data: {
        items: [],
        restaurant: null,
        subtotal: 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

const replaceCart = async (req, res, next) => {
  try {
    const { menuItemId, quantity = 1 } = req.body;

    const menuItem = await MenuItem.findById(menuItemId);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      cart = new Cart({ user: req.user._id });
    }

    // Reset items and set new restaurant
    cart.items = [
      {
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: Number(quantity),
        isVeg: menuItem.isVeg,
      },
    ];
    cart.restaurant = menuItem.restaurant;

    await cart.save();
    await cart.populate("restaurant", RESTAURANT_PUBLIC_FIELDS);
    await cart.populate("items.menuItem", MENUITEM_PUBLIC_FIELDS);

    return res.status(200).json({
      success: true,
      message: "Cart replaced and item added",
      data: {
        id: cart._id,
        restaurant: cart.restaurant,
        items: cart.items,
        subtotal: cart.subtotal,
      },
    });
  } catch (error) {
    next(error);
  }
};

export {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
  replaceCart,
};
