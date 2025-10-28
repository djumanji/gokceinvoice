#!/bin/bash

# AWS S3 Setup Helper Script
# This script helps you set up AWS S3 for the invoice application

echo "=============================================="
echo "AWS S3 Setup for Invoice Receipt Uploads"
echo "=============================================="
echo ""
echo "This script will guide you through setting up AWS S3."
echo ""

# Step 1: AWS Account Check
echo "STEP 1: Check AWS Account"
echo "-------------------------"
echo "Do you have an AWS account? (y/n)"
read -r has_aws

if [ "$has_aws" != "y" ]; then
    echo ""
    echo "Please create an AWS account at: https://aws.amazon.com/free/"
    echo "AWS Free Tier includes:"
    echo "  - 5 GB of storage"
    echo "  - 20,000 GET requests/month"
    echo "  - 2,000 PUT requests/month"
    echo "  - Valid for 12 months"
    echo ""
    echo "Would you like to continue after creating an account? (y/n)"
    read -r continue_after
    if [ "$continue_after" != "y" ]; then
        exit 0
    fi
fi

# Step ception>
echo ""
echo "STEP 2: Create S3 Bucket"
echo "------------------------"
echo "1. Go to https://console.aws.amazon.com/s3"
echo "2. Click 'Create bucket'"
echo "3. Configure your bucket:"
echo "   - Bucket name: (choose a unique name, e.g., invoice-app-receipts-12345)"
echo "   - Region: us-east-1 (or your preferred region)"
echo "   - Block Public Access: Leave defaults (more secure)"
echo "   - Encryption: Enable 'Server-side encryption'"
echo "4. Click 'Create bucket'"
echo ""
echo "Enter your S3 bucket name:"
read -r bucket_name
echo "Enter your AWS region (e.g., us-east-1):"
read -r aws_region

# Step 3: Create IAM User
echo ""
echo "STEP 3: Create IAM User"
echo "------------------------"
echo "1. Go to https://console.aws.amazon.com/iam"
echo "2. Click 'Users' in left sidebar"
echo "3. Click 'Create user'"
echo "4. Username: invoice-app-s3-user (or your choice)"
echo "5. Select 'Provide user access to the AWS Management Console' - NO"
echo "6. Click 'Next'"
echo "7. Click 'Create user'"
echo "8. Click on the newly created user"
echo "9. Go to 'Security credentials' tab"
echo "10. Click 'Create access key'"
echo "11. Select 'Application running outside AWS'"
echo "12. Click 'Next'"
echo "13. Add description: 'Invoice app S3 access'"
echo "14. Click 'Next'"
echo "15. Create user policy:"
echo ""
echo "Click 'Create user policy' and paste this JSON:"
echo "{"
echo "  \"Version\": \"2012-10-17\","
echo "  \"Statement\": ["
echo "    {"
echo "      \"Effect\": \"Allow\","
echo "      \"Action\": ["
echo "        \"s3:PutObject\","
echo "        \"s3:GetObject\","
echo "        \"s3:DeleteObject\""
echo "      ],"
echo "      \"Resource\": \"arn:aws:s3:::${bucket_name}/*\""
echo "    }"
echo "  ]"
echo "}"
echo ""
echo "16. Enter policy name: 'InvoiceAppS3Policy'"
echo "17. Click 'Create policy'"
echo "18. Attach the policy to your IAM user"
echo ""
echo "Press Enter when done..."
read -r

echo ""
echo "Enter your AWS Access Key ID:"
read -r access_key
echo "Enter your AWS Secret Access Key:"
read -r secret_key

# Step 4: Update .env file
echo ""
echo "STEP 4: Update Environment Variables"
echo "-------------------------------------"
echo "Updating your .env file..."

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
fi

# Add S3 configuration to .env
{
    echo ""
    echo "# ========================================"
    echo "# AWS S3 CONFIGURATION (FOR RECEIPT UPLOADS)"
    echo "# ========================================"
    echo ""
    echo "AWS_REGION=${aws_region}"
    echo "AWS_ACCESS_KEY_ID=${access_key}"
    echo "AWS_SECRET_ACCESS_KEY=${secret_key}"
    echo "AWS_S3_BUCKET_NAME=${bucket_name}"
    echo ""
} >> .env

echo ""
echo "✅ S3 configuration added to .env file"
echo ""
echo "IMPORTANT: Never commit your .env file to version control!"
echo ""
echo "Your AWS S3 configuration is now complete!"
echo ""
echo "To test the setup:"
echo "1. Start your development server: npm run dev"
echo "2. Navigate to the Expenses page"
echo "3. Create an expense with a receipt image"
echo ""
echo "For detailed documentation, see: S3_SETUP_GUIDE.md"


