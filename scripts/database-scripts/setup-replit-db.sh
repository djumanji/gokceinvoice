#!/bin/bash

# Replit Database Setup Script
# This script sets up the PostgreSQL database for the Invoice Management System

set -e  # Exit on any error

echo "🚀 Setting up Invoice Management System Database..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL is not set"
    echo "Please create a PostgreSQL database in Replit Tools → Database"
    exit 1
fi

echo "✅ DATABASE_URL found"
echo ""

# Test database connection
echo "📡 Testing database connection..."
if psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Failed to connect to database"
    exit 1
fi
echo ""

# Check if migrations have already been applied
echo "🔍 Checking migration status..."
if psql "$DATABASE_URL" -tAc "SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'invoice_sequences');" | grep -q 't'; then
    echo "⚠️  Migrations appear to be already applied"
    read -p "Do you want to re-run migrations? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "✅ Setup complete - migrations already applied"
        exit 0
    fi
fi
echo ""

# Apply critical indexes
echo "📊 Applying critical performance indexes..."
if psql "$DATABASE_URL" -f migrations/001_critical_indexes.sql > /dev/null 2>&1; then
    echo "✅ Critical indexes created (16 indexes)"
else
    echo "⚠️  Some indexes may already exist - continuing..."
fi
echo ""

# Fix invoice number race condition
echo "🔧 Setting up atomic invoice number generation..."
if psql "$DATABASE_URL" -f migrations/004_invoice_number_fix.sql > /dev/null 2>&1; then
    echo "✅ Invoice number sequence system installed"
else
    echo "❌ Failed to set up invoice number generation"
    exit 1
fi
echo ""

# Add user profile fields
echo "📊 Adding user profile fields..."
if psql "$DATABASE_URL" -f migrations/005_add_user_profile_fields.sql > /dev/null 2>&1; then
    echo "✅ User profile fields added"
else
    echo "⚠️  Profile fields may already exist - continuing..."
fi
echo ""

# Verify setup
echo "✔️  Verifying database setup..."

# Count tables
TABLE_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';")
echo "   Tables created: $TABLE_COUNT"

# Count indexes
INDEX_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%';")
echo "   Performance indexes: $INDEX_COUNT"

# Check if invoice_sequences exists
if psql "$DATABASE_URL" -tAc "SELECT EXISTS (SELECT FROM pg_tables WHERE tablename = 'invoice_sequences');" | grep -q 't'; then
    echo "   Invoice sequence system: ✅"
else
    echo "   Invoice sequence system: ❌"
    exit 1
fi

echo ""
echo "🎉 Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure SESSION_SECRET is set in Replit Secrets"
echo "2. Click the 'Run' button to start your application"
echo "3. Visit your Repl URL to access the app"
echo ""
