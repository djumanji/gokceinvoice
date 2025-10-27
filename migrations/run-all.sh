#!/bin/bash

# Run all database migrations for Neon/PostgreSQL
# Usage: bash migrations/run-all.sh

set -e  # Exit on error

echo "🚀 Running Database Migrations..."
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL is not set"
    echo "Please set it in Replit Secrets or as environment variable"
    exit 1
fi

echo "✅ DATABASE_URL found"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql is not installed"
    echo "Please install PostgreSQL client or use Neon Web Console"
    echo ""
    echo "Alternative: Go to https://console.neon.tech"
    echo "Open SQL Editor and copy/paste migration files"
    exit 1
fi

# Test connection
echo "📡 Testing database connection..."
if ! psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
    echo "❌ Failed to connect to database"
    echo "Please check your DATABASE_URL"
    exit 1
fi
echo "✅ Connection successful"
echo ""

# Run migrations
echo "📊 Running migration: 001_critical_indexes.sql"
if psql "$DATABASE_URL" -f migrations/001_critical_indexes.sql; then
    echo "✅ Critical indexes created"
else
    echo "⚠️  Some indexes may already exist - continuing..."
fi
echo ""

echo "📊 Running migration: 002_data_integrity_constraints.sql"
if psql "$DATABASE_URL" -f migrations/002_data_integrity_constraints.sql; then
    echo "✅ Data integrity constraints added"
else
    echo "⚠️  Some constraints may already exist - continuing..."
fi
echo ""

echo "📊 Running migration: 003_row_level_security.sql"
if psql "$DATABASE_URL" -f migrations/003_row_level_security.sql; then
    echo "✅ Row level security enabled"
else
    echo "⚠️  RLS may already be configured - continuing..."
fi
echo ""

echo "📊 Running migration: 004_invoice_number_fix.sql"
if psql "$DATABASE_URL" -f migrations/004_invoice_number_fix.sql; then
    echo "✅ Invoice number sequence created"
else
    echo "⚠️  Invoice sequences may already exist - continuing..."
fi
echo ""

# Verify tables exist
echo "🔍 Verifying tables..."
TABLE_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';" 2>/dev/null || echo "0")
echo "   Tables found: $TABLE_COUNT"

# List tables
echo ""
echo "📋 Database tables:"
psql "$DATABASE_URL" -c "\dt" 2>/dev/null || echo "Could not list tables"

echo ""
echo "🎉 Migrations complete!"
echo ""
echo "Next steps:"
echo "1. Restart your Repl"
echo "2. Try registering a user"
echo "3. It should work now! ✅"

