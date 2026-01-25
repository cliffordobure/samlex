# 🚀 AWS S3 Setup Guide for Law Firm SaaS

Complete guide to set up AWS S3 for storing files, videos, and all media for your application.

## 📋 Table of Contents
1. [Creating S3 Bucket](#step-1-creating-s3-bucket)
2. [Setting Up IAM User](#step-2-setting-up-iam-user)
3. [Configuring Bucket Permissions](#step-3-configuring-bucket-permissions)
4. [Installing Dependencies](#step-4-installing-dependencies)
5. [Environment Variables](#step-5-environment-variables)
6. [Testing the Setup](#step-6-testing-the-setup)

---

## Step 1: Creating S3 Bucket

### 1.1 Navigate to S3 Service
1. From the AWS Console home page (as shown in your screenshot), **click on "S3"** in the "Recently visited" section, or
2. **Type "S3"** in the search bar at the top and select **"S3"** from the results

### 1.2 Create a New Bucket
1. Click the **"Create bucket"** button (orange button, top right)
2. **Bucket name**: Enter a unique name (e.g., `law-firm-saas-files` or `your-company-law-files`)
   - ⚠️ Bucket names must be globally unique across all AWS accounts
   - Use lowercase letters, numbers, and hyphens only
   - Example: `law-firm-saas-production-files`

3. **AWS Region**: Select your region (e.g., `us-east-1` - US East (N. Virginia))
   - Choose the region closest to your users for better performance

4. **Object Ownership**: 
   - Select **"ACLs disabled (recommended)"** or **"ACLs enabled"**
   - For simplicity, choose **"ACLs disabled"**

5. **Block Public Access settings**:
   - **Uncheck** "Block all public access" if you want public file access
   - **OR** Keep it checked if files should only be accessed via signed URLs (recommended for security)
   - For this guide, we'll use **signed URLs** (keep public access blocked)

6. **Bucket Versioning**: 
   - Enable if you want to keep file versions (optional, can enable later)

7. **Default encryption**:
   - **Enable** encryption
   - Choose **"Amazon S3 managed keys (SSE-S3)"** (simplest option)

8. **Advanced settings**: Leave defaults for now

9. Click **"Create bucket"**

---

## Step 2: Setting Up IAM User

### 2.1 Create IAM User
1. From AWS Console, search for **"IAM"** in the search bar
2. Click **"Users"** in the left sidebar
3. Click **"Create user"** button
4. **User name**: Enter `s3-upload-user` (or any name you prefer)
5. Click **"Next"**

### 2.2 Attach Permissions Policy
1. Select **"Attach policies directly"**
2. Search for and select: **"AmazonS3FullAccess"** (or create a custom policy with limited permissions - see below)
3. Click **"Next"**
4. Review and click **"Create user"**

### 2.3 Create Access Keys
1. Click on the newly created user
2. Go to **"Security credentials"** tab
3. Scroll down to **"Access keys"** section
4. Click **"Create access key"**
5. Select **"Application running outside AWS"**
6. Click **"Next"**
7. Add description (optional): `Law Firm SaaS Application`
8. Click **"Create access key"**
9. **⚠️ IMPORTANT**: Copy both:
   - **Access Key ID** (starts with `AKIA...`)
   - **Secret Access Key** (click "Show" to reveal - you can only see this once!)
10. Save these securely - you'll need them for environment variables

### 2.4 (Optional) Create Custom Policy for Better Security
Instead of full S3 access, create a custom policy:

1. Go to **IAM** → **Policies** → **"Create policy"**
2. Click **"JSON"** tab
3. Paste this policy (replace `YOUR-BUCKET-NAME` with your actual bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::YOUR-BUCKET-NAME",
        "arn:aws:s3:::YOUR-BUCKET-NAME/*"
      ]
    }
  ]
}
```

4. Click **"Next"**, name it `S3UploadPolicy`, and create
5. Attach this policy to your IAM user instead of `AmazonS3FullAccess`

---

## Step 3: Configuring Bucket Permissions

### 3.1 Enable CORS (Required for Browser Uploads)
1. Go back to your S3 bucket
2. Click on your bucket name
3. Go to **"Permissions"** tab
4. Scroll down to **"Cross-origin resource sharing (CORS)"**
5. Click **"Edit"**
6. Paste this configuration:

```json
[
  {
    "AllowedHeaders": [
      "*"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD"
    ],
    "AllowedOrigins": [
      "https://samlex-client.vercel.app",
      "https://lawfirm-saas-client.vercel.app",
      "http://localhost:5001",
      "http://localhost:5002",
      "http://localhost:3000"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

7. Click **"Save changes"**

### 3.2 Bucket Policy (Optional - for additional security)
1. Still in **"Permissions"** tab
2. Scroll to **"Bucket policy"**
3. Click **"Edit"**
4. Add this policy (replace `YOUR-BUCKET-NAME` and `YOUR-IAM-USER-ARN`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowIAMUserAccess",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR-ACCOUNT-ID:user/YOUR-IAM-USER-NAME"
      },
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::YOUR-BUCKET-NAME/*"
    }
  ]
}
```

---

## Step 4: Installing Dependencies

Run this command in your `server` directory:

```bash
cd server
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

---

## Step 5: Environment Variables

Add these to your `.env` file in the `server` directory:

```env
# AWS S3 Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id_here
AWS_SECRET_ACCESS_KEY=your_secret_access_key_here
AWS_S3_BUCKET_NAME=your-bucket-name-here

# Optional: File upload settings
AWS_S3_FOLDER_PREFIX=law-firm-files
MAX_FILE_SIZE=10485760  # 10MB in bytes
```

**Replace:**
- `us-east-1` with your bucket's region
- `your_access_key_id_here` with your Access Key ID from Step 2.3
- `your_secret_access_key_here` with your Secret Access Key from Step 2.3
- `your-bucket-name-here` with your actual bucket name

---

## Step 6: Testing the Setup

After implementing the code changes (see implementation guide), test your setup:

1. **Start your server**:
   ```bash
   cd server
   npm run dev
   ```

2. **Test upload endpoint**:
   ```bash
   curl -X POST http://localhost:5000/api/upload \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -F "file=@test-file.pdf"
   ```

3. **Check S3 bucket**: Go to your S3 bucket in AWS Console and verify the file was uploaded

---

## 📁 Folder Structure in S3

Files will be organized like this:
```
your-bucket-name/
├── documents/
│   ├── case-123-document.pdf
│   └── case-456-contract.docx
├── profiles/
│   ├── user-789-profile.jpg
│   └── user-012-avatar.png
├── logos/
│   └── law-firm-logo.png
└── general/
    └── misc-file.pdf
```

---

## 🔒 Security Best Practices

1. ✅ **Never commit** `.env` file to git
2. ✅ **Use IAM roles** instead of access keys when running on EC2
3. ✅ **Rotate access keys** regularly (every 90 days)
4. ✅ **Enable MFA** on your AWS root account
5. ✅ **Use signed URLs** for private file access
6. ✅ **Set up CloudWatch** alerts for unusual S3 activity
7. ✅ **Enable S3 bucket versioning** for important files
8. ✅ **Set up lifecycle policies** to move old files to cheaper storage

---

## 💰 Cost Optimization

- **S3 Standard**: For frequently accessed files
- **S3 Intelligent-Tiering**: Automatically moves files based on access patterns
- **S3 Glacier**: For archival files (cheaper, slower retrieval)
- **Lifecycle policies**: Automatically transition files to cheaper storage after X days

---

## 🆘 Troubleshooting

### Error: "Access Denied"
- Check IAM user permissions
- Verify bucket policy allows your IAM user
- Ensure access keys are correct

### Error: "CORS policy"
- Verify CORS configuration in bucket settings
- Check that your frontend URL is in AllowedOrigins

### Error: "Bucket not found"
- Verify bucket name is correct
- Check AWS region matches

### Files not appearing in bucket
- Check CloudWatch logs for errors
- Verify file size is within limits
- Check network connectivity

---

## 📚 Additional Resources

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS SDK for JavaScript v3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/)
- [S3 Pricing Calculator](https://calculator.aws/#/createCalculator/S3)

---

## ✅ Next Steps

After completing this setup:
1. ✅ Code implementation (see separate implementation guide)
2. ✅ Test file uploads
3. ✅ Migrate existing Cloudinary files (if needed)
4. ✅ Update frontend to use new S3 URLs
5. ✅ Monitor costs in AWS Billing Dashboard
