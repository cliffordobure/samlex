# Complete Fix for Vercel 404 Script Error

## Problem
Error: "Failed to load: https://samlex-client.vercel.app/assets/index-DH5SV-sS.js" with 404 status.

## Root Causes
1. **Build may be failing** - File not generated
2. **Rewrite rule catching assets** - Assets redirected to index.html
3. **Build output mismatch** - HTML references file that doesn't exist

## Solution Applied

### 1. Updated `vercel.json` with Proper Routes
Changed from `rewrites` to `routes` for better control:

```json
{
  "routes": [
    {
      "src": "/assets/(.*)",
      "headers": { "Cache-Control": "public, max-age=31536000, immutable" }
    },
    {
      "src": "/(.*\\.(js|css|png|jpg|...))",
      "headers": { "Cache-Control": "public, max-age=31536000, immutable" }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

This ensures:
- ✅ Assets are served directly (not rewritten)
- ✅ All file extensions are excluded from SPA routing
- ✅ Only non-file routes go to index.html

## Step-by-Step Fix

### Step 1: Verify Vercel Dashboard Settings

Go to **Vercel Dashboard → Your Project → Settings → General**:

1. **Root Directory:** `client` (if deploying from monorepo)
2. **Build Command:** `npm run build`
3. **Output Directory:** `dist`
4. **Install Command:** `npm install`
5. **Framework Preset:** Vite
6. **Node.js Version:** 18.x or 20.x

### Step 2: Check Environment Variables

Go to **Vercel Dashboard → Settings → Environment Variables**:

Add these for **Production**, **Preview**, AND **Development**:

```
VITE_API_URL=https://samlex.onrender.com/api
VITE_SOCKET_URL=https://samlex.onrender.com
NODE_OPTIONS=--max-old-space-size=6144
```

**CRITICAL:** Click "Save" after adding each variable!

### Step 3: Check Build Logs

1. Go to **Vercel Dashboard → Deployments**
2. Click on the latest deployment
3. Check **Build Logs** tab
4. Look for:
   - ✅ "Build completed successfully"
   - ✅ "dist/assets/index-*.js" in output
   - ❌ Any red error messages
   - ❌ "Build failed" or "Build error"

### Step 4: Test Build Locally

```bash
cd client
npm run build
ls -la dist/assets/
```

You should see:
- `index-[hash].js` (should be several hundred KB or MB)
- `index-[hash].css`

If files are missing or very small (< 10KB), the build is failing.

### Step 5: Verify Build Output

After local build, check `dist/index.html`:

```bash
cat dist/index.html | grep "index-"
```

Should show something like:
```html
<script type="module" crossorigin src="/assets/index-CuQjx2EI.js"></script>
```

### Step 6: Clear Vercel Cache

1. Go to **Vercel Dashboard → Settings → General**
2. Scroll to "Clear Build Cache"
3. Click "Clear"
4. Redeploy

## Common Issues & Solutions

### Issue 1: Build Fails on Vercel

**Symptoms:**
- Build logs show errors
- No `dist/assets/` folder created
- Build timeout

**Solutions:**
1. Check build logs for specific error
2. Increase memory: `NODE_OPTIONS=--max-old-space-size=6144`
3. Check Node version (use 18.x or 20.x)
4. Verify all dependencies in `package.json`

### Issue 2: Build Succeeds But File Not Found

**Symptoms:**
- Build completes successfully
- File exists in build logs
- But 404 when accessing URL

**Solutions:**
1. Verify `vercel.json` is in correct location (`client/vercel.json`)
2. Check if Root Directory is set correctly
3. Ensure routes configuration excludes assets
4. Try clearing Vercel cache and redeploying

### Issue 3: Wrong File Name in HTML

**Symptoms:**
- HTML references `index-DH5SV-sS.js`
- But build created `index-CuQjx2EI.js`

**Solutions:**
1. This is normal - Vite generates different hashes each build
2. The issue is the file isn't being served
3. Check `vercel.json` routes configuration
4. Verify assets are not being rewritten

### Issue 4: Desktop App Issue

If you're using a desktop app (Electron/PWA):

1. **Clear app cache:**
   - Close the app completely
   - Clear browser cache
   - Restart the app

2. **Check if app is pointing to correct URL:**
   - Verify the app is loading from Vercel URL
   - Not from localhost or cached version

3. **Service Worker issues:**
   - Unregister service worker
   - Clear service worker cache
   - Reload app

## Debugging Commands

### Check Build Output
```bash
cd client
npm run build
ls -la dist/assets/
cat dist/index.html | grep "assets/"
```

### Test Build Locally
```bash
cd client
npm run build
npm run preview
# Open http://localhost:4173
# Check if assets load correctly
```

### Check for Build Errors
```bash
cd client
npm run build 2>&1 | tee build.log
# Check build.log for errors
```

## Verification Checklist

After deploying, verify:

- [ ] Build completes successfully in Vercel logs
- [ ] `dist/assets/` folder contains JavaScript files
- [ ] JavaScript files are > 100KB (not tiny)
- [ ] `dist/index.html` references correct asset paths
- [ ] Assets load with 200 status (not 404)
- [ ] SPA routes work (try navigating)
- [ ] No console errors in browser

## If Still Not Working

1. **Check Vercel Build Logs:**
   - Look for "Build completed successfully"
   - Check if `dist/assets/` is mentioned
   - Look for any error messages

2. **Check Browser Network Tab:**
   - Open DevTools (F12)
   - Go to Network tab
   - Refresh page
   - Check status of `/assets/index-*.js`
   - If 404, the file doesn't exist
   - If 200 but empty, build issue

3. **Try Manual Deploy:**
   ```bash
   cd client
   npm run build
   # Upload dist/ folder manually to Vercel
   ```

4. **Contact Support:**
   - Share Vercel build logs
   - Share browser console errors
   - Share Network tab screenshot

## Next Steps

1. ✅ Commit updated `vercel.json`
2. ✅ Push to repository
3. ✅ Wait for Vercel to redeploy
4. ✅ Check new deployment
5. ✅ Verify assets load correctly
6. ✅ Test the application

The fix ensures assets are properly served and not caught by SPA routing rules.
