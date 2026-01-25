# 📋 AWS S3 Implementation Checklist

Use this checklist to ensure everything is set up correctly:

## AWS Console Setup

- [ ] S3 bucket created with unique name
- [ ] Bucket region selected (e.g., us-east-1)
- [ ] CORS configuration added to bucket
- [ ] IAM user created for S3 access
- [ ] IAM user has S3 permissions (AmazonS3FullAccess or custom policy)
- [ ] Access Key ID copied
- [ ] Secret Access Key copied and saved securely

## Code Setup

- [ ] Dependencies installed (`npm install` in server directory)
- [ ] Environment variables added to `.env` file:
  - [ ] `STORAGE_PROVIDER=s3`
  - [ ] `AWS_REGION=us-east-1` (or your region)
  - [ ] `AWS_ACCESS_KEY_ID=your_key`
  - [ ] `AWS_SECRET_ACCESS_KEY=your_secret`
  - [ ] `AWS_S3_BUCKET_NAME=your-bucket-name`
  - [ ] `AWS_S3_FOLDER_PREFIX=law-firm-files` (optional)

## Testing

- [ ] Server starts without errors
- [ ] `/api/upload/health` endpoint returns success
- [ ] Test file upload works
- [ ] File appears in S3 bucket
- [ ] File URL is accessible
- [ ] File deletion works

## Security

- [ ] `.env` file is in `.gitignore`
- [ ] Access keys are not committed to git
- [ ] IAM user has minimal required permissions
- [ ] Bucket policy configured (optional but recommended)
- [ ] CORS configured correctly

## Production Deployment

- [ ] Environment variables set in production environment
- [ ] S3 bucket created in production AWS account
- [ ] IAM user created in production AWS account
- [ ] CORS includes production frontend URLs
- [ ] Test uploads in production environment

## Migration (if switching from Cloudinary)

- [ ] Existing files backed up
- [ ] Migration plan documented
- [ ] Test migration with sample files
- [ ] Update frontend URLs if needed
- [ ] Monitor for any issues

## Cost Monitoring

- [ ] AWS Billing alerts set up
- [ ] S3 storage costs monitored
- [ ] Request costs monitored
- [ ] Lifecycle policies considered (optional)
