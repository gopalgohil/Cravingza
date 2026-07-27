const Review = require("../models/Review");
const Order = require("../models/Order");
const Restaurant = require("../models/Restaurant");

const createReview = async (req, res, next) => {
  try {
    const { orderId, rating, comment } = req.body;

    if (!orderId || !rating) {
      return res.status(400).json({
        success: false,
        message: "Order ID and rating are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // 1. Verify the order exists, belongs to the requesting user, and is delivered
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (order.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to review this order",
      });
    }

    if (order.status !== "delivered") {
      return res.status(400).json({
        success: false,
        message: "You can only review delivered orders",
      });
    }

    // 2. Verify no review already exists for this order
    const existingReview = await Review.findOne({ order: orderId });
    if (existingReview) {
      return res.status(409).json({
        success: false,
        message: "You have already reviewed this order",
      });
    }

    // 3. Create the Review document
    const review = new Review({
      order: orderId,
      customer: req.user._id,
      restaurant: order.restaurant,
      rating,
      comment: comment || "",
    });

    await review.save();

    // 4. Recalculate and update the associated Restaurant's rating and reviewCount
    const reviews = await Review.find({ restaurant: order.restaurant });
    const reviewCount = reviews.length;
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount;

    await Restaurant.findByIdAndUpdate(order.restaurant, {
      rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal place
      reviewCount: reviewCount,
    });

    return res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

const getReviewByOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const review = await Review.findOne({ order: orderId });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "No review found for this order",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

const getMyRestaurantReviews = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found for this partner account.",
      });
    }

    const reviews = await Review.find({ restaurant: restaurant._id })
      .populate("customer", "name email image")
      .populate({
        path: "order",
        select: "items totalAmount status createdAt"
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: reviews,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getReviewByOrder,
  getMyRestaurantReviews,
};
