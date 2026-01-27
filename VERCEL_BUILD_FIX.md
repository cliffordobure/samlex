# Vercel Build Fix - Esbuild Error Solution

## Problem
The build was failing on Vercel with an esbuild error, typically caused by:
- Memory limitations during build
- Node version incompatibility
- Large bundle sizes

## Solutions Applied

### 1. **Vite Configuration Optimizations** (`client/vite.config.js`)
- Added code splitting for vendor libraries (React, Redux, Router, Charts)
- Disabled sourcemaps in production to reduce build time
- Optimized esbuild settings
- Added console/debugger removal in production

### 2. **Memory Allocation** (`client/package.json` & `client/vercel.json`)
- Added `NODE_OPTIONS=--max-old-space-size=4096` to increase memory limit
- Updated build command to use increased memory allocation
- Added environment variable in vercel.json

### 3. **Node Version Specification**
- Created `.nvmrc` file specifying Node 18
- Created `.node-version` file as backup
- Ensures consistent Node version across builds

### 4. **Vercel Configuration** (`client/vercel.json`)
- Set correct build command with memory allocation
- Set output directory to `dist`
- Configured environment variables

## Additional Steps to Check in Vercel Dashboard

1. **Project Settings → General**
   - Ensure "Root Directory" is set to `client` (if deploying only frontend)
   - Or leave blank if deploying from root

2. **Project Settings → Environment Variables**
   - Verify `VITE_API_URL` and `VITE_SOCKET_URL` are set
   - Add `NODE_OPTIONS` = `--max-old-space-size=4096` if not already set

3. **Project Settings → Build & Development Settings**
   - Build Command: `NODE_OPTIONS=--max-old-space-size=4096 npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`
   - Node.js Version: `18.x` (or latest 18)

4. **If Still Failing**
   - Try upgrading to Node 20: Update `.nvmrc` to `20`
   - Check Vercel build logs for specific error messages
   - Consider enabling "Debug Build" in Vercel settings

## Testing Locally

To test the build locally:
```bash
cd client
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

## Files Modified
- `client/vite.config.js` - Build optimizations
- `client/package.json` - Build script with memory allocation
- `client/vercel.json` - Vercel configuration
- `client/.nvmrc` - Node version specification
- `client/.node-version` - Node version backup

## Expected Results
- Build should complete successfully
- Reduced build time due to optimizations
- Better memory management during build process
- Consistent builds across environments
