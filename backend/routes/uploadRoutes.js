import express from "express";
import multer from "multer";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { protect } from "../middlewares/auth.js";

const router = express.Router();

// Store files in memory for Cloudinary upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, WEBP images and PDFs are allowed"));
    }
  },
});

// POST /api/upload
router.post("/", protect, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const folder = req.body.folder || "cravingza/restaurant-docs";
    const url = await uploadToCloudinary(req.file.buffer, folder);

    return res.status(200).json({ success: true, url });
  } catch (error) {
    next(error);
  }
});

export default router;
