// middleware/fileUploadMiddleware.js
import multer from "multer";

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter function for images only (logos, profile images)
const imageFileFilter = (req, file, cb) => {
  // Check file type for images
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// File filter function for documents (legal cases, general uploads)
const documentFileFilter = (req, file, cb) => {
  // Allowed file types for documents
  const allowedMimeTypes = [
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/plain",
    // Additional document types
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Allowed types: Images (JPEG, PNG, GIF), Documents (PDF, DOC, DOCX, XLS, XLSX, TXT, PPT, PPTX)"
      ),
      false
    );
  }
};

// Configure multer for images only
const imageUpload = multer({
  storage: storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Configure multer for documents (includes images and documents)
const documentUpload = multer({
  storage: storage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for documents
  },
});

// Middleware for single file upload - flexible field name (document upload)
export const uploadSingle = (fieldName) => documentUpload.single(fieldName);

// Specific middleware for logo upload (images only)
export const uploadLogo = imageUpload.single("logo");

// Specific middleware for profile image upload (images only)
export const uploadProfileImage = imageUpload.single("profileImage");

// Error handling middleware
export const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message:
          "File size too large. Maximum size is 10MB for documents, 5MB for images",
      });
    }
    return res.status(400).json({
      success: false,
      message: "File upload error",
      error: error.message,
    });
  }

  if (error.message === "Only image files are allowed!") {
    return res.status(400).json({
      success: false,
      message: "Only image files (JPEG, PNG, GIF) are allowed",
    });
  }

  if (error.message.includes("Invalid file type")) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  next(error);
};

export default documentUpload;
