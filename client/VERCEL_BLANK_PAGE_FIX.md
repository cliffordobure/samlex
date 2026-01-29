# Vercel Blank Page - Complete Fix Guide

## Problem
- Website works perfectly on localhost
- Shows completely blank page on Vercel
- No console errors visible
- No content on screen

## Changes Made

### 1. Enhanced Error Handling
- Added error logging in `index.html`
- Added comprehensive error handling in `main.jsx`
- Added global error handlers

### 2. Build Configuration
- Added `base: '/'` to `vite.config.js`
- Added `_redirects` file for SPA routing

### 3. Debugging Tools
- Added console logging at every step
- Added visual error messages if app fails to load

## Step-by-Step Fix

### Step 1: Verify Vercel Build Settings

Go to **Vercel Dashboard → Your Project → Settings → General**:

```
Root Directory: client
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Framework Preset: Vite
Node.js Version: 18.x (or 20.x)
```

### Step 2: Set Environment Variables

Go to **Vercel Dashboard → Settings → Environment Variables**:

Add these for **Production**, **Preview**, AND **Development**:

```
VITE_API_URL = https://samlex.onrender.com/api
VITE_SOCKET_URL = https://samlex.onrender.com
NODE_OPTIONS = --max-old-space-size=6144
```

**CRITICAL:** Make sure to click "Save" after adding each variable!

### Step 3: Check Build Logs

1. Go to **Vercel Dashboard → Deployments**
2. Click on the latest deployment
3. Check **Build Logs** tab
4. Look for:
   - ✅ "Build completed successfully"
   - ❌ Any red error messages
   - ⚠️ Any warnings about missing files

### Step 4: Test the Build Locally

```bash
cd client
npm run build
npm run preview
```

If `npm run preview` shows the app correctly, the issue is Vercel configuration.
If `npm run preview` also shows blank, there's a build issue.

### Step 5: Check Browser Console

1. Open your Vercel URL
2. Press **F12** to open DevTools
3. Go to **Console** tab
4. Look for:
   - "🚀 main.jsx script started" - means HTML loaded
   - "✅ All imports successful" - means imports worked
   - "✅ React app mounted successfully" - means app loaded
   - Any red error messages

### Step 6: Check Network Tab

1. In DevTools, go to **Network** tab
2. Refresh the page
3. Look for:
   - Failed requests (red)
   - 404 errors (missing files)
   - CORS errors

### Step 7: Verify Files Are Built

After deployment, check if these files exist in Vercel:
- `dist/index.html`
- `dist/assets/index-[hash].js`
- `dist/assets/index-[hash].css`

## Common Issues & Solutions

### Issue 1: Build Fails Silently
**Solution:** Check Vercel build logs. Look for memory errors or timeout.

### Issue 2: Environment Variables Not Set
**Solution:** 
- Go to Vercel Dashboard → Settings → Environment Variables
- Add all required variables
- Make sure they're set for the correct environment
- Redeploy after adding

### Issue 3: Wrong Root Directory
**Solution:**
- If your `client` folder is in a monorepo, set Root Directory to `client`
- If deploying from root, leave Root Directory empty

### Issue 4: Build Output Not Found
**Solution:**
- Verify Output Directory is `dist`
- Check if `dist` folder exists after build
- Make sure `vite.config.js` doesn't change output directory

### Issue 5: JavaScript Not Executing
**Solution:**
- Check browser console for errors
- Verify script tags in `index.html` are correct
- Check if Content Security Policy is blocking scripts

## Debugging Commands

### Test Build Locally
```bash
cd client
npm run build
npm run preview
```

### Check Build Output
```bash
cd client
npm run build
ls -la dist/
cat dist/index.html
```

### Check for Syntax Errors
```bash
cd client
npm run lint
```

## What to Check After Deployment

1. ✅ Open Vercel URL in browser
2. ✅ Open DevTools (F12)
3. ✅ Check Console for error messages
4. ✅ Check Network tab for failed requests
5. ✅ Check if HTML is loading (View Page Source)
6. ✅ Check if JavaScript files are loading (Network tab)

## If Still Not Working

1. **Check Vercel Build Logs:**
   - Look for any error messages
   - Check if build completed
   - Verify all dependencies installed

2. **Check Browser Console:**
   - Look for JavaScript errors
   - Check if scripts are loading
   - Verify no CORS errors

3. **Verify Environment Variables:**
   - Double-check all variables are set
   - Make sure they're for the correct environment
   - Try redeploying after setting variables

4. **Test with Minimal Build:**
   - Temporarily comment out complex imports
   - See if basic React app loads
   - Gradually add back features

## Next Steps

After fixing the blank page:
1. Verify all routes work
2. Test API connections
3. Check authentication flow
4. Test all major features

## Support

If still not working after following all steps:
1. Share Vercel build logs
2. Share browser console errors
3. Share Network tab screenshots
4. Share your `vercel.json` file
