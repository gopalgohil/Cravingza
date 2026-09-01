import express from "express";
const router = express.Router();
import { protect } from "../middlewares/auth.js";
import { applyAsPartner, getMyApplication, reapplyAsPartner } from "../controllers/partnerController.js";
import { getRestaurants, getRestaurantById, updateMyRestaurantOffer, getMyRestaurant, updateMyRestaurant } from "../controllers/restaurantController.js";
import { getMyMenu, addMenuItem, updateMenuItem, deleteMenuItem } from "../controllers/menuController.js";

// Partner onboarding routes (auth required) - Defined first to avoid /:id routing conflicts
router.post("/apply", protect, applyAsPartner);
router.get("/my-application", protect, getMyApplication);
router.post("/reapply", protect, reapplyAsPartner);

// Restaurant Profile & Menu management routes (owner auth required)
router.get("/my-restaurant", protect, getMyRestaurant);
router.put("/my-restaurant", protect, updateMyRestaurant);
router.get("/my-restaurant/menu", protect, getMyMenu);
router.post("/my-restaurant/menu", protect, addMenuItem);
router.put("/my-restaurant/menu/:id", protect, updateMenuItem);
router.delete("/my-restaurant/menu/:id", protect, deleteMenuItem);
router.put("/my-restaurant/offer", protect, updateMyRestaurantOffer);

// Public routes
router.get("/", getRestaurants);
router.get("/:id", getRestaurantById);

export default router;
