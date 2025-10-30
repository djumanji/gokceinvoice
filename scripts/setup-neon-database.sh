#!/bin/bash

# Setup Neon Database Script
# Securely sets up your Neon PostgreSQL database with migrations

set -e  # Exit on any error

echo "🚀 Setting up Neon PostgreSQL Database"
echo "======================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if DATABASE_URL is set
check_env_vars() {
    echo -e "${BLUE}Checking environment variables...${NC}"

    if [ -z "$DATABASE_URL" ]; then
        echo -e "${RED}❌ DATABASE_URL is not set${NC}"
        echo ""
        echo "To set your DATABASE_URL securely:"
        echo ""
        echo "1. In Replit: Go to Tools → Secrets"
        echo "2. Add a new secret:"
        echo "   Name: DATABASE_URL"
        echo "   Value: YOUR_NEON_DATABASE_URL_HERE"
        echo ""
        echo "OR temporarily set it for this session:"
        echo "   export DATABASE_URL='YOUR_NEON_DATABASE_URL_HERE'"
        echo ""
        exit 1
    fi

    echo -e "${GREEN}✅ DATABASE_URL is set${NC}"
    echo ""
}

# Test database connection
test_connection() {
    echo -e "${BLUE}Testing Neon database connection...${NC}"

    if psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
    else
        echo -e "${RED}❌ Failed to connect to database${NC}"
        echo "Please check your DATABASE_URL and ensure the Neon database is accessible"
        exit 1
    fi

    echo ""
}

# Check if migrations have already been applied
check_existing_data() {
    echo -e "${BLUE}Checking for existing data...${NC}"

    if psql "$DATABASE_URL" -tAc "SELECT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users');" | grep -q 't'; then
        echo -e "${YELLOW}⚠️  Database appears to have existing tables${NC}"
        read -p "Do you want to continue and potentially overwrite data? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            echo "Setup cancelled."
            exit 0
        fi
    else
        echo -e "${GREEN}✅ Database appears to be empty${NC}"
    fi

    echo ""
}

# Run migrations
run_migrations() {
    echo -e "${BLUE}Running database migrations...${NC}"

    # Check if migrations directory exists
    if [ ! -d "migrations" ]; then
        echo -e "${RED}❌ Migrations directory not found${NC}"
        exit 1
    fi

    # Run the migration script
    if bash migrations/run-all.sh; then
        echo -e "${GREEN}✅ All migrations applied successfully${NC}"
    else
        echo -e "${RED}❌ Migration failed${NC}"
        exit 1
    fi

    echo ""
}

# Verify setup
verify_setup() {
    echo -e "${BLUE}Verifying database setup...${NC}"

    # Count tables
    TABLE_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';")
    echo "Tables created: $TABLE_COUNT"

    # Count indexes
    INDEX_COUNT=$(psql "$DATABASE_URL" -tAc "SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%';")
    echo "Performance indexes: $INDEX_COUNT"

    # Check key tables exist
    KEY_TABLES=("users" "invoices" "clients" "expenses" "bank_accounts" "invoice_sequences")

    echo ""
    echo "Key tables verification:"
    for table in "${KEY_TABLES[@]}"; do
        if psql "$DATABASE_URL" -tAc "SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = '$table');" | grep -q 't'; then
            echo -e "  ✅ $table"
        else
            echo -e "  ❌ $table"
        fi
    done

    echo ""
}

# Show connection info
show_connection_info() {
    echo -e "${BLUE}Database Connection Summary:${NC}"
    # Extract info from DATABASE_URL (basic parsing)
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's|.*@\([^/]*\)/.*|\1|p')
    DB_NAME=$(echo "$DATABASE_URL" | sed -n 's|.*\/\([^?]*\).*|\1|p')
    echo "Host: $DB_HOST"
    echo "Database: $DB_NAME"
    echo "SSL: Enabled (required for Neon)"
    echo "Status: ✅ Connected and configured"
    echo ""
}

# Main setup process
main() {
    echo "This will set up your Neon PostgreSQL database for the Invoice Management System."
    echo -e "${YELLOW}⚠️  Make sure your DATABASE_URL is set securely in Replit Secrets${NC}"
    echo ""

    check_env_vars
    test_connection
    check_existing_data
    run_migrations
    verify_setup
    show_connection_info

    echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Make sure SESSION_SECRET is set in Replit Secrets:"
    echo "   openssl rand -base64 32"
    echo "2. Set NODE_ENV=production in Replit Secrets"
    echo "3. Click the 'Run' button to start your application"
    echo "4. Register a new user to test the system"
    echo ""
    echo -e "${YELLOW}🔒 Security Reminder:${NC}"
    echo "- Your DATABASE_URL contains sensitive credentials"
    echo "- Always use Replit Secrets (not regular environment variables)"
    echo "- Never commit database URLs to version control"
    echo ""
}

# Run main function
main "$@"
