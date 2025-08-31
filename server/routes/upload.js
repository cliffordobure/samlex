import express from "express";
import { uploadSingle, handleUploadError } from "../middleware/upload.js";
import { protect } from "../middleware/auth.js";
import { uploadToCloud } from "../utils/cloudinary.js";

const router = express.Router();

// GET /api/upload/test - simple test endpoint
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Upload route is accessible",
    timestamp: new Date().toISOString(),
  });
});

// POST /api/upload - single file upload (field name: 'file')
router.post(
  "/",
  protect,
  uploadSingle("file"),
  handleUploadError,
  async (req, res) => {
    try {
      console.log("=== DEBUG: Upload request received ===");
      console.log("User:", req.user?._id);
      console.log("User Role:", req.user?.role);
      console.log("File:", req.file);
      console.log("Headers:", req.headers);
      console.log(
        "Authorization Header:",
        req.headers.authorization ? "Present" : "Missing"
      );

      if (!req.file) {
        console.log("No file uploaded");
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded" });
      }

      console.log("Uploading file to Cloudinary...");
      console.log("File buffer size:", req.file.buffer.length);
      console.log("File mimetype:", req.file.mimetype);
      console.log("File originalname:", req.file.originalname);

      // Upload file to Cloudinary
      const uploadResult = await uploadToCloud(req.file.buffer, "documents");

      console.log("File uploaded successfully to Cloudinary");
      console.log("Cloudinary URL:", uploadResult.secure_url);
      console.log("Cloudinary public_id:", uploadResult.public_id);

      // Return Cloudinary URL and public_id
      res.json({
        success: true,
        url: uploadResult.secure_url, // Cloudinary URL
        public_id: uploadResult.public_id, // Cloudinary public_id
        resource_type: uploadResult.resource_type,
        originalName: req.file.originalname,
        size: uploadResult.bytes,
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({
        success: false,
        message: "Upload failed",
        error: error.message,
      });
    }
  }
);

// GET /api/upload/health - health check for upload service
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Upload service is running",
    timestamp: new Date().toISOString(),
  });
});

export default router;
