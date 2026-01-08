@echo off
REM S3 Deployment Script for Windows
REM Usage: deploy-s3.bat

echo 🚀 Starting deployment...

REM Configuration (Update these values)
set S3_BUCKET=samlex-frontend
set CLOUDFRONT_DISTRIBUTION_ID=YOUR_DISTRIBUTION_ID
set AWS_REGION=us-east-1

REM Step 1: Build
echo 📦 Building project...
call npm run build

if not exist "dist" (
    echo ❌ Error: dist folder not found. Build failed!
    pause
    exit /b 1
)

echo ✅ Build complete!

REM Step 2: Upload to S3
echo ☁️  Uploading to S3 bucket: %S3_BUCKET%...
aws s3 sync dist\ s3://%S3_BUCKET%\ --delete --region %AWS_REGION%

if %errorlevel% neq 0 (
    echo ❌ Error: S3 upload failed!
    pause
    exit /b 1
)

echo ✅ Upload complete!

REM Step 3: Invalidate CloudFront cache
if not "%CLOUDFRONT_DISTRIBUTION_ID%"=="YOUR_DISTRIBUTION_ID" (
    echo 🔄 Invalidating CloudFront cache...
    aws cloudfront create-invalidation --distribution-id %CLOUDFRONT_DISTRIBUTION_ID% --paths "/*"
    
    if %errorlevel% equ 0 (
        echo ✅ Cache invalidation created
        echo    (This may take 5-15 minutes to complete)
    ) else (
        echo ⚠️  Warning: Cache invalidation failed (deployment still successful)
    )
) else (
    echo ⚠️  Skipping cache invalidation (CLOUDFRONT_DISTRIBUTION_ID not set)
)

echo.
echo 🎉 Deployment complete!
echo.
echo Your frontend should be available at:
echo   CloudFront: https://YOUR_DISTRIBUTION_ID.cloudfront.net
echo   S3 Website: http://%S3_BUCKET%.s3-website-%AWS_REGION%.amazonaws.com
echo.
pause

