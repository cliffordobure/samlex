// Force production URLs for immediate testing
// This will override any environment variables and force production URLs

const forceProductionUrls = () => {
  // Check if we're on Vercel (production)
  if (window.location.hostname.includes('vercel.app')) {
    console.log('🚀 Detected Vercel deployment, forcing production URLs');
    
    // Override environment variables
    if (!import.meta.env.VITE_API_URL) {
      import.meta.env.VITE_API_URL = 'https://samlex.onrender.com/api';
    }
    
    if (!import.meta.env.VITE_SOCKET_URL) {
      import.meta.env.VITE_SOCKET_URL = 'https://samlex.onrender.com';
    }
    
    console.log('✅ Forced production URLs:', {
      API_URL: import.meta.env.VITE_API_URL,
      SOCKET_URL: import.meta.env.VITE_SOCKET_URL
    });
  }
};

// Run immediately
forceProductionUrls();

export default forceProductionUrls;
