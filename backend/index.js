require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");

// Initialize database connection
connectDB();

const app = express();

// Security Headers
app.use(helmet());

// CORS Configuration
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", require("./routes/restaurantRoutes"));
app.use("/api/restaurant", require("./routes/restaurantSettingsRoutes"));
app.use("/api/delivery", require("./routes/deliveryRoutes"));
app.use("/api/cart", require("./routes/cartRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/reviews", require("./routes/reviewRoutes"));
app.use("/api/user", require("./routes/userRoutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/payment", require("./routes/paymentRoutes"));
app.use("/api/offers", require("./routes/offerRoutes"));

// Serve uploaded documents statically
const path = require("path");
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

// Base route for status check
app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "Cravingza Backend API Server is Live & Running!" });
});
app.get("/api", (req, res) => {
  res.status(200).json({ success: true, message: "Cravingza Backend API Server is Live & Running!" });
});
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Backend is healthy" });
});

// Generic Error Handler Middleware
app.use((err, req, res, next) => {
  console.error("Unhandle Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "An internal server error occurred",
    errors: [],
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
