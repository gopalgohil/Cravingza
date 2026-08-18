import express from "express";
const router = express.Router();
import { createReview, getReviewByOrder, getMyRestaurantReviews } from "../controllers/reviewController.js";
import { protect } from "../middlewares/auth.js";

// Protect all review routes
router.use(protect);

router.get("/merchant", getMyRestaurantReviews);
router.post("/", createReview);
router.get("/order/:orderId", getReviewByOrder);

export default router;
