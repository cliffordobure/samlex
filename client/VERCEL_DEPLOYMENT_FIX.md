# Vercel Deployment Fix - Blank Page Issue

## Problem
Website works on localhost but shows blank page on Vercel.

## Common Causes & Solutions

### 1. **Environment Variables Not Set in Vercel Dashboard**

Go to your Vercel project → Settings → Environment Variables and add:

```
VITE_API_URL=https://samlex.onrender.com/api
VITE_SOCKET_URL=https://samlex.onrender.com
NODE_OPTIONS=--max-old-space-size=6144
```

**Important:** Make sure these are set for **Production**, **Preview**, and **Development** environments.

### 2. **Build Configuration**

In Vercel Dashboard → Settings → General:

- **Root Directory:** `client` (if deploying only frontend)
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Framework Preset:** Vite

### 3. **Check Build Logs**

1. Go to Vercel Dashboard → Deployments
2. Click on the latest deployment
3. Check the "Build Logs" tab for any errors
4. Common errors:
   - Missing environment variables
   - Build timeout
   - Memory issues
   - Import errors

### 4. **Verify vercel.json**

The `vercel.json` file should have proper rewrites for SPA routing.

### 5. **Check Browser Console**

1. Open your Vercel deployment URL
2. Open browser DevTools (F12)
3. Check Console tab for JavaScript errors
4. Check Network tab for failed API requests

### 6. **Base Path Issues**

If your app is deployed to a subdirectory, you may need to set `base` in `vite.config.js`.

## Quick Fixes

### Fix 1: Update vercel.json
The vercel.json has been updated with proper rewrites.

### Fix 2: Add Error Boundary
Check if there are any runtime errors preventing the app from loading.

### Fix 3: Verify Build Output
After deployment, check if `dist/index.html` exists and has correct paths.

## Testing Locally Before Deploying

1. Build locally: `npm run build`
2. Preview build: `npm run preview`
3. Check if preview works correctly
4. If preview works, the issue is likely environment variables or Vercel configuration

## Debugging Steps

1. **Check Vercel Build Logs:**
   - Look for any build errors
   - Check if all dependencies installed correctly
   - Verify build completed successfully

2. **Check Browser Console:**
   - Open DevTools on Vercel URL
   - Look for JavaScript errors
   - Check Network tab for failed requests

3. **Verify Environment Variables:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Ensure all required variables are set
   - Make sure they're available for the correct environment

4. **Test API Connection:**
   - Check if API URL is correct
   - Verify CORS settings on backend
   - Test API endpoint directly

## Common Error Messages

- **"Failed to fetch"** → API URL incorrect or CORS issue
- **"Module not found"** → Build issue, check imports
- **"Blank page"** → Check browser console for errors
- **"Build failed"** → Check build logs for specific error

## Next Steps

1. Set environment variables in Vercel Dashboard
2. Redeploy the application
3. Check build logs for any errors
4. Test the deployed URL
5. Check browser console for runtime errors
