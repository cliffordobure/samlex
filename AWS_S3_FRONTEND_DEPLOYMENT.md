# Deploy Frontend to AWS S3 + CloudFront

This guide will help you deploy your React frontend to AWS S3 and serve it through CloudFront for HTTPS support.

---

## Prerequisites

✅ AWS Account  
✅ AWS CLI installed (optional but recommended)  
✅ Backend running on EC2: `ec2-34-224-51-176.compute-1.amazonaws.com`

---

## Part 1: Build Your Frontend

1. **Navigate to client directory**:
   ```bash
   cd client
   ```

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

3. **Build for production**:
   ```bash
   npm run build
   ```

4. **Verify build output**:
   - Check that `dist/` folder was created
   - Should contain `index.html` and `assets/` folder

---

## Part 2: Create S3 Bucket

### Step 1: Create Bucket

1. **Go to AWS Console**: https://console.aws.amazon.com/s3/
2. **Click "Create bucket"**
3. **Configure bucket**:
   - **Bucket name**: `samlex-frontend` (or your preferred name)
     - Must be globally unique
     - Use lowercase, numbers, and hyphens only
   - **AWS Region**: Choose same region as your EC2 (e.g., `us-east-1`)
   - **Object Ownership**: ACLs disabled (recommended)
   - **Block Public Access**: **Uncheck "Block all public access"** (we need public access for website)
   - **Bucket Versioning**: Disable (optional)
   - **Default encryption**: Enable (recommended)
   - **Object Lock**: Disable
4. **Click "Create bucket"**

### Step 2: Enable Static Website Hosting

1. **Select your bucket** from the list
2. **Go to "Properties" tab**
3. **Scroll to "Static website hosting"**
4. **Click "Edit"**
5. **Enable static website hosting**:
   - **Static website hosting**: Enable
   - **Hosting type**: Host a static website
   - **Index document**: `index.html`
   - **Error document**: `index.html` (for React Router)
6. **Click "Save changes"**
7. **Note the "Bucket website endpoint"** URL (e.g., `http://samlex-frontend.s3-website-us-east-1.amazonaws.com`)

### Step 3: Configure Bucket Policy (Make it Public)

1. **Go to "Permissions" tab**
2. **Click "Bucket policy"**
3. **Click "Edit"**
4. **Add this policy** (replace `samlex-frontend` with your bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::samlex-frontend/*"
    }
  ]
}
```

5. **Click "Save changes"**

### Step 4: Upload Your Build Files

**Option A: Using AWS Console**

1. **Go to "Objects" tab** in your bucket
2. **Click "Upload"**
3. **Click "Add files"**
4. **Select ALL files from `client/dist/` folder**:
   - `index.html`
   - All files in `assets/` folder
5. **Click "Upload"**
6. **Wait for upload to complete**

**Option B: Using AWS CLI** (Faster)

1. **Install AWS CLI** (if not installed):
   ```bash
   # Windows (using installer)
   # Download from: https://aws.amazon.com/cli/
   
   # Or using pip
   pip install awscli
   ```

2. **Configure AWS CLI**:
   ```bash
   aws configure
   # Enter your AWS Access Key ID
   # Enter your AWS Secret Access Key
   # Enter default region (e.g., us-east-1)
   # Enter default output format (json)
   ```

3. **Upload files**:
   ```bash
   cd client
   aws s3 sync dist/ s3://samlex-frontend/ --delete
   ```
   - `--delete` removes files in S3 that aren't in your local dist folder

---

## Part 3: Set Up CloudFront (For HTTPS)

S3 static website hosting only provides HTTP. We need CloudFront for HTTPS.

### Step 1: Create CloudFront Distribution

1. **Go to CloudFront Console**: https://console.aws.amazon.com/cloudfront/
2. **Click "Create distribution"**
3. **Configure distribution**:

   **Origin settings**:
   - **Origin domain**: Select your S3 bucket (e.g., `samlex-frontend.s3.amazonaws.com`)
     - **Important**: Use the S3 bucket domain, NOT the website endpoint
   - **Origin path**: Leave empty
   - **Name**: Auto-filled
   - **Origin access**: Select "Origin access control settings (recommended)"
   - **Origin access control**: Click "Create control setting"
     - **Name**: `s3-cloudfront-access`
     - **Origin type**: S3
     - **Signing behavior**: Sign requests (recommended)
     - Click "Create"
   - **Back to distribution**: Select the control setting you just created
   - **Origin access policy**: Select "Yes, update the bucket policy"
     - This automatically updates your S3 bucket policy

   **Default cache behavior**:
   - **Viewer protocol policy**: Redirect HTTP to HTTPS
   - **Allowed HTTP methods**: GET, HEAD, OPTIONS
   - **Cache policy**: CachingOptimized (or CachingDisabled for development)
   - **Compress objects automatically**: Yes

   **Settings**:
   - **Price class**: Use all edge locations (best performance) or select cheaper option
   - **Alternate domain names (CNAMEs)**: Leave empty (or add custom domain later)
   - **SSL certificate**: Default CloudFront certificate (free)
   - **Default root object**: `index.html`
   - **Custom error responses**: 
     - Click "Add custom error response"
     - **HTTP error code**: 403
     - **Customize error response**: Yes
     - **Response page path**: `/index.html`
     - **HTTP response code**: 200
     - Click "Add"
     - Repeat for 404 error

4. **Click "Create distribution"**
5. **Wait for deployment** (15-20 minutes)
6. **Note your CloudFront domain** (e.g., `d1234abcd5678.cloudfront.net`)

### Step 2: Update S3 Bucket Policy (If Not Auto-Updated)

If CloudFront didn't auto-update your bucket policy:

1. **Go to S3 Console** → Your bucket → Permissions
2. **Get your CloudFront Origin Access Identity**:
   - Go to CloudFront → Your distribution → Origins tab
   - Click on your origin
   - Note the "Origin access control" ID
3. **Update bucket policy**:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::samlex-frontend/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
        }
      }
    }
  ]
}
```

Replace:
- `YOUR_ACCOUNT_ID`: Your AWS account ID
- `YOUR_DISTRIBUTION_ID`: Your CloudFront distribution ID

---

## Part 4: Update Frontend Configuration

### Step 1: Update API URLs

Your frontend code is already configured, but verify it points to your backend:

**Check `client/src/config/api.js`** - should have:
```javascript
return 'https://ec2-34-224-51-176.compute-1.amazonaws.com/api';
```

### Step 2: Update Vite Config for S3 (If Needed)

If you have absolute paths, update `client/vite.config.js`:

```javascript
export default defineConfig({
  base: '/',  // Use '/' for root, or '/subfolder/' if deploying to subfolder
  // ... rest of config
});
```

---

## Part 5: Update Backend CORS

Add your CloudFront domain to backend CORS:

1. **SSH into EC2**:
   ```bash
   ssh -i your-key.pem ec2-user@ec2-34-224-51-176.compute-1.amazonaws.com
   ```

2. **Edit `server/app.js`**:
   ```bash
   nano server/app.js
   ```

3. **Add CloudFront domain** to allowed origins:
   ```javascript
   const allowedOrigins = [
     "https://d1234abcd5678.cloudfront.net",  // Your CloudFront domain
     "https://samlex-client.vercel.app",
     "https://lawfirm-saas-client.vercel.app",
     "https://ec2-34-224-51-176.compute-1.amazonaws.com",
     "http://localhost:5001",
     "http://localhost:5002",
   ];
   ```

4. **Also update `server/server.js`** Socket.IO CORS:
   ```javascript
   origin: [
     "https://d1234abcd5678.cloudfront.net",  // Your CloudFront domain
     "https://samlex-client.vercel.app",
     "https://ec2-34-224-51-176.compute-1.amazonaws.com",
     "http://localhost:5001",
     "http://localhost:5002"
   ],
   ```

5. **Restart your server**:
   ```bash
   pm2 restart all
   # OR
   sudo systemctl restart your-app
   ```

---

## Part 6: Test Your Deployment

1. **Visit your CloudFront URL**:
   - Go to: `https://d1234abcd5678.cloudfront.net`
   - Should see your React app

2. **Open Browser Console** (F12):
   - Check for API configuration
   - Look for CORS errors
   - Verify API calls are working

3. **Test Login**:
   - Try logging in
   - Verify API connection
   - Check WebSocket connection

---

## Part 7: Set Up SSL for Backend (Required!)

Your frontend is now HTTPS (via CloudFront), so backend MUST be HTTPS too!

**Follow**: `CLOUDFLARE_SSL_SETUP_GUIDE.md` or `AMAZON_LINUX_QUICK_START.md`

---

## Part 8: Automated Deployment Script

Create a script to automate deployments:

**Create `client/deploy-s3.sh`**:

```bash
#!/bin/bash

# Build the project
echo "Building project..."
npm run build

# Upload to S3
echo "Uploading to S3..."
aws s3 sync dist/ s3://samlex-frontend/ --delete

# Invalidate CloudFront cache
echo "Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"

echo "Deployment complete!"
```

**Make it executable**:
```bash
chmod +x deploy-s3.sh
```

**Usage**:
```bash
./deploy-s3.sh
```

**Or create `client/deploy-s3.bat` for Windows**:

```batch
@echo off
echo Building project...
call npm run build

echo Uploading to S3...
aws s3 sync dist\ s3://samlex-frontend\ --delete

echo Invalidating CloudFront cache...
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"

echo Deployment complete!
pause
```

---

## Troubleshooting

### Issue: "403 Forbidden" when accessing S3 website

**Solution**:
- Check bucket policy allows public read access
- Verify "Block public access" is disabled
- Check static website hosting is enabled

### Issue: "404 Not Found" for routes

**Solution**:
- CloudFront error responses must return `index.html` for 403/404
- Check CloudFront custom error responses are configured
- Verify `index.html` is in root of S3 bucket

### Issue: "CORS Error"

**Solution**:
- Add CloudFront domain to backend CORS
- Verify backend CORS includes your CloudFront URL
- Check backend server is restarted

### Issue: "Mixed Content" Error

**Solution**:
- Backend MUST use HTTPS
- Set up SSL on backend (Cloudflare or self-signed)
- Update frontend URLs to use HTTPS backend

### Issue: Changes not showing after upload

**Solution**:
- Invalidate CloudFront cache:
  ```bash
  aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
  ```
- Or wait for cache to expire (default 24 hours)

---

## Cost Estimation

**S3 Storage**:
- First 50 TB: $0.023 per GB/month
- For a typical React app (~5-10 MB): ~$0.0001/month

**CloudFront**:
- First 1 TB data transfer: Free (within AWS free tier)
- After free tier: $0.085 per GB (first 10 TB)
- Typical small app: ~$0-5/month

**Total**: Very low cost, often within free tier for small apps

---

## Optional: Custom Domain

1. **Go to CloudFront** → Your distribution → Settings
2. **Click "Edit"**
3. **Add alternate domain name (CNAME)**: `app.yourdomain.com`
4. **Request SSL certificate**:
   - Click "Request certificate"
   - Add domain name
   - Validate via DNS or email
5. **Select the certificate** in CloudFront
6. **Update DNS**: Add CNAME record pointing to CloudFront domain
7. **Wait for propagation** (5-30 minutes)

---

## Quick Checklist

- [ ] S3 bucket created
- [ ] Static website hosting enabled
- [ ] Bucket policy allows public read
- [ ] Build files uploaded to S3
- [ ] CloudFront distribution created
- [ ] CloudFront configured for HTTPS
- [ ] Custom error responses set (403 → index.html, 404 → index.html)
- [ ] Backend CORS updated with CloudFront domain
- [ ] Backend server restarted
- [ ] SSL set up on backend
- [ ] Tested frontend access
- [ ] Tested API connection
- [ ] Deployment script created (optional)

---

## Summary

1. **Build frontend**: `npm run build`
2. **Create S3 bucket**: Enable static website hosting
3. **Upload files**: Upload `dist/` folder to S3
4. **Create CloudFront**: For HTTPS support
5. **Update backend CORS**: Add CloudFront domain
6. **Set up backend SSL**: Required for HTTPS frontend
7. **Test**: Verify everything works

**Total time**: ~30-45 minutes  
**Cost**: Very low (often free tier)

---

## Next Steps

1. **Set up automated deployment** (CI/CD)
2. **Configure custom domain** (optional)
3. **Set up monitoring** (CloudWatch)
4. **Optimize caching** (CloudFront cache policies)

