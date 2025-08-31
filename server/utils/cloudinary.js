import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload file to Cloudinary
export const uploadToCloud = async (fileBuffer, folder = "general") => {
  try {
    // Convert buffer to base64 string
    const base64String = fileBuffer.toString("base64");
    const dataURI = `data:application/octet-stream;base64,${base64String}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder: folder,
      resource_type: "auto",
      use_filename: true,
      unique_filename: true,
    });

    return result;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload file to Cloudinary");
  }
};

// Delete file from Cloudinary
export const deleteFromCloud = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error("Failed to delete file from Cloudinary");
  }
};

// Extract public ID from Cloudinary URL
export const getPublicIdFromUrl = (url) => {
  try {
    const urlParts = url.split("/");
    const filenameWithExtension = urlParts[urlParts.length - 1];
    const filename = filenameWithExtension.split(".")[0];
    const folder = urlParts[urlParts.length - 2];
    return `${folder}/${filename}`;
  } catch (error) {
    console.error("Error extracting public ID from URL:", error);
    return null;
  }
};

export default cloudinary;
