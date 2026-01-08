#!/bin/bash

# S3 Deployment Script for Samlex Frontend
# Usage: ./deploy-s3.sh

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Configuration (Update these values)
S3_BUCKET="samlex-frontend"
CLOUDFRONT_DISTRIBUTION_ID="YOUR_DISTRIBUTION_ID"  # Get from CloudFront console
AWS_REGION="us-east-1"  # Update to your region

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Step 1: Build
echo -e "${BLUE}📦 Building project...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo "❌ Error: dist folder not found. Build failed!"
    exit 1
fi

echo -e "${GREEN}✅ Build complete!${NC}"

# Step 2: Upload to S3
echo -e "${BLUE}☁️  Uploading to S3 bucket: ${S3_BUCKET}...${NC}"
aws s3 sync dist/ s3://${S3_BUCKET}/ --delete --region ${AWS_REGION}

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Upload complete!${NC}"
else
    echo "❌ Error: S3 upload failed!"
    exit 1
fi

# Step 3: Invalidate CloudFront cache
if [ "$CLOUDFRONT_DISTRIBUTION_ID" != "YOUR_DISTRIBUTION_ID" ]; then
    echo -e "${BLUE}🔄 Invalidating CloudFront cache...${NC}"
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id ${CLOUDFRONT_DISTRIBUTION_ID} \
        --paths "/*" \
        --query 'Invalidation.Id' \
        --output text)
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Cache invalidation created: ${INVALIDATION_ID}${NC}"
        echo "   (This may take 5-15 minutes to complete)"
    else
        echo "⚠️  Warning: Cache invalidation failed (deployment still successful)"
    fi
else
    echo "⚠️  Skipping cache invalidation (CLOUDFRONT_DISTRIBUTION_ID not set)"
fi

echo -e "${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo "Your frontend should be available at:"
echo "  CloudFront: https://YOUR_DISTRIBUTION_ID.cloudfront.net"
echo "  S3 Website: http://${S3_BUCKET}.s3-website-${AWS_REGION}.amazonaws.com"

