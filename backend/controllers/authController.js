const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const admin = require("../config/firebase");
const {
  registerSchema,
  loginSchema,
  verifyOTPSchema,
  resendOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require("../validators/authValidator");
const { generateOTP, hashOTP, verifyOTP } = require("../utils/otp");
const { sendOTPEmail, sendPasswordResetEmail } = require("../services/emailService");

// Helper to format Zod validation errors
const formatZodErrors = (zodError) => {
  return zodError.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
};

/**
 * Register a new user
 */
const register = async (req, res) => {
  try {
    // Validate request body
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formatZodErrors(validation.error),
      });
    }

    const { name, email, phone, password } = validation.data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email is already registered",
        errors: [{ field: "email", message: "Email is already registered" }],
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate OTP details
    const rawOtp = generateOTP();
    const hashedOtp = hashOTP(rawOtp);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Create user (unverified by default)
    const newUser = await User.create({
      name,
      email,
      phone,
      password: hashedPassword,
      isVerified: false,
      otpHash: hashedOtp,
      otpExpires: otpExpiry,
      otpResendAttempts: 0,
      otpLastSent: new Date(),
    });

    // Send OTP Email
    const emailRes = await sendOTPEmail(email, name, rawOtp);
    if (!emailRes.success) {
      console.error("Failed to send OTP verification email:", emailRes.error);
    }

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please verify your email.",
      data: {
        email: newUser.email,
        name: newUser.name,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred during registration",
      errors: [],
    });
  }
};

/**
 * Verify OTP code
 */
const verifyEmailOTP = async (req, res) => {
  try {
    const validation = verifyOTPSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formatZodErrors(validation.error),
      });
    }

    const { email, otp } = validation.data;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
        errors: [{ field: "email", message: "User not found" }],
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
        errors: [],
      });
    }

    // Check expiry
    if (!user.otpExpires || new Date() > user.otpExpires) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
        errors: [{ field: "otp", message: "OTP has expired" }],
      });
    }

    // Verify OTP code
    const isValid = verifyOTP(otp, user.otpHash);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP verification code",
        errors: [{ field: "otp", message: "Invalid OTP code" }],
      });
    }

    // Update user verification status
    user.isVerified = true;
    user.otpHash = null;
    user.otpExpires = null;
    user.otpResendAttempts = 0;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Account verified successfully. You can now login.",
      data: {},
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred during verification",
      errors: [],
    });
  }
};

/**
 * Resend OTP code
 */
const resendOTP = async (req, res) => {
  try {
    const validation = resendOTPSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formatZodErrors(validation.error),
      });
    }

    const { email } = validation.data;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
        errors: [{ field: "email", message: "User not found" }],
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
        errors: [],
      });
    }

    // Allow resend only after 60 seconds
    const now = new Date();
    if (user.otpLastSent) {
      const timePassed = now.getTime() - new Date(user.otpLastSent).getTime();
      if (timePassed < 60000) {
        const waitTime = Math.ceil((60000 - timePassed) / 1000);
        return res.status(400).json({
          success: false,
          message: `Please wait ${waitTime} seconds before requesting a new OTP.`,
          errors: [],
        });
      }
    }

    // Limit maximum resend attempts (max 5)
    if (user.otpResendAttempts >= 5) {
      // If OTP expired, let's reset attempts
      if (user.otpExpires && now > user.otpExpires) {
        user.otpResendAttempts = 0;
      } else {
        return res.status(400).json({
          success: false,
          message: "Maximum OTP resend attempts reached. Please try again in 5 minutes.",
          errors: [],
        });
      }
    }

    // Generate new OTP
    const rawOtp = generateOTP();
    const hashedOtp = hashOTP(rawOtp);
    const otpExpiry = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save user update
    user.otpHash = hashedOtp;
    user.otpExpires = otpExpiry;
    user.otpResendAttempts += 1;
    user.otpLastSent = now;
    await user.save();

    // Send email
    const emailRes = await sendOTPEmail(email, user.name, rawOtp);
    if (!emailRes.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email. Please try again.",
        errors: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "A new OTP verification code has been sent.",
      data: {},
    });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred while resending OTP",
      errors: [],
    });
  }
};

/**
 * Login user
 */
const login = async (req, res) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formatZodErrors(validation.error),
      });
    }

    const { email, password } = validation.data;

    const user = await User.findOne({ email });
    if (!user || user.status === "deleted") {
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password.",
        errors: [],
      });
    }

    if (user.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended. Please contact support.",
        errors: [],
      });
    }

    // Check if user is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(423).json({
        success: false,
        message: "Too many failed attempts. Please wait 5 minutes before trying again.",
        errors: [],
      });
    }

    // Verify password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes lock
        await user.save();
        return res.status(423).json({
          success: false,
          message: "Too many failed attempts. Please wait 5 minutes before trying again.",
          errors: [],
        });
      }
      
      await user.save();
      
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password.",
        errors: [],
      });
    }

    // Check if verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        isVerified: false,
        message: "Please verify your email address first.",
        data: { email: user.email },
      });
    }

    // Reset login attempts on successful login
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred during login",
      errors: [],
    });
  }
};

/**
 * Logout user
 */
const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
      data: {},
    });
  } catch (error) {
    console.error("Logout error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred during logout",
      errors: [],
    });
  }
};

/**
 * Get current authenticated user profile
 */
const getProfile = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      message: "Profile retrieved successfully",
      data: {
        user: req.user,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred retrieving profile",
      errors: [],
    });
  }
};

/**
 * Initiate password reset flow (forgot password)
 */
const forgotPassword = async (req, res) => {
  try {
    const validation = forgotPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formatZodErrors(validation.error),
      });
    }

    const { email } = validation.data;

    const user = await User.findOne({ email });
    if (!user) {
      // To prevent email harvesting, return a friendly success message anyway
      return res.status(200).json({
        success: true,
        message: "If the email is registered, an OTP code has been sent.",
      });
    }

    // Generate OTP
    const rawOtp = generateOTP();
    const hashedOtp = hashOTP(rawOtp);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.resetPasswordOtpHash = hashedOtp;
    user.resetPasswordOtpExpires = otpExpiry;
    await user.save();

    // Send email
    const emailRes = await sendPasswordResetEmail(email, user.name, rawOtp);
    if (!emailRes.success) {
      console.error("Failed to send password reset email:", emailRes.error);
    }

    return res.status(200).json({
      success: true,
      message: "If the email is registered, an OTP code has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      errors: [],
    });
  }
};

/**
 * Reset password using OTP
 */
const resetPassword = async (req, res) => {
  try {
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: formatZodErrors(validation.error),
      });
    }

    const { email, otp, password } = validation.data;

    const user = await User.findOne({ email });
    if (!user || !user.resetPasswordOtpHash || !user.resetPasswordOtpExpires) {
      return res.status(400).json({
        success: false,
        message: "Invalid request or OTP code has expired.",
      });
    }

    // Check expiry
    if (new Date() > user.resetPasswordOtpExpires) {
      return res.status(400).json({
        success: false,
        message: "OTP code has expired. Please request a new one.",
      });
    }

    // Verify OTP
    const isOtpValid = verifyOTP(otp, user.resetPasswordOtpHash);
    if (!isOtpValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP code.",
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Save changes
    user.password = hashedPassword;
    user.resetPasswordOtpHash = null;
    user.resetPasswordOtpExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now login.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred",
      errors: [],
    });
  }
};

/**
 * Login or Register user with Google Firebase ID Token
 */
const googleLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: "Firebase ID token is required.",
        errors: [],
      });
    }

    // Verify ID Token with Firebase Admin SDK
    let decodedToken;
    try {
      if (!admin.apps || !admin.apps.length) {
        const missing = [];
        if (!process.env.FIREBASE_PROJECT_ID) missing.push("FIREBASE_PROJECT_ID");
        if (!process.env.FIREBASE_CLIENT_EMAIL) missing.push("FIREBASE_CLIENT_EMAIL");
        if (!process.env.FIREBASE_PRIVATE_KEY) missing.push("FIREBASE_PRIVATE_KEY");
        throw new Error(`Firebase Admin SDK is not configured on the server. Missing on Render: ${missing.length ? missing.join(", ") : "Invalid private key format"}`);
      }
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (verifyError) {
      console.error("Firebase token verification failed:", verifyError);
      return res.status(401).json({
        success: false,
        message: verifyError.message || "Invalid Firebase ID token.",
        errors: [],
      });
    }

    const { name, email, picture } = decodedToken;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is not associated with this Google account.",
        errors: [],
      });
    }

    // Find user in MongoDB
    let user = await User.findOne({ email });

    if (user && user.status === "deleted") {
      return res.status(401).json({
        success: false,
        message: "Incorrect email or password.",
        errors: [],
      });
    }

    if (user && user.status === "suspended") {
      return res.status(403).json({
        success: false,
        message: "Your account has been suspended. Please contact support.",
        errors: [],
      });
    }

    if (!user) {
      // Create new user (automatically verified)
      // Since password is required, generate a secure random hashed password
      const randomPassword = Math.random().toString(36) + Math.random().toString(36);
      const hashedPassword = await bcrypt.hash(randomPassword, 12);

      user = await User.create({
        name: name || email.split("@")[0],
        email: email,
        avatar: picture || null,
        role: "customer",
        isVerified: true,
        password: hashedPassword,
      });
    } else {
      // If user exists but is not verified, set isVerified to true (since they logged in successfully with Google)
      if (!user.isVerified) {
        user.isVerified = true;
      }
      // Update avatar if not already present
      if (picture && !user.avatar) {
        user.avatar = picture;
      }
      await user.save();
    }

    // Reset login attempts
    user.loginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    console.error("Google authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred during Google authentication.",
      errors: [],
    });
  }
};

module.exports = {
  register,
  verifyEmailOTP,
  resendOTP,
  login,
  logout,
  getProfile,
  forgotPassword,
  resetPassword,
  googleLogin,
};
