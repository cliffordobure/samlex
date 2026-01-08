# S3 Deployment Quick Start

## Quick Steps Summary

### 1. Build Frontend (2 minutes)
```bash
cd client
npm install
npm run build
```

### 2. Create S3 Bucket (5 minutes)

1. **AWS Console** → S3 → Create bucket
   - Name: `samlex-frontend` (or your choice)
   - Region: Same as EC2
   - **Uncheck "Block all public access"**

2. **Enable Static Website Hosting**:
   - Properties → Static website hosting → Enable
   - Index document: `index.html`
   - Error document: `index.html`

3. **Set Bucket Policy** (Permissions tab):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::samlex-frontend/*"
    }
  ]
}
```

### 3. Upload Files (2 minutes)

**Option A: AWS Console**
- Objects tab → Upload → Select all files from `client/dist/`

**Option B: AWS CLI** (Faster)
```bash
aws s3 sync client/dist/ s3://samlex-frontend/ --delete
```

### 4. Create CloudFront Distribution (10 minutes)

1. **CloudFront Console** → Create distribution
2. **Origin**: Select your S3 bucket
3. **Viewer protocol**: Redirect HTTP to HTTPS
4. **Default root object**: `index.html`
5. **Custom error responses**:
   - 403 → `/index.html` (200)
   - 404 → `/index.html` (200)
6. **Create** and wait 15-20 minutes

### 5. Update Backend CORS (5 minutes)

SSH into EC2 and add CloudFront domain:
```javascript
// server/app.js
const allowedOrigins = [
  "https://YOUR_CLOUDFRONT_DOMAIN.cloudfront.net",
  // ... other origins
];
```

### 6. Set Up Backend SSL (Required!)

Follow: `CLOUDFLARE_SSL_SETUP_GUIDE.md`

---

## Deployment Script

**Create `client/deploy-s3.sh`**:
```bash
#!/bin/bash
npm run build
aws s3 sync dist/ s3://samlex-frontend/ --delete
aws cloudfront create-invalidation --distribution-id YOUR_ID --paths "/*"
echo "Deployed!"
```

**Usage**:
```bash
chmod +x deploy-s3.sh
./deploy-s3.sh
```

---

## Important Notes

1. **Backend MUST have SSL** (frontend is HTTPS via CloudFront)
2. **Update CORS** with CloudFront domain
3. **Invalidate CloudFront cache** after updates
4. **Custom error responses** needed for React Router

---

## Cost

- **S3**: ~$0.0001/month (very cheap)
- **CloudFront**: Free tier (1 TB/month), then ~$0.085/GB
- **Total**: Usually free or <$5/month for small apps

---

## Full Guide

See `AWS_S3_FRONTEND_DEPLOYMENT.md` for detailed instructions.

