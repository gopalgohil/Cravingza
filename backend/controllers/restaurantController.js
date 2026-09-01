import Restaurant from "../models/Restaurant.js";
import MenuItem from "../models/MenuItem.js";

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const PUBLIC_RESTAURANT_LIST_FIELDS =
  "name description cuisineTags image location rating reviewCount deliveryTime deliveryFee minOrderAmount offerDiscountPercentage offerMaxDiscount offerMinOrderAmount offerLabel isOpen";

const PUBLIC_RESTAURANT_DETAIL_FIELDS =
  "name description cuisineTags image location rating reviewCount deliveryTime deliveryFee minOrderAmount offerDiscountPercentage offerMaxDiscount offerMinOrderAmount offerLabel isOpen";

const getRestaurants = async (req, res, next) => {
  try {
    const { cuisine, search, sort } = req.query;
    let query = {
      approvalStatus: "approved",
      adminDeactivated: { $ne: true },
      ownerClosedPermanently: { $ne: true },
    };

    if (cuisine) {
      const escapedCuisine = escapeRegExp(cuisine);
      query.cuisineTags = { $in: [new RegExp(escapedCuisine, "i")] };
    }

    if (search) {
      const escapedSearch = escapeRegExp(search.trim());
      query.$or = [
        { name: new RegExp(escapedSearch, "i") },
        { description: new RegExp(escapedSearch, "i") },
        { cuisineTags: { $in: [new RegExp(escapedSearch, "i")] } }
      ];
    }

    let sortOption = {};
    if (sort === "rating") {
      sortOption = { isOpen: -1, rating: -1 };
    } else if (sort === "deliveryTime") {
      sortOption = { isOpen: -1, deliveryTime: 1 };
    } else if (sort === "deliveryFee") {
      sortOption = { isOpen: -1, deliveryFee: 1 };
    } else {
      sortOption = { isOpen: -1, createdAt: -1 };
    }

    const restaurants = await Restaurant.find(query)
      .select(PUBLIC_RESTAURANT_LIST_FIELDS)
      .sort(sortOption);

    return res.status(200).json({
      success: true,
      data: restaurants,
    });
  } catch (error) {
    next(error);
  }
};

const getRestaurantById = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({
      _id: req.params.id,
      approvalStatus: "approved",
      adminDeactivated: { $ne: true },
      ownerClosedPermanently: { $ne: true },
    }).select(PUBLIC_RESTAURANT_DETAIL_FIELDS);

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const menuItems = await MenuItem.find({ restaurant: restaurant._id, isAvailable: true });

    return res.status(200).json({
      success: true,
      data: {
        restaurant,
        menu: menuItems,
      },
    });
  } catch (error) {
    next(error);
  }
};

const updateMyRestaurantOffer = async (req, res, next) => {
  try {
    const { offerDiscountPercentage, offerMaxDiscount, offerMinOrderAmount, offerLabel } = req.body;
    let restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({ success: false, message: "Restaurant profile not found" });
    }

    if (offerDiscountPercentage !== undefined) restaurant.offerDiscountPercentage = Number(offerDiscountPercentage);
    if (offerMaxDiscount !== undefined) restaurant.offerMaxDiscount = Number(offerMaxDiscount);
    if (offerMinOrderAmount !== undefined) restaurant.offerMinOrderAmount = Number(offerMinOrderAmount);
    if (offerLabel !== undefined) {
      restaurant.offerLabel = offerLabel;
    } else if (offerDiscountPercentage !== undefined) {
      restaurant.offerLabel = `${offerDiscountPercentage}% OFF UPTO ₹${restaurant.offerMaxDiscount || 150}`;
    }

    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: "Restaurant offer updated successfully",
      data: restaurant,
    });
  } catch (error) {
    next(error);
  }
};

const getMyRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant profile not found for this account.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        restaurant,
        restaurantName: restaurant.name,
      },
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};

const updateMyRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant profile not found for this account.",
      });
    }

    const { name, cuisine, phone, email, address, city, pincode, zipCode, openingTime, closingTime, isOpen } = req.body;

    if (name !== undefined) restaurant.name = name;
    if (phone !== undefined) restaurant.phone = phone;
    if (email !== undefined) restaurant.email = email;
    if (openingTime !== undefined) restaurant.openingTime = openingTime;
    if (closingTime !== undefined) restaurant.closingTime = closingTime;
    if (isOpen !== undefined) restaurant.isOpen = Boolean(isOpen);
    if (cuisine !== undefined) {
      if (Array.isArray(cuisine)) {
        restaurant.cuisineTags = cuisine;
      } else if (typeof cuisine === "string") {
        restaurant.cuisineTags = cuisine.split(",").map((c) => c.trim()).filter(Boolean);
      }
    }
    if (address !== undefined || city !== undefined) {
      if (!restaurant.location) restaurant.location = { address: "", city: "", lat: 0, lng: 0 };
      if (address !== undefined) restaurant.location.address = address;
      if (city !== undefined) restaurant.location.city = city;
    }
    if (pincode !== undefined || zipCode !== undefined) {
      restaurant.pincode = pincode || zipCode;
    }

    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: "Restaurant updated successfully",
      data: restaurant,
      restaurant,
    });
  } catch (error) {
    next(error);
  }
};

export {
  getRestaurants,
  getRestaurantById,
  updateMyRestaurantOffer,
  getMyRestaurant,
  updateMyRestaurant,
};
