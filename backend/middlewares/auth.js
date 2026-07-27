const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token || token === "undefined" || token === "null" || token.trim() === "") {
      token = null;
    }

    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      const parts = req.headers.authorization.split(" ");
      if (parts.length === 2 && parts[1] && parts[1] !== "undefined" && parts[1] !== "null" && parts[1].trim() !== "") {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, no token found",
      });
    }

    // Verify token safely
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, invalid or expired token",
      });
    }

    // Get user from database
    const user = await User.findById(decoded.id).select("-password -otpHash -otpExpires");

    if (!user || user.status === "deleted" || user.status === "suspended") {
      return res.status(401).json({
        success: false,
        message: "Not authorized, user account is inactive or deleted",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, invalid or expired token",
    });
  }
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin role required.",
    });
  }
};

module.exports = {
  protect,
  adminOnly,
};
