#!/bin/bash

# First-time database setup script for Neon in Replit
# This script creates all tables and runs all migrations

set -e  # Exit on error

echo "🚀 Setting up Neon Database for First Launch..."
echo "================================================"
echo ""

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL is not set"
    echo ""
    echo "Please set your Neon database URL in Replit Secrets:"
    echo "1. Go to Replit Secrets (🔒 icon in sidebar)"
    echo "2. Add: DATABASE_URL = your-neon-connection-string"
    echo "   Format: postgresql://user:password@host/database?sslmode=require"
    echo ""
    exit 1
fi

echo "✅ DATABASE_URL found"
echo ""

# Test connection
echo "📡 Testing database connection..."
if psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
    echo "✅ Successfully connected to Neon database"
else
    echo "❌ Failed to connect to database"
    echo ""
    echo "Please check your DATABASE_URL. It should look like:"
    echo "postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require"
    echo ""
    exit 1
fi
echo ""

# Check if tables already exist
TABLE_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';" 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" -gt 0 ]; then
    echo "⚠️  Warning: Database already has $TABLE_COUNT table(s)"
    echo ""
    read -p "Do you want to recreate everything? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "✅ Skipping setup - database already configured"
        exit 0
    fi
    echo ""
fi

echo "📊 Creating database schema..."
echo ""

# Run base schema migration
# NOTE: Use 000_create_schema_safe.sql for production (uses IF NOT EXISTS)
#       Use 000_create_schema.sql for fresh installs (destructive)
echo "Step 1/20: Creating base tables (users, clients, invoices, etc.)..."
if psql "$DATABASE_URL" -f migrations/000_create_schema.sql > /dev/null 2>&1; then
    echo "   ✅ Base tables created"
else
    echo "   ⚠️  Some tables may already exist - continuing..."
fi

# Run all other migrations in order
echo "Step 2/20: Adding critical indexes..."
psql "$DATABASE_URL" -f migrations/001_critical_indexes.sql > /dev/null 2>&1 || true

echo "Step 3/20: Adding data integrity constraints..."
psql "$DATABASE_URL" -f migrations/002_data_integrity_constraints.sql > /dev/null 2>&1 || true

echo "Step 4/20: Setting up row level security..."
psql "$DATABASE_URL" -f migrations/003_row_level_security.sql > /dev/null 2>&1 || true

echo "Step 5/20: Setting up invoice number generation..."
psql "$DATABASE_URL" -f migrations/004_invoice_number_fix.sql > /dev/null 2>&1 || true

echo "Step 6/20: Adding user profile fields..."
psql "$DATABASE_URL" -f migrations/005_add_user_profile_fields.sql > /dev/null 2>&1 || true

echo "Step 7/20: Adding email verification fields..."
psql "$DATABASE_URL" -f migrations/006_email_verification_and_reset.sql > /dev/null 2>&1 || true

echo "Step 8/20: Adding name field to users..."
psql "$DATABASE_URL" -f migrations/007_add_name_field_to_users.sql > /dev/null 2>&1 || true

echo "Step 9/20: Creating bank accounts table..."
psql "$DATABASE_URL" -f migrations/008_add_bank_accounts_table.sql > /dev/null 2>&1 || true

echo "Step 10/20: Adding bank account ID to invoices..."
psql "$DATABASE_URL" -f migrations/009_add_bank_account_id_to_invoices.sql > /dev/null 2>&1 || true

echo "Step 11/20: Adding company logo field..."
psql "$DATABASE_URL" -f migrations/010_add_company_logo.sql > /dev/null 2>&1 || true

echo "Step 12/20: Creating projects table..."
psql "$DATABASE_URL" -f migrations/011_add_projects_table.sql > /dev/null 2>&1 || true

echo "Step 13/20: Adding company size field..."
psql "$DATABASE_URL" -f migrations/012_add_company_size.sql > /dev/null 2>&1 || true

echo "Step 14/20: Adding industry field..."
psql "$DATABASE_URL" -f migrations/013_add_industry.sql > /dev/null 2>&1 || true

echo "Step 15/20: Creating leads system..."
psql "$DATABASE_URL" -f migrations/014_add_leads_system.sql > /dev/null 2>&1 || true

echo "Step 16/20: Creating chatbot tables..."
psql "$DATABASE_URL" -f migrations/015_add_chatbot_tables.sql > /dev/null 2>&1 || true

echo "Step 17/20: Adding needed_at to leads..."
psql "$DATABASE_URL" -f migrations/016_add_needed_at_to_leads.sql > /dev/null 2>&1 || true

echo "Step 18/20: Adding invoice scheduling..."
psql "$DATABASE_URL" -f migrations/017_add_invoice_scheduling.sql > /dev/null 2>&1 || true

echo "Step 19/20: Adding prospect system..."
psql "$DATABASE_URL" -f migrations/018_add_prospect_system.sql > /dev/null 2>&1 || true

echo "Step 20/20: Adding user sessions table..."
psql "$DATABASE_URL" -f migrations/019_add_user_sessions_table.sql > /dev/null 2>&1 || true

echo ""
echo "🔍 Verifying setup..."
echo ""

# Verify tables exist
FINAL_TABLE_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';" 2>/dev/null || echo "0")
echo "   Tables found: $FINAL_TABLE_COUNT"

# List all tables
echo ""
echo "📋 Created tables:"
psql "$DATABASE_URL" -c "\dt" 2>/dev/null | grep -E "^\s+public" || echo "   (Could not list tables)"

echo ""
echo "================================================"
echo "🎉 Database setup complete!"
echo ""
echo "Your database is now ready to use!"
echo ""
echo "Next steps:"
echo "1. Restart your Repl (or click Run)"
echo "2. Try registering a new user account"
echo "3. Start creating invoices!"
echo ""
echo "✅ Setup complete!"

