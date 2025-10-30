#!/bin/bash

# Fresh Replit PostgreSQL Setup Script
# For when you have no existing data to migrate

set -e  # Exit on any error

echo "🚀 Fresh Replit PostgreSQL Setup"
echo "================================"
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
        echo "Make sure you're running this in Replit with PostgreSQL enabled"
        echo "Go to Tools → Database → PostgreSQL → Create Database"
        exit 1
    fi

    echo -e "${GREEN}✅ DATABASE_URL is set${NC}"
    echo ""
}

# Test database connection
test_connection() {
    echo -e "${BLUE}Testing Replit PostgreSQL connection...${NC}"

    if psql "$DATABASE_URL" -c "SELECT version();" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Database connection successful${NC}"
    else
        echo -e "${RED}❌ Failed to connect to database${NC}"
        echo "Make sure PostgreSQL is enabled in Replit Tools → Database"
        exit 1
    fi

    echo ""
}

# Clean the database (optional)
clean_database() {
    echo -e "${BLUE}Cleaning existing database...${NC}"

    # Drop all tables, views, sequences, etc.
    psql "$DATABASE_URL" -c "
        DO \$\$ DECLARE
            r RECORD;
        BEGIN
            FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
                EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
            END LOOP;
        END \$\$;
    " > /dev/null 2>&1

    echo -e "${GREEN}✅ Database cleaned${NC}"
    echo ""
}

# Run migrations
run_migrations() {
    echo -e "${BLUE}Running database migrations...${NC}"

    # Make sure migrations directory exists
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

# Main setup process
main() {
    echo "This will set up a fresh Replit PostgreSQL database for your Invoice Management System."
    echo -e "${YELLOW}⚠️  This will DROP all existing data in your Replit database${NC}"
    echo ""

    read -p "Do you want to continue? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo "Setup cancelled."
        exit 0
    fi

    check_env_vars
    test_connection

    # Ask if they want to clean existing data
    read -p "Clean existing database data? (yes/no): " clean_confirm
    if [ "$clean_confirm" = "yes" ]; then
        clean_database
    fi

    run_migrations
    verify_setup

    echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Make sure SESSION_SECRET is set in Replit Secrets"
    echo "2. Click the 'Run' button to start your application"
    echo "3. Register a new user to test the system"
    echo ""
    echo -e "${YELLOW}⚠️  Don't forget to configure OAuth credentials if you plan to use social login${NC}"
}

# Run main function
main "$@"
