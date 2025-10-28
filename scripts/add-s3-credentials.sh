#!/bin/bash

# Add S3 Credentials to .env file

echo "=============================================="
echo "Adding AWS S3 Credentials to .env"
echo "=============================================="
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
fi

echo "Please enter your AWS configuration:"
echo ""

read -p "AWS Region (e.g., us-east-1): " aws_region
read -p "AWS Access Key ID: " access_key
read -p "AWS Secret Access Key: " secret_key
read -p "S3 Bucket Name: " bucket_name

echo ""
echo "Adding to .env file..."

# Check if AWS config already exists
if grep -q "AWS_S3_BUCKET_NAME" .env; then
    echo "⚠️  AWS configuration already exists in .env"
    read -p "Do you want to overwrite it? (y/n): " overwrite
    if [ "$overwrite" != "y" ]; then
        echo "Cancelled."
        exit 0
    fi
    # Remove old AWS config
    sed -i.bak '/^AWS_/d' .env
fi

# Append new config
cat >> .env << EOF

# ========================================
# AWS S3 CONFIGURATION (FOR RECEIPT UPLOADS)
# ========================================

AWS_REGION=${aws_region}
AWS_ACCESS_KEY_ID=${access_key}
AWS_SECRET_ACCESS_KEY=${secret_key}
AWS_S3_BUCKET_NAME=${bucket_name}
EOF

echo ""
echo "✅ AWS S3 configuration added to .env file!"
echo ""
echo "Next steps:"
echo "1. Restart your development server: npm run dev"
echo "2. Go to the Expenses page"
echo "3. Create an expense and upload a receipt"
echo ""
echo "IMPORTANT: Never commit .env to version control!"

