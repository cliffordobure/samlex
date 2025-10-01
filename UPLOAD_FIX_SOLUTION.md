# Document Upload Fix - Production Solution

## 🔍 Problem Identified
The hosted version at `https://samlex-client.vercel.app` was returning a `405 Method Not Allowed` error when trying to upload documents to `/api/upload`.

## ✅ Root Cause Found
The issue was in the client-side API configuration. The upload components were using inconsistent API base URLs instead of the centralized configuration.

## 🛠️ Fixes Applied

### 1. Updated API Configuration in Upload Components

**Files Fixed:**
- `client/src/pages/Legal/CaseDetails.jsx`
- `client/src/pages/CreditCollection/CaseDetails.jsx`

**Changes Made:**
- Replaced `import.meta.env.VITE_API_URL || "/api"` with centralized `API_URL` from `client/src/config/api.js`
- Added proper imports for the centralized API configuration
- Ensured consistent API endpoint usage across all upload functionality

### 2. Verified Server-Side Configuration

**Upload Endpoint:** ✅ Working correctly
- `POST /api/upload` - File upload endpoint
- `GET /api/upload/test` - Test endpoint  
- `GET /api/upload/health` - Health check endpoint

**CORS Configuration:** ✅ Properly configured
- Allows requests from `https://samlex-client.vercel.app`
- Supports all necessary HTTP methods (GET, POST, PUT, DELETE, OPTIONS, PATCH)
- Includes proper headers for file uploads

**Cloudinary Configuration:** ✅ Environment variables set
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## 🧪 Testing Results

### Server Endpoint Tests
```
✅ Health check: https://samlex.onrender.com/api/upload/health (200 OK)
✅ Test endpoint: https://samlex.onrender.com/api/upload/test (200 OK)
✅ Upload endpoint: https://samlex.onrender.com/api/upload (401 - Auth required as expected)
```

### Client Configuration
```javascript
// Before (inconsistent)
const API_BASE = import.meta.env.VITE_API_URL || "/api";

// After (centralized)
const API_BASE = API_URL; // Uses centralized config from api.js
```

## 📋 Deployment Steps

### 1. Deploy Client Changes
The client-side fixes need to be deployed to Vercel:
```bash
# The changes are already made to the codebase
# Deploy to Vercel (this will happen automatically if connected to Git)
```

### 2. Verify Environment Variables
Ensure these are set in your production environment:

**Vercel Environment Variables:**
```bash
VITE_API_URL=https://samlex.onrender.com/api
VITE_SOCKET_URL=https://samlex.onrender.com
```

**Render Environment Variables:**
```bash
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLIENT_URL=https://samlex-client.vercel.app
```

### 3. Test Upload Functionality
After deployment, test the upload functionality:

1. **Login to the application**
2. **Navigate to any case details page**
3. **Try uploading a document**
4. **Check browser console for any errors**
5. **Verify the document appears in the case**

## 🔧 Troubleshooting

### If uploads still fail:

1. **Check Browser Console:**
   - Open Developer Tools (F12)
   - Look for any error messages in the Console tab
   - Check the Network tab for failed requests

2. **Verify API Configuration:**
   - The app should log API configuration on load
   - Look for: `🔧 API Configuration:` in console
   - Verify `API URL: https://samlex.onrender.com/api`

3. **Check Authentication:**
   - Ensure you're logged in
   - Check that the Authorization header is being sent
   - Verify the token is valid

4. **Test Server Endpoints:**
   ```bash
   # Test health check
   curl https://samlex.onrender.com/api/upload/health
   
   # Test upload endpoint (should return 401 without auth)
   curl -X POST https://samlex.onrender.com/api/upload
   ```

## ✅ Expected Behavior After Fix

1. **Document Upload:** Should work without 405 errors
2. **File Types:** Should support PDF, DOC, DOCX, images, etc.
3. **File Size:** Up to 10MB for documents
4. **Authentication:** Requires valid login token
5. **Cloudinary Integration:** Files uploaded to Cloudinary and URLs stored in database

## 📞 Support

If issues persist after deployment:
1. Check the browser console for specific error messages
2. Verify all environment variables are set correctly
3. Test the server endpoints directly using curl or Postman
4. Check Render logs for any server-side errors

The fix ensures consistent API configuration across all upload components and should resolve the 405 Method Not Allowed error.
