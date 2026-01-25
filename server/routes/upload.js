import express from "express";
import { uploadSingle, handleUploadError } from "../middleware/upload.js";
import { protect } from "../middleware/auth.js";
import { uploadToStorage } from "../utils/storage.js";
import config from "../config/config.js";

const router = express.Router();

// CORS middleware specifically for upload routes
const uploadCors = (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://samlex-client.vercel.app',
    'https://lawfirm-saas-client.vercel.app',
    'http://localhost:5001',
    'http://localhost:5002'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
};

// Apply CORS middleware to all upload routes
router.use(uploadCors);

// Handle preflight OPTIONS requests for upload (no auth required)
router.options("/", (req, res) => {
  console.log('🔄 Handling OPTIONS preflight request for upload');
  console.log('🔄 Request origin:', req.headers.origin);
  console.log('🔄 Request headers:', req.headers);
  
  // Set CORS headers explicitly
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || 'https://samlex-client.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  console.log('🔄 CORS headers set:', {
    'Access-Control-Allow-Origin': res.getHeader('Access-Control-Allow-Origin'),
    'Access-Control-Allow-Methods': res.getHeader('Access-Control-Allow-Methods'),
    'Access-Control-Allow-Headers': res.getHeader('Access-Control-Allow-Headers')
  });
  
  res.status(200).end();
});

// GET /api/upload/test - simple test endpoint
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Upload route is accessible",
    timestamp: new Date().toISOString(),
    corsHeaders: {
      origin: req.headers.origin,
      'access-control-allow-origin': res.getHeader('Access-Control-Allow-Origin')
    }
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

      // Determine storage provider
      const storageProvider = config.STORAGE_PROVIDER || "s3";
      
      // Check if storage is configured
      let storageConfigured = false;
      if (storageProvider === "s3") {
        storageConfigured = !!(config.AWS_S3_BUCKET_NAME && 
                               config.AWS_ACCESS_KEY_ID && 
                               config.AWS_SECRET_ACCESS_KEY);
      } else {
        storageConfigured = !!(config.CLOUDINARY_CLOUD_NAME && 
                               config.CLOUDINARY_API_KEY && 
                               config.CLOUDINARY_API_SECRET);
      }
      
      if (!storageConfigured) {
        console.error(`❌ ${storageProvider.toUpperCase()} not configured`);
        return res.status(500).json({
          success: false,
          message: "File upload service not configured. Please contact administrator.",
          error: `${storageProvider} credentials missing`
        });
      }

      console.log(`Uploading file to ${storageProvider.toUpperCase()}...`);
      console.log("File buffer size:", req.file.buffer.length);
      console.log("File mimetype:", req.file.mimetype);
      console.log("File originalname:", req.file.originalname);

      // Upload file to storage (S3 or Cloudinary)
      const uploadResult = await uploadToStorage(
        req.file.buffer,
        "documents",
        req.file.originalname,
        req.file.mimetype
      );

      console.log(`File uploaded successfully to ${storageProvider.toUpperCase()}`);
      console.log("File URL:", uploadResult.url || uploadResult.secure_url);
      console.log("File Key/Public ID:", uploadResult.key || uploadResult.public_id);

      // Set CORS headers for successful upload
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      
      // Return upload result (compatible with both S3 and Cloudinary)
      res.json({
        success: true,
        url: uploadResult.url || uploadResult.secure_url,
        public_id: uploadResult.key || uploadResult.public_id, // S3 key or Cloudinary public_id
        resource_type: uploadResult.resource_type || req.file.mimetype,
        originalName: req.file.originalname,
        size: uploadResult.bytes || uploadResult.size || req.file.size,
      });
    } catch (error) {
      console.error("Upload error:", error);
      
      // Provide more specific error messages
      let errorMessage = "Upload failed";
      if (error.message.includes("Unknown API key")) {
        errorMessage = "File upload service not configured. Please contact administrator.";
      } else if (error.message.includes("Invalid cloud name")) {
        errorMessage = "File upload service configuration error. Please contact administrator.";
      } else if (error.message.includes("Failed to upload file to Cloudinary")) {
        errorMessage = "File upload service temporarily unavailable. Please try again later.";
      }
      
      // Set CORS headers for error response
      res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
      res.header('Access-Control-Allow-Credentials', 'true');
      
      res.status(500).json({
        success: false,
        message: errorMessage,
        error: error.message,
      });
    }
  }
);

// GET /api/upload/health - health check for upload service
router.get("/health", (req, res) => {
  const storageProvider = config.STORAGE_PROVIDER || "s3";
  
  let storageConfigured = false;
  let storageInfo = {};
  
  if (storageProvider === "s3") {
    storageConfigured = !!(config.AWS_S3_BUCKET_NAME && 
                           config.AWS_ACCESS_KEY_ID && 
                           config.AWS_SECRET_ACCESS_KEY);
    storageInfo = {
      provider: "AWS S3",
      bucket: config.AWS_S3_BUCKET_NAME || "Not configured",
      region: config.AWS_REGION || "Not configured",
    };
  } else {
    storageConfigured = !!(config.CLOUDINARY_CLOUD_NAME && 
                           config.CLOUDINARY_API_KEY && 
                           config.CLOUDINARY_API_SECRET);
    storageInfo = {
      provider: "Cloudinary",
      cloudName: config.CLOUDINARY_CLOUD_NAME || "Not configured",
    };
  }
  
  res.json({
    success: true,
    message: "Upload service is running",
    storageProvider: storageProvider,
    storageConfigured: storageConfigured,
    storageInfo: storageInfo,
    timestamp: new Date().toISOString(),
    ...(storageConfigured ? {} : { 
      warning: `${storageProvider} not configured - file uploads will fail` 
    })
  });
});

export default router;
