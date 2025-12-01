#!/bin/bash

# S3 Deployment Script for PersonalityMatch Frontend
#
# This script builds and deploys the React application to AWS S3
#
# Prerequisites:
# 1. AWS CLI installed and configured (aws configure)
# 2. S3 bucket created
# 3. Bucket configured for static website hosting
#
# Usage:
#   ./deploy-s3.sh <bucket-name>
#
# Example:
#   ./deploy-s3.sh my-personality-match-app

set -e  # Exit on error

BUCKET_NAME=$1

if [ -z "$BUCKET_NAME" ]; then
  echo "❌ Error: Bucket name required"
  echo "Usage: ./deploy-s3.sh <bucket-name>"
  exit 1
fi

echo "🚀 PersonalityMatch S3 Deployment"
echo "================================="
echo "Bucket: $BUCKET_NAME"
echo ""

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 2: Build production bundle
echo "🔨 Building production bundle..."
npm run build

# Step 3: Sync to S3
echo "☁️  Uploading to S3..."
aws s3 sync dist/ s3://$BUCKET_NAME/ --delete

# Step 4: Set correct content types
echo "🔧 Setting content types..."
aws s3 cp s3://$BUCKET_NAME/ s3://$BUCKET_NAME/ \
  --exclude "*" \
  --include "*.html" \
  --content-type "text/html" \
  --metadata-directive REPLACE \
  --recursive

aws s3 cp s3://$BUCKET_NAME/ s3://$BUCKET_NAME/ \
  --exclude "*" \
  --include "*.js" \
  --content-type "application/javascript" \
  --metadata-directive REPLACE \
  --recursive

aws s3 cp s3://$BUCKET_NAME/ s3://$BUCKET_NAME/ \
  --exclude "*" \
  --include "*.css" \
  --content-type "text/css" \
  --metadata-directive REPLACE \
  --recursive

# Step 5: Set cache control
echo "⚡ Setting cache control..."
aws s3 cp s3://$BUCKET_NAME/ s3://$BUCKET_NAME/ \
  --exclude "*" \
  --include "*.js" \
  --include "*.css" \
  --cache-control "max-age=31536000" \
  --metadata-directive REPLACE \
  --recursive

aws s3 cp s3://$BUCKET_NAME/ s3://$BUCKET_NAME/ \
  --exclude "*" \
  --include "*.html" \
  --cache-control "max-age=0, must-revalidate" \
  --metadata-directive REPLACE \
  --recursive

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🌐 Website URL:"
echo "   http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com"
echo ""
echo "   (Replace 'us-east-1' with your bucket region if different)"
echo ""
