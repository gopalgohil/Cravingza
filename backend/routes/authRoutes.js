import express from "express";
const router = express.Router();
import {
  register,
  verifyEmailOTP,
  resendOTP,
  login,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  googleLogin,
} from "../controllers/authController.js";
import { protect } from "../middlewares/auth.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";

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

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User Registration, OTP Verification, Login, and Profile Management
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user account
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 example: SecretPass123!
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *               role:
 *                 type: string
 *                 enum: [customer, restaurant_owner, delivery_partner]
 *                 default: customer
 *     responses:
 *       201:
 *         description: User registered successfully, OTP sent
 *       400:
 *         description: User already exists or invalid data
 */
router.post("/register", register);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify email OTP for registration or password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
router.post("/verify-otp", otpLimiter, verifyEmailOTP);

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: Resend OTP to user email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *     responses:
 *       200:
 *         description: OTP resent successfully
 */
router.post("/resend-otp", otpLimiter, resendOTP);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user with Email and Password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 example: SecretPass123!
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token & user data
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", loginLimiter, login);

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Google OAuth Login / Signup
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Google authentication successful
 */
router.post("/google", googleLogin);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Logout user and clear auth cookies
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post("/logout", logout);

/**
 * @swagger
 * /auth/profile:
 *   get:
 *     summary: Get currently authenticated user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user profile object
 *       401:
 *         description: Unauthorized
 */
router.get("/profile", protect, getProfile);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *     responses:
 *       200:
 *         description: Reset OTP sent to email
 */
router.post("/forgot-password", otpLimiter, forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with OTP
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *               newPassword:
 *                 type: string
 *                 example: NewSecretPass123!
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post("/reset-password", otpLimiter, resetPassword);

export default router;
