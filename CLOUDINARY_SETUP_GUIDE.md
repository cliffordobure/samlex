# 🔧 Cloudinary Setup Guide - Fix File Upload Issues

## 🚨 **Problem Identified**
Your file uploads are failing because the Cloudinary environment variables are set to placeholder values instead of actual Cloudinary credentials.

**Current Error:** `Unknown API key your_cloudinary_api_key`

## ✅ **Solution: Set Up Cloudinary**

### **Step 1: Create Cloudinary Account**
1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Click "Sign Up For Free"
3. Create your account (free tier includes 25GB storage, 25GB bandwidth/month)

### **Step 2: Get Your Credentials**
1. After signing up, you'll be taken to your dashboard
2. Look for the **"Product Environment Credentials"** section
3. Copy these three values:
   - **Cloud Name** (e.g., `my-cloud-name`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abcdefghijklmnopqrstuvwxyz123456`)

### **Step 3: Update Your Environment Variables**

#### **For Local Development:**
Update your `server/.env` file:
```bash
# Replace these placeholder values with your actual Cloudinary credentials
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

#### **For Production (Render.com):**
1. Go to your Render.com dashboard
2. Navigate to your server service
3. Go to "Environment" tab
4. Update these environment variables:
   - `CLOUDINARY_CLOUD_NAME` = your actual cloud name
   - `CLOUDINARY_API_KEY` = your actual API key  
   - `CLOUDINARY_API_SECRET` = your actual API secret

### **Step 4: Test the Setup**
Run the diagnostic script to verify everything is working:
```bash
cd server
node test_upload_diagnostics.js
```

You should see:
```
✅ Cloudinary connection successful!
✅ All systems working! Upload should be functional.
```

## 🔍 **Alternative: Quick Test**
If you want to test without setting up Cloudinary right now, you can temporarily disable file uploads by modifying the frontend code to skip file upload and just create cases without documents.

## 📋 **File Upload Features**
Once Cloudinary is set up, your application will support:
- ✅ **Document Types:** PDF, DOC, DOCX, XLS, XLSX, TXT, PPT, PPTX
- ✅ **Image Types:** JPEG, PNG, GIF
- ✅ **File Size Limits:** 10MB for documents, 5MB for images
- ✅ **Automatic Cloud Storage:** Files stored securely in Cloudinary
- ✅ **Direct URLs:** Files accessible via direct URLs

## 🚀 **After Setup**
1. Restart your server (both local and production)
2. Try creating a case with file uploads
3. Files should now upload successfully
4. You'll see the Cloudinary URLs in your case documents

## 💡 **Pro Tips**
- Cloudinary free tier is generous and should be sufficient for most use cases
- Files are automatically optimized and delivered via CDN
- You can manage uploaded files from the Cloudinary dashboard
- Consider setting up automatic cleanup of unused files for cost optimization

---

**Need Help?** If you're still having issues after following this guide, check:
1. ✅ Cloudinary credentials are correct
2. ✅ Environment variables are set in production
3. ✅ Server has been restarted after changes
4. ✅ Network connectivity to Cloudinary (should work from most locations)
