// Force production URLs for immediate testing
// Note: import.meta.env is read-only, so we can't modify it
// This file is kept for reference but doesn't modify env vars
// The api.js file handles URL detection automatically

const forceProductionUrls = () => {
  // Check if we're on Vercel (production)
  if (window.location.hostname.includes('vercel.app')) {
    console.log('🚀 Detected Vercel deployment');
    console.log('✅ Using production URLs from api.js configuration');
  }
};

// Run immediately (but don't modify import.meta.env)
forceProductionUrls();

export default forceProductionUrls;
