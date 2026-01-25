import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import path from "path";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const FOLDER_PREFIX = process.env.AWS_S3_FOLDER_PREFIX || "law-firm-files";

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File buffer to upload
 * @param {string} folder - Folder name (e.g., "documents", "profiles", "logos")
 * @param {string} originalName - Original filename
 * @param {string} mimetype - File MIME type
 * @returns {Promise<Object>} Upload result with URL and key
 */
export const uploadToS3 = async (fileBuffer, folder = "general", originalName, mimetype) => {
  try {
    if (!BUCKET_NAME) {
      throw new Error("AWS_S3_BUCKET_NAME is not configured");
    }

    // Generate unique filename
    const fileExtension = path.extname(originalName || "");
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    const key = `${FOLDER_PREFIX}/${folder}/${uniqueFileName}`;

    // Upload to S3
    // Note: ACL is not set because modern S3 buckets often have ACLs disabled
    // Use bucket policy for public access OR use signed URLs (recommended)
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileBuffer,
      ContentType: mimetype || "application/octet-stream",
    });

    await s3Client.send(command);

    // Generate public URL or signed URL
    const publicUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`;
    
    // For private files, you can generate a signed URL instead:
    // const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand({
    //   Bucket: BUCKET_NAME,
    //   Key: key,
    // }), { expiresIn: 3600 }); // 1 hour

    return {
      url: publicUrl,
      key: key,
      bucket: BUCKET_NAME,
      size: fileBuffer.length,
      mimetype: mimetype,
      originalName: originalName,
    };
  } catch (error) {
    console.error("S3 upload error:", error);
    throw new Error(`Failed to upload file to S3: ${error.message}`);
  }
};

/**
 * Delete file from S3
 * @param {string} key - S3 object key (path)
 * @returns {Promise<Object>} Delete result
 */
export const deleteFromS3 = async (key) => {
  try {
    if (!BUCKET_NAME) {
      throw new Error("AWS_S3_BUCKET_NAME is not configured");
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    return {
      success: true,
      key: key,
    };
  } catch (error) {
    console.error("S3 delete error:", error);
    throw new Error(`Failed to delete file from S3: ${error.message}`);
  }
};

/**
 * Get signed URL for private file access
 * @param {string} key - S3 object key (path)
 * @param {number} expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns {Promise<string>} Signed URL
 */
export const getSignedUrlForFile = async (key, expiresIn = 3600) => {
  try {
    if (!BUCKET_NAME) {
      throw new Error("AWS_S3_BUCKET_NAME is not configured");
    }

    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error("S3 signed URL error:", error);
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

/**
 * Check if file exists in S3
 * @param {string} key - S3 object key (path)
 * @returns {Promise<boolean>} True if file exists
 */
export const fileExistsInS3 = async (key) => {
  try {
    if (!BUCKET_NAME) {
      return false;
    }

    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
      return false;
    }
    console.error("S3 file check error:", error);
    return false;
  }
};

/**
 * Extract S3 key from URL
 * @param {string} url - S3 URL
 * @returns {string|null} S3 key or null
 */
export const getKeyFromUrl = (url) => {
  try {
    // Handle different S3 URL formats:
    // https://bucket-name.s3.region.amazonaws.com/key
    // https://s3.region.amazonaws.com/bucket-name/key
    // s3://bucket-name/key
    
    if (url.startsWith("s3://")) {
      return url.replace(`s3://${BUCKET_NAME}/`, "");
    }
    
    if (url.includes(".s3.") || url.includes("s3.amazonaws.com")) {
      const urlObj = new URL(url);
      // Remove leading slash
      return urlObj.pathname.substring(1);
    }
    
    return null;
  } catch (error) {
    console.error("Error extracting key from URL:", error);
    return null;
  }
};

export default s3Client;
