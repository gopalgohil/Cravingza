const express = require("express");
const router = express.Router();
const { createReview, getReviewByOrder, getMyRestaurantReviews } = require("../controllers/reviewController");
const { protect } = require("../middlewares/auth");

// Protect all review routes
router.use(protect);

router.get("/merchant", getMyRestaurantReviews);
router.post("/", createReview);
router.get("/order/:orderId", getReviewByOrder);

module.exports = router;
