/**
 * Cloudinary Direct Upload Configuration
 * Handles direct file uploads from frontend to Cloudinary
 */

// Cloudinary configuration - these should be set in your environment variables
// Note: In Vite, use import.meta.env instead of process.env, and prefix with VITE_
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || import.meta.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'your_cloudinary_cloud_name';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || import.meta.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET || 'your_upload_preset';
const CLOUDINARY_FOLDER = import.meta.env.VITE_CLOUDINARY_FOLDER || import.meta.env.REACT_APP_CLOUDINARY_FOLDER || 'law-firm-documents';

// TEMPORARY: If you want to test immediately, replace the values below with your actual Cloudinary credentials
// const CLOUDINARY_CLOUD_NAME = 'YOUR_ACTUAL_CLOUD_NAME_HERE';
// const CLOUDINARY_UPLOAD_PRESET = 'YOUR_ACTUAL_PRESET_NAME_HERE';

/**
 * Upload file directly to Cloudinary
 * @param {File} file - The file to upload
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<Object>} Upload result with URL and public_id
 */
export const uploadToCloudinary = async (file, onProgress = null) => {
  try {
    console.log('📤 Uploading file directly to Cloudinary:', file.name, 'Size:', file.size);
    console.log('🔧 Cloudinary Config:', {
      cloudName: CLOUDINARY_CLOUD_NAME,
      uploadPreset: CLOUDINARY_UPLOAD_PRESET,
      folder: CLOUDINARY_FOLDER
    });

    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', CLOUDINARY_FOLDER); // Organize files in a folder

    // Create XMLHttpRequest for progress tracking
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        }
      });

      // Handle upload completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          console.log('✅ File uploaded successfully to Cloudinary:', response);
          resolve({
            url: response.secure_url,
            public_id: response.public_id,
            originalName: file.name,
            size: response.bytes
          });
        } else {
          console.error('❌ Upload failed:', {
            status: xhr.status,
            statusText: xhr.statusText,
            response: xhr.responseText,
            cloudName: CLOUDINARY_CLOUD_NAME,
            uploadPreset: CLOUDINARY_UPLOAD_PRESET
          });
          
          let errorMessage = `Upload failed: ${xhr.statusText}`;
          if (xhr.status === 401) {
            errorMessage = 'Cloudinary configuration error. Please check your environment variables.';
          } else if (xhr.status === 400) {
            errorMessage = 'Invalid upload preset or cloud name.';
          }
          
          reject(new Error(errorMessage));
        }
      });

      // Handle upload errors
      xhr.addEventListener('error', () => {
        console.error('❌ Upload error:', xhr.statusText);
        reject(new Error(`Upload error: ${xhr.statusText}`));
      });

      // Start upload
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`);
      xhr.send(formData);
    });

  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Upload multiple files to Cloudinary
 * @param {File[]} files - Array of files to upload
 * @param {Function} onProgress - Progress callback function
 * @returns {Promise<Object[]>} Array of upload results
 */
export const uploadMultipleToCloudinary = async (files, onProgress = null) => {
  const uploadPromises = files.map((file, index) => {
    const fileProgress = (percent) => {
      if (onProgress) {
        onProgress({
          fileIndex: index,
          fileName: file.name,
          percent: percent
        });
      }
    };
    return uploadToCloudinary(file, fileProgress);
  });

  try {
    const results = await Promise.all(uploadPromises);
    console.log('✅ All files uploaded successfully:', results);
    return results;
  } catch (error) {
    console.error('❌ Some files failed to upload:', error);
    throw error;
  }
};

/**
 * Validate file before upload
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
export const validateFile = (file) => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not supported' };
  }

  return { valid: true };
};

export default {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  validateFile
};
