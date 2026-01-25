# 🚀 AWS S3 Quick Start Guide

## ✅ What's Been Implemented

Your application now supports **AWS S3** for file storage! The code has been updated to work with both S3 and Cloudinary (you can switch between them).

## 📦 Installation

Run this command in your `server` directory:

```bash
cd server
npm install
```

This will install the AWS SDK packages:
- `@aws-sdk/client-s3`
- `@aws-sdk/s3-request-presigner`

## 🔧 Configuration Steps

### Step 1: Create S3 Bucket (from AWS Console)

1. **Go to S3** in AWS Console (search "S3" in the top search bar)
2. Click **"Create bucket"**
3. **Bucket name**: Choose a unique name (e.g., `law-firm-saas-files`)
4. **Region**: Select your region (e.g., `us-east-1`)
5. **Uncheck** "Block all public access" (or keep it checked and use signed URLs)
6. **Enable** default encryption (SSE-S3)
7. Click **"Create bucket"**

### Step 2: Configure CORS

1. Click on your bucket name
2. Go to **"Permissions"** tab
3. Scroll to **"Cross-origin resource sharing (CORS)"**
4. Click **"Edit"** and paste:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "https://samlex-client.vercel.app",
      "https://lawfirm-saas-client.vercel.app",
      "http://localhost:5001",
      "http://localhost:5002",
      "http://localhost:3000"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

5. Click **"Save changes"**

### Step 3: Create IAM User

1. Go to **IAM** in AWS Console
2. Click **"Users"** → **"Create user"**
3. **User name**: `s3-upload-user`
4. Click **"Next"**
5. Select **"Attach policies directly"**
6. Search and select: **"AmazonS3FullAccess"** (or create custom policy - see main guide)
7. Click **"Create user"**
8. Go to **"Security credentials"** tab
9. Click **"Create access key"**
10. Select **"Application running outside AWS"**
11. **Copy both**:
    - Access Key ID (starts with `AKIA...`)
    - Secret Access Key (click "Show" - you can only see this once!)

### Step 4: Add Environment Variables

Add these to your `.env` file in the `server` directory:

```env
# Storage Provider Selection
STORAGE_PROVIDER=s3

# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_S3_BUCKET_NAME=your-bucket-name-here
AWS_S3_FOLDER_PREFIX=law-firm-files
```

**Replace:**
- `us-east-1` with your bucket's region
- `your_access_key_id_here` with your Access Key ID
- `your_secret_access_key_here` with your Secret Access Key
- `your-bucket-name-here` with your actual bucket name

## 🧪 Testing

1. **Start your server**:
   ```bash
   cd server
   npm run dev
   ```

2. **Test the upload endpoint**:
   ```bash
   curl -X POST http://localhost:5000/api/upload/health
   ```
   
   Should return:
   ```json
   {
     "success": true,
     "message": "Upload service is running",
     "storageProvider": "s3",
     "storageConfigured": true,
     ...
   }
   ```

3. **Upload a file** through your frontend or API

4. **Check S3 bucket**: Go to your S3 bucket in AWS Console and verify the file was uploaded

## 📁 File Organization

Files will be stored in S3 like this:
```
your-bucket-name/
└── law-firm-files/
    ├── documents/
    │   └── [unique-id].pdf
    ├── profiles/
    │   └── [unique-id].jpg
    └── logos/
        └── [unique-id].png
```

## 🔄 Switching Back to Cloudinary

If you want to use Cloudinary instead, just change:

```env
STORAGE_PROVIDER=cloudinary
```

And add your Cloudinary credentials. The code automatically handles both!

## 📚 Full Documentation

See `AWS_S3_SETUP_GUIDE.md` for detailed instructions, security best practices, and troubleshooting.

## ✅ What Works Now

- ✅ File uploads (documents, images, videos)
- ✅ Profile image uploads
- ✅ Logo uploads
- ✅ File deletion
- ✅ Automatic file organization by folder
- ✅ Support for both S3 and Cloudinary

## 🆘 Troubleshooting

**Error: "Access Denied"**
- Check IAM user permissions
- Verify access keys are correct

**Error: "Bucket not found"**
- Verify bucket name matches exactly
- Check AWS region matches

**CORS errors**
- Verify CORS configuration in bucket settings
- Check your frontend URL is in AllowedOrigins

## 💰 Cost Estimate

S3 pricing is very affordable:
- **Storage**: ~$0.023 per GB/month
- **PUT requests**: ~$0.005 per 1,000 requests
- **GET requests**: ~$0.0004 per 1,000 requests

For a typical law firm with 100GB storage and 10,000 uploads/month:
- Storage: ~$2.30/month
- Uploads: ~$0.05/month
- **Total: ~$2.35/month** 🎉
