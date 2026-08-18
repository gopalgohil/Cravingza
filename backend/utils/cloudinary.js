import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload a file buffer to Cloudinary or fallback to local storage if Cloudinary is not configured.
 * @param {Buffer} buffer - File buffer
 * @param {string} folder - Target folder in Cloudinary
 * @param {string} resourceType - "image" | "raw" | "auto"
 * @returns {Promise<string>} secure_url or local URL
 */
const uploadToCloudinary = (buffer, folder = "cravingza/restaurant-docs", resourceType = "auto") => {
  const isCloudinaryConfigured = 
    process.env.CLOUDINARY_CLOUD_NAME && 
    process.env.CLOUDINARY_CLOUD_NAME !== "your_cloud_name" &&
    process.env.CLOUDINARY_API_KEY && 
    process.env.CLOUDINARY_API_KEY !== "your_api_key";

  if (!isCloudinaryConfigured) {
    console.log("Cloudinary is not configured. Falling back to local server file system upload...");
    return new Promise((resolve, reject) => {
      try {
        const uploadDir = path.join(__dirname, "../public/uploads");
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        let ext = ".bin";
        if (buffer.length > 4) {
          const hex = buffer.toString("hex", 0, 4);
          if (hex === "25504446") ext = ".pdf";
          else if (hex === "89504e47") ext = ".png";
          else if (hex.startsWith("ffd8")) ext = ".jpg";
          else if (hex.startsWith("474946")) ext = ".gif";
          else if (buffer.toString("utf8", 0, 4) === "RIFF") ext = ".webp";
        }
        
        const filename = `upload_${Date.now()}_${Math.round(Math.random() * 1e9)}${ext}`;
        const filePath = path.join(uploadDir, filename);
        
        fs.writeFileSync(filePath, buffer);
        const localUrl = `http://localhost:5000/uploads/${filename}`;
        console.log(`Local file saved at: ${filePath}. URL: ${localUrl}`);
        resolve(localUrl);
      } catch (err) {
        reject(err);
      }
    });
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
};

export { uploadToCloudinary };
