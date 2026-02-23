# PWA Setup Guide - Samlex Law Firm SaaS

Your app is now configured as a Progressive Web App (PWA)! Users can install it on their devices and access it like a native app.

## ✅ What's Already Done

1. **Web App Manifest** (`public/manifest.json`) - Defines app metadata, icons, and display settings
2. **Service Worker** (`public/sw.js`) - Enables offline functionality and caching
3. **Install Prompt Component** - Shows a custom install prompt to users
4. **HTML Updates** - Manifest linked and service worker registered

## 📱 Creating App Icons

You need to create two icon files for the PWA to work properly:

### Required Icons:
- `public/icon-192x192.png` - 192x192 pixels (for Android)
- `public/icon-512x512.png` - 512x512 pixels (for Android and splash screens)

### Option 1: Use the Icon Generator
1. Open `public/generate-icons.html` in your browser
2. Click "Generate 192x192 Icon" and download it
3. Save it as `icon-192x192.png` in the `public` folder
4. Click "Generate 512x512 Icon" and download it
5. Save it as `icon-512x512.png` in the `public` folder

### Option 2: Create Custom Icons
1. Design your app logo/icon
2. Export as PNG files with the exact sizes:
   - 192x192 pixels → `public/icon-192x192.png`
   - 512x512 pixels → `public/icon-512x512.png`
3. Ensure icons are square and have transparent or solid backgrounds
4. Icons should be recognizable at small sizes

### Option 3: Use Online Tools
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Favicon.io](https://favicon.io/)

## 🚀 Testing the PWA

### Local Testing:
1. Build your app: `npm run build`
2. Serve the build: `npm run preview` (or use a local server)
3. Open in Chrome/Edge
4. Look for the install prompt or use the browser menu (⋮ → "Install app")

### Production Testing:
1. Deploy your app to a server with HTTPS (required for PWA)
2. Visit the app in a supported browser
3. Users will see the install prompt after a few seconds
4. On mobile, users can "Add to Home Screen"

## 📋 Browser Support

- ✅ Chrome/Edge (Desktop & Android)
- ✅ Safari (iOS 11.3+)
- ✅ Firefox (Desktop & Android)
- ✅ Samsung Internet

## 🎯 Features Enabled

- **Install Prompt**: Custom prompt appears after 3 seconds (if not dismissed)
- **Offline Support**: Basic caching for app shell
- **Standalone Mode**: App opens in its own window (no browser UI)
- **Desktop Icon**: App icon appears on desktop/home screen
- **Splash Screen**: Custom splash screen on mobile devices

## 🔧 Customization

### Change App Name/Description:
Edit `public/manifest.json`:
```json
{
  "name": "Your App Name",
  "short_name": "Short Name",
  "description": "Your description"
}
```

### Change Theme Color:
Edit `public/manifest.json`:
```json
{
  "theme_color": "#your-color",
  "background_color": "#your-bg-color"
}
```

Also update `index.html`:
```html
<meta name="theme-color" content="#your-color" />
```

### Customize Install Prompt:
Edit `src/components/common/InstallPrompt.jsx` to change:
- Prompt appearance
- Timing (currently 3 seconds)
- Dismiss behavior

## ⚠️ Important Notes

1. **HTTPS Required**: PWAs only work over HTTPS (or localhost for development)
2. **Icons Required**: The app won't be installable without the icon files
3. **Service Worker**: Must be served from the root domain (not a subdirectory)
4. **Browser Cache**: Users may need to clear cache or do a hard refresh after updates

## 🐛 Troubleshooting

### Install prompt not showing?
- Check browser console for errors
- Ensure you're on HTTPS (or localhost)
- Verify icons exist in `public` folder
- Check that service worker registered successfully

### Icons not showing?
- Verify icon files exist in `public` folder
- Check file names match exactly: `icon-192x192.png` and `icon-512x512.png`
- Ensure icons are valid PNG files
- Clear browser cache

### Service Worker not working?
- Check browser console for registration errors
- Verify `sw.js` is in the `public` folder
- Ensure service worker is served from root path
- Check network tab to see if `sw.js` loads successfully

## 📚 Additional Resources

- [MDN: Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev: PWA Guide](https://web.dev/progressive-web-apps/)
- [PWA Checklist](https://web.dev/pwa-checklist/)
