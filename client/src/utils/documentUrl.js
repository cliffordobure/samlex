/**
 * Utility function to get accessible URL for documents
 * Automatically handles S3 signed URLs and Cloudinary URLs
 */

/**
 * Get accessible URL for a document
 * For S3 files, fetches a signed URL from the backend
 * For Cloudinary files, returns the URL directly
 * @param {string} url - Document URL (S3 or Cloudinary)
 * @returns {Promise<string>} Accessible URL
 */
export const getAccessibleDocumentUrl = async (url) => {
  if (!url) {
    return url;
  }

  // Check if it's an S3 URL
  const isS3Url = url.includes('.s3.') || url.includes('s3.amazonaws.com');
  
  if (isS3Url) {
    try {
      // Get API URL dynamically to avoid import issues
      const getApiUrl = () => {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          return '/api';
        }
        if (window.location.hostname.includes('vercel.app')) {
          return 'https://samlex.onrender.com/api';
        }
        if (import.meta.env.VITE_API_URL) {
          return import.meta.env.VITE_API_URL;
        }
        return 'https://samlex.onrender.com/api';
      };
      
      const API_URL = getApiUrl();
      
      // Fetch signed URL from backend
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_URL}/upload/signed-url?url=${encodeURIComponent(url)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error("Failed to get signed URL:", response.statusText);
        // Fallback to original URL (might not work if bucket is private)
        return url;
      }

      const data = await response.json();
      if (data.success && data.url) {
        return data.url;
      }
    } catch (error) {
      console.error("Error fetching signed URL:", error);
      // Fallback to original URL
      return url;
    }
  }

  // For Cloudinary or other URLs, return as-is
  return url;
};

/**
 * Check if a URL is an S3 URL
 * @param {string} url - URL to check
 * @returns {boolean} True if URL is S3
 */
export const isS3Url = (url) => {
  return url && (url.includes('.s3.') || url.includes('s3.amazonaws.com'));
};
