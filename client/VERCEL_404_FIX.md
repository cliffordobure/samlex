# Vercel 404 Script Error Fix

## Problem
Vercel deployment shows error: "Failed to load: `https://samlex-client.vercel.app/assets/index-DH5SV-sS.js`" with 404 status.

## Root Cause
The `vercel.json` rewrite rule was catching ALL requests, including static assets, causing them to be redirected to `index.html` instead of being served as files.

## Solution Applied

### 1. Updated `vercel.json`
Changed the rewrite rule to exclude static assets:

```json
{
  "rewrites": [
    {
      "source": "/((?!assets|_next|favicon.ico|manifest.json|sw.js|vite.svg|.*\\.[a-z0-9]{2,4}$).*)",
      "destination": "/index.html"
    }
  ]
}
```

This regex pattern:
- Matches all routes EXCEPT:
  - `/assets/*` - JavaScript, CSS, and other assets
  - Files with extensions (`.js`, `.css`, `.png`, etc.)
  - Static files like `favicon.ico`, `manifest.json`, `sw.js`, `vite.svg`

### 2. How It Works
- **Static assets** (like `/assets/index-*.js`) are served directly by Vercel
- **SPA routes** (like `/credit-collection/cases`) are rewritten to `/index.html`
- **File extensions** are excluded from rewriting

## Verification Steps

1. **Check Vercel Build Logs:**
   - Go to Vercel Dashboard → Deployments
   - Check if build completed successfully
   - Verify `dist/assets/` folder contains JavaScript files

2. **Test Asset Loading:**
   - Open browser DevTools (F12)
   - Go to Network tab
   - Refresh the page
   - Check if `/assets/index-*.js` loads with status 200

3. **Test SPA Routing:**
   - Navigate to `/credit-collection/cases`
   - Should load the app (not 404)
   - Check Network tab - should see `index.html` loaded

## If Still Not Working

### Check 1: Build Output
```bash
cd client
npm run build
ls -la dist/assets/
```

Should see files like:
- `index-[hash].js`
- `index-[hash].css`

### Check 2: Vercel Configuration
In Vercel Dashboard → Settings → General:
- **Root Directory:** `client` (if deploying from monorepo)
- **Output Directory:** `dist`
- **Build Command:** `npm run build`

### Check 3: Environment Variables
Make sure these are set in Vercel:
- `VITE_API_URL`
- `VITE_SOCKET_URL`
- `NODE_OPTIONS=--max-old-space-size=6144`

### Check 4: Clear Vercel Cache
1. Go to Vercel Dashboard → Settings → General
2. Scroll to "Clear Build Cache"
3. Click "Clear"
4. Redeploy

## Alternative Solution (If Above Doesn't Work)

If the regex pattern doesn't work, use explicit routes:

```json
{
  "rewrites": [
    {
      "source": "/credit-collection/:path*",
      "destination": "/index.html"
    },
    {
      "source": "/admin/:path*",
      "destination": "/index.html"
    },
    {
      "source": "/legal/:path*",
      "destination": "/index.html"
    },
    {
      "source": "/:path*",
      "destination": "/index.html"
    }
  ]
}
```

But this is less flexible and requires updating when adding new routes.

## Testing Locally

Test the build locally before deploying:

```bash
cd client
npm run build
npm run preview
```

Open `http://localhost:4173` and verify:
- ✅ Assets load correctly
- ✅ Routes work (try navigating)
- ✅ No 404 errors in console

## Next Steps

1. Commit the updated `vercel.json`
2. Push to your repository
3. Vercel will automatically redeploy
4. Check the new deployment
5. Verify assets load correctly
