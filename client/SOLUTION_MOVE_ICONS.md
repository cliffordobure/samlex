# ✅ SOLUTION: Move Icons to Assets Folder

Since the root-level icons aren't working on Vercel, let's move them to an `assets` folder which is explicitly excluded from rewrites.

## Steps to Fix

### 1. Create Assets Folder and Move Icons

```bash
cd client
mkdir -p public/assets
move public\icon-192x192.png public\assets\
move public\icon-512x512.png public\assets\
```

Or manually:
- Create `public/assets/` folder
- Move `icon-192x192.png` to `public/assets/`
- Move `icon-512x512.png` to `public/assets/`

### 2. Update manifest.json

```json
{
  "icons": [
    {
      "src": "/assets/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/assets/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "shortcuts": [
    {
      "name": "Dashboard",
      "short_name": "Dashboard",
      "description": "Go to dashboard",
      "url": "/dashboard",
      "icons": [{ "src": "/assets/icon-192x192.png", "sizes": "192x192" }]
    }
  ]
}
```

### 3. Update index.html

Change the apple-touch-icon link:
```html
<link rel="apple-touch-icon" href="/assets/icon-192x192.png" />
```

### 4. Update vercel.json (Already Done)

The current vercel.json already excludes `assets/` folder:
```json
{
  "rewrites": [
    {
      "source": "/((?!.*\\.[a-z0-9]{2,4}$|assets/).*)",
      "destination": "/index.html"
    }
  ]
}
```

### 5. Commit and Deploy

```bash
git add public/assets/ public/manifest.json index.html
git commit -m "Move PWA icons to assets folder to fix Vercel routing"
git push
```

## Why This Works

- `assets/` folder is explicitly excluded from rewrite
- Vercel serves files in `assets/` folder directly
- No regex complexity - simple path exclusion
- Standard practice for static assets

## Test After Deployment

1. Visit: `https://samlex-client.vercel.app/assets/icon-192x192.png`
2. Should show PNG image
3. Check DevTools → Application → Manifest
4. Icons should load without errors
