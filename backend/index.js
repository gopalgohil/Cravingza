import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";
import { verifyTransporter } from "./services/emailService.js";
import authRoutes from "./routes/authRoutes.js";
import restaurantRoutes from "./routes/restaurantRoutes.js";
import restaurantSettingsRoutes from "./routes/restaurantSettingsRoutes.js";
import deliveryRoutes from "./routes/deliveryRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import offerRoutes from "./routes/offerRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import { getPublicSettings } from "./controllers/adminController.js";
import setupSwagger from "./config/swagger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database connection
connectDB();

// Verify Brevo API config on startup — catches missing env vars immediately in logs
verifyTransporter();

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
app.use("/api/restaurants", restaurantRoutes);
app.use("/api/restaurant", restaurantSettingsRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/user", userRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/offers", offerRoutes);
app.use("/api/coupons", couponRoutes);
app.get("/api/settings", getPublicSettings);

// Swagger API Documentation
setupSwagger(app);

// Serve uploaded documents statically
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

import http from "http";
import { initSocket } from "./services/socketService.js";

const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);

// Initialize Socket.io server
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running with WebSockets enabled in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
