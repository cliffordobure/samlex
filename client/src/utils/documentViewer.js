/**
 * Get the appropriate viewer URL for a document
 * Supports PDFs, Word documents, Excel, PowerPoint, and images
 */
export const getDocumentViewerUrl = (url, filename) => {
  if (!url || !filename) return url;

  const lowerFilename = filename.toLowerCase();
  const encodedUrl = encodeURIComponent(url);

  // PDF files - use direct URL
  if (lowerFilename.endsWith('.pdf') || url.includes('.pdf')) {
    return url;
  }

  // Word documents (.doc, .docx)
  if (lowerFilename.match(/\.(doc|docx)$/i)) {
    // Use Microsoft Office Online Viewer
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
  }

  // Excel files (.xls, .xlsx)
  if (lowerFilename.match(/\.(xls|xlsx)$/i)) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
  }

  // PowerPoint files (.ppt, .pptx)
  if (lowerFilename.match(/\.(ppt|pptx)$/i)) {
    return `https://view.officeapps.live.com/op/embed.aspx?src=${encodedUrl}`;
  }

  // Images - use direct URL
  if (lowerFilename.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i)) {
    return url;
  }

  // For other file types, return original URL
  return url;
};

/**
 * Check if a file type can be previewed in browser
 */
export const canPreviewInBrowser = (filename) => {
  if (!filename) return false;
  
  const lowerFilename = filename.toLowerCase();
  
  return !!(
    lowerFilename.endsWith('.pdf') ||
    lowerFilename.match(/\.(doc|docx|xls|xlsx|ppt|pptx)$/i) ||
    lowerFilename.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i)
  );
};

/**
 * Check if file is a Word document
 */
export const isWordDocument = (filename) => {
  if (!filename) return false;
  return /\.(doc|docx)$/i.test(filename);
};

/**
 * Check if file is an image
 */
export const isImage = (filename) => {
  if (!filename) return false;
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(filename);
};

/**
 * Check if file is a PDF
 */
export const isPDF = (filename) => {
  if (!filename) return false;
  return filename.toLowerCase().endsWith('.pdf');
};

// Default export for compatibility
export default {
  getDocumentViewerUrl,
  canPreviewInBrowser,
  isWordDocument,
  isImage,
  isPDF,
};
