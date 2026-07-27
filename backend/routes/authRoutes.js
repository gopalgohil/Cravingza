const express = require("express");
const router = express.Router();
const {
  register,
  verifyEmailOTP,
  resendOTP,
  login,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  googleLogin,
} = require("../controllers/authController");
const { protect } = require("../middlewares/auth");
const { rateLimiter } = require("../middlewares/rateLimiter");

// Rate limiters for authentication actions
const loginLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many login attempts from this IP. Please try again after 15 minutes.",
});

const otpLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many OTP requests or verification attempts. Please try again later.",
});

// Authentication Routes
router.post("/register", register);
router.post("/verify-otp", otpLimiter, verifyEmailOTP);
router.post("/resend-otp", otpLimiter, resendOTP);
router.post("/login", loginLimiter, login);
router.post("/google", googleLogin);
router.post("/logout", logout);
router.get("/profile", protect, getProfile);
router.post("/forgot-password", otpLimiter, forgotPassword);
router.post("/reset-password", otpLimiter, resetPassword);

module.exports = router;
