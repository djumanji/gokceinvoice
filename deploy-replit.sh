#!/bin/bash
# Quick deployment script for Replit
# Usage: bash deploy-replit.sh

set -e

echo "🚀 Starting Replit Deployment..."
echo ""

# Step 1: Pull latest
echo "📥 Step 1: Pulling latest from main..."
git pull origin main || echo "⚠️  Git pull failed or already up to date"
echo ""

# Step 2: Install dependencies if needed
echo "📦 Step 2: Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
else
    echo "✅ Dependencies already installed"
fi
echo ""

# Step 3: Check DATABASE_URL
echo "🔍 Step 3: Checking environment..."
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL is not set!"
    echo "Please set it in Replit Secrets (🔒 icon)"
    exit 1
fi
echo "✅ DATABASE_URL found"
echo ""

# Step 4: Install psql if needed
if ! command -v psql &> /dev/null; then
    echo "📦 Installing PostgreSQL client..."
    apt-get update && apt-get install -y postgresql-client || echo "⚠️  Could not install psql - you may need to run migrations manually"
fi

# Step 5: Test database connection
echo "🔌 Step 4: Testing database connection..."
if psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ ERROR: Cannot connect to database!"
    echo "Please check your DATABASE_URL"
    exit 1
fi
echo ""

# Step 6: Run migrations
echo "📊 Step 5: Running database migrations..."
bash migrations/run-all.sh
echo ""

# Step 7: Build
echo "🔨 Step 6: Building application..."
npm run build
echo ""

# Step 8: Verify build
if [ ! -f "dist/index.js" ]; then
    echo "❌ ERROR: Build failed - dist/index.js not found"
    exit 1
fi
echo "✅ Build successful"
echo ""

# Step 9: Check SESSION_SECRET
if [ -z "$SESSION_SECRET" ]; then
    echo "⚠️  WARNING: SESSION_SECRET is not set!"
    echo "Generate one with: openssl rand -base64 32"
    echo "Set it in Replit Secrets"
else
    echo "✅ SESSION_SECRET found"
fi
echo ""

echo "🎉 Deployment preparation complete!"
echo ""
echo "Next steps:"
echo "1. Ensure SESSION_SECRET is set in Replit Secrets"
echo "2. Click 'Run' button or run: npm start"
echo "3. Your app should be live!"
echo ""

