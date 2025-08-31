// Centralized API configuration
const getApiUrl = () => {
  // Check if we're in development (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '/api';
  }
  
  // Check if we're on Vercel (production)
  if (window.location.hostname.includes('vercel.app')) {
    return 'https://samlex.onrender.com/api';
  }
  
  // Check if environment variable is set
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Default to production URL
  return 'https://samlex.onrender.com/api';
};

const getSocketUrl = () => {
  // Check if we're in development (localhost)
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '';
  }
  
  // Check if we're on Vercel (production)
  if (window.location.hostname.includes('vercel.app')) {
    return 'https://samlex.onrender.com';
  }
  
  // Check if environment variable is set
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }
  
  // Default to production URL
  return 'https://samlex.onrender.com';
};

export const API_URL = getApiUrl();
export const SOCKET_URL = getSocketUrl();

// Debug logging
console.log('🔧 API Configuration:');
console.log('  Hostname:', window.location.hostname);
console.log('  API URL:', API_URL);
console.log('  Socket URL:', SOCKET_URL);
console.log('  Environment VITE_API_URL:', import.meta.env.VITE_API_URL);
console.log('  Environment VITE_SOCKET_URL:', import.meta.env.VITE_SOCKET_URL);
