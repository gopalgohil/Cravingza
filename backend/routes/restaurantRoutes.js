const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth");
const { applyAsPartner, getMyApplication, reapplyAsPartner } = require("../controllers/partnerController");
const { getRestaurants, getRestaurantById } = require("../controllers/restaurantController");
const { getMyMenu, addMenuItem, updateMenuItem, deleteMenuItem } = require("../controllers/menuController");

// Partner onboarding routes (auth required) - Defined first to avoid /:id routing conflicts
router.post("/apply", protect, applyAsPartner);
router.get("/my-application", protect, getMyApplication);
router.post("/reapply", protect, reapplyAsPartner);

// Menu management routes (owner auth required)
router.get("/my-restaurant/menu", protect, getMyMenu);
router.post("/my-restaurant/menu", protect, addMenuItem);
router.put("/my-restaurant/menu/:id", protect, updateMenuItem);
router.delete("/my-restaurant/menu/:id", protect, deleteMenuItem);

// Public routes
router.get("/", getRestaurants);
router.get("/:id", getRestaurantById);

module.exports = router;
