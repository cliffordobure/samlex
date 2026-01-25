/**
 * Unified Storage Utility
 * Supports both AWS S3 and Cloudinary
 * Automatically selects provider based on STORAGE_PROVIDER env variable
 */

import config from "../config/config.js";
import { uploadToS3, deleteFromS3, getKeyFromUrl } from "./s3.js";
import { 
  uploadToCloud as uploadToCloudinary, 
  deleteFromCloud as deleteFromCloudinary, 
  getPublicIdFromUrl as getPublicIdFromCloudinaryUrl 
} from "./cloudinary.js";

const STORAGE_PROVIDER = config.STORAGE_PROVIDER || "s3";

/**
 * Upload file to storage (S3 or Cloudinary)
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {string} folder - Folder name (e.g., "documents", "profiles", "logos")
 * @param {string} originalName - Original filename
 * @param {string} mimetype - File MIME type
 * @returns {Promise<Object>} Upload result with URL and key/public_id
 */
export const uploadToStorage = async (fileBuffer, folder = "general", originalName, mimetype) => {
  if (STORAGE_PROVIDER === "s3") {
    const result = await uploadToS3(fileBuffer, folder, originalName, mimetype);
    return {
      secure_url: result.url, // For compatibility with Cloudinary format
      url: result.url,
      public_id: result.key, // S3 key
      key: result.key,
      bytes: result.size,
      resource_type: mimetype,
    };
  } else {
    // Cloudinary
    const result = await uploadToCloudinary(fileBuffer, folder);
    return {
      secure_url: result.secure_url,
      url: result.secure_url,
      public_id: result.public_id,
      key: result.public_id, // For compatibility with S3 format
      bytes: result.bytes,
      resource_type: result.resource_type,
    };
  }
};

/**
 * Delete file from storage (S3 or Cloudinary)
 * @param {string} identifier - S3 key or Cloudinary public_id, or URL
 * @returns {Promise<Object>} Delete result
 */
export const deleteFromStorage = async (identifier) => {
  if (STORAGE_PROVIDER === "s3") {
    // If it's a URL, extract the key
    const key = identifier.startsWith("http") ? getKeyFromUrl(identifier) : identifier;
    if (!key) {
      throw new Error("Invalid S3 key or URL");
    }
    return await deleteFromS3(key);
  } else {
    // Cloudinary - if it's a URL, extract public_id
    const publicId = identifier.startsWith("http") ? getPublicIdFromCloudinaryUrl(identifier) : identifier;
    if (!publicId) {
      throw new Error("Invalid Cloudinary public_id or URL");
    }
    return await deleteFromCloudinary(publicId);
  }
};

import config from "../config/config.js";
import { uploadToS3, deleteFromS3, getKeyFromUrl, getSignedUrlForFile } from "./s3.js";
import { 
  uploadToCloud as uploadToCloudinary, 
  deleteFromCloud as deleteFromCloudinary, 
  getPublicIdFromUrl as getPublicIdFromCloudinaryUrl 
} from "./cloudinary.js";

const STORAGE_PROVIDER = config.STORAGE_PROVIDER || "s3";

/**
 * Upload file to storage (S3 or Cloudinary)
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {string} folder - Folder name (e.g., "documents", "profiles", "logos")
 * @param {string} originalName - Original filename
 * @param {string} mimetype - File MIME type
 * @returns {Promise<Object>} Upload result with URL and key/public_id
 */
export const uploadToStorage = async (fileBuffer, folder = "general", originalName, mimetype) => {
  if (STORAGE_PROVIDER === "s3") {
    const result = await uploadToS3(fileBuffer, folder, originalName, mimetype);
    return {
      secure_url: result.url, // For compatibility with Cloudinary format
      url: result.url,
      public_id: result.key, // S3 key
      key: result.key,
      bytes: result.size,
      resource_type: mimetype,
    };
  } else {
    // Cloudinary
    const result = await uploadToCloudinary(fileBuffer, folder);
    return {
      secure_url: result.secure_url,
      url: result.secure_url,
      public_id: result.public_id,
      key: result.public_id, // For compatibility with S3 format
      bytes: result.bytes,
      resource_type: result.resource_type,
    };
  }
};

/**
 * Delete file from storage (S3 or Cloudinary)
 * @param {string} identifier - S3 key or Cloudinary public_id, or URL
 * @returns {Promise<Object>} Delete result
 */
export const deleteFromStorage = async (identifier) => {
  if (STORAGE_PROVIDER === "s3") {
    // If it's a URL, extract the key
    const key = identifier.startsWith("http") ? getKeyFromUrl(identifier) : identifier;
    if (!key) {
      throw new Error("Invalid S3 key or URL");
    }
    return await deleteFromS3(key);
  } else {
    // Cloudinary - if it's a URL, extract public_id
    const publicId = identifier.startsWith("http") ? getPublicIdFromCloudinaryUrl(identifier) : identifier;
    if (!publicId) {
      throw new Error("Invalid Cloudinary public_id or URL");
    }
    return await deleteFromCloudinary(publicId);
  }
};

/**
 * Get accessible URL for a file (signed URL for S3, direct URL for Cloudinary)
 * @param {string} urlOrKey - File URL or storage key
 * @param {number} expiresIn - Expiration time in seconds (for S3 signed URLs, default: 1 hour)
 * @returns {Promise<string>} Accessible URL
 */
export const getAccessibleUrl = async (urlOrKey, expiresIn = 3600) => {
  if (STORAGE_PROVIDER === "s3") {
    // Extract key from URL if needed
    const key = urlOrKey.startsWith("http") ? getKeyFromUrl(urlOrKey) : urlOrKey;
    if (!key) {
      throw new Error("Invalid S3 key or URL");
    }
    // Generate signed URL for private access
    return await getSignedUrlForFile(key, expiresIn);
  } else {
    // Cloudinary URLs are already accessible
    return urlOrKey;
  }
};

/**
 * Extract storage identifier from URL
 * @param {string} url - Storage URL
 * @returns {string|null} S3 key or Cloudinary public_id
 */
export const getStorageIdentifierFromUrl = (url) => {
  if (STORAGE_PROVIDER === "s3") {
    return getKeyFromUrl(url);
  } else {
    return getPublicIdFromCloudinaryUrl(url);
  }
};

// Backward compatibility exports
export const uploadToCloud = uploadToStorage;
export const deleteFromCloud = deleteFromStorage;
export const getPublicIdFromUrl = getStorageIdentifierFromUrl;

export default {
  uploadToStorage,
  deleteFromStorage,
  getAccessibleUrl,
  getStorageIdentifierFromUrl,
  uploadToCloud, // Alias for backward compatibility
  deleteFromCloud, // Alias for backward compatibility
  getPublicIdFromUrl, // Alias for backward compatibility
};
