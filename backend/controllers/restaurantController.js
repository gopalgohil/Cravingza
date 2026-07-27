const Restaurant = require("../models/Restaurant");
const MenuItem = require("../models/MenuItem");

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const getRestaurants = async (req, res, next) => {
  try {
    const { cuisine, search, sort } = req.query;
    let query = {
      approvalStatus: "approved",
      isOpen: true,
      adminDeactivated: { $ne: true },
      ownerClosedPermanently: { $ne: true },
    };

    if (cuisine) {
      const escapedCuisine = escapeRegExp(cuisine);
      query.cuisineTags = { $in: [new RegExp(escapedCuisine, "i")] };
    }

    if (search) {
      const escapedSearch = escapeRegExp(search);
      query.$or = [
        { name: new RegExp(escapedSearch, "i") },
        { description: new RegExp(escapedSearch, "i") }
      ];
    }

    let sortOption = {};
    if (sort === "rating") {
      sortOption = { rating: -1 };
    } else if (sort === "deliveryTime") {
      sortOption = { deliveryTime: 1 };
    } else if (sort === "deliveryFee") {
      sortOption = { deliveryFee: 1 };
    } else {
      sortOption = { createdAt: -1 };
    }

    const restaurants = await Restaurant.find(query).sort(sortOption);

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
    const restaurant = await Restaurant.findById(req.params.id);
    if (
      !restaurant ||
      restaurant.approvalStatus !== "approved" ||
      !restaurant.isOpen ||
      restaurant.adminDeactivated ||
      restaurant.ownerClosedPermanently
    ) {
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

module.exports = {
  getRestaurants,
  getRestaurantById,
};
