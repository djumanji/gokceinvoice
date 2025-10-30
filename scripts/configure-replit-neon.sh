#!/bin/bash

# Configure Replit Secrets for Personal Neon Database (Dev/Prod)
# This script helps you set up DATABASE_URL and DATABASE_URL_PROD in Replit Secrets
# Usage: ./scripts/configure-replit-neon.sh [dev-url] [prod-url]
#
# NOTE: This script is for PERSONAL Neon accounts (not Replit's Neon integration)
# If you're using Replit's Neon integration, DATABASE_URL is set automatically
# Only use this script if you want separate dev/prod databases from your personal Neon account

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║   Personal Neon Database Configuration Script           ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}ℹ️  Note: This script is for PERSONAL Neon accounts${NC}"
echo -e "${YELLOW}   Replit's Neon integration (10GB free) doesn't need this script${NC}"
echo -e "${YELLOW}   Use this only if you want separate dev/prod from personal Neon${NC}"
echo ""

# Function to validate connection string format
validate_connection_string() {
    local url=$1
    if [[ ! "$url" =~ ^postgresql:// ]]; then
        echo -e "${RED}❌ Invalid connection string format${NC}"
        echo "   Expected format: postgresql://user:password@host:port/database?sslmode=require"
        return 1
    fi
    if [[ ! "$url" =~ sslmode=require ]]; then
        echo -e "${YELLOW}⚠️  Warning: Connection string should include sslmode=require for Neon${NC}"
    fi
    return 0
}

# Function to extract database info from connection string
extract_db_info() {
    local url=$1
    local host=$(echo "$url" | sed -n 's|.*@\([^/]*\)/.*|\1|p' | cut -d: -f1)
    local db_name=$(echo "$url" | sed -n 's|.*\/\([^?]*\).*|\1|p')
    echo "$host|$db_name"
}

# Check if running in Replit
is_replit() {
    if [ -n "$REPL_ID" ] || [ -n "$REPL_SLUG" ]; then
        return 0
    fi
    return 1
}

# Get connection strings
DEV_URL=""
PROD_URL=""

if [ $# -eq 2 ]; then
    # Both URLs provided as arguments
    DEV_URL="$1"
    PROD_URL="$2"
elif [ $# -eq 1 ]; then
    # Only one URL provided, assume it's dev
    DEV_URL="$1"
    echo -e "${YELLOW}Only one URL provided. Assuming it's for DEV.${NC}"
    echo ""
elif [ $# -eq 0 ]; then
    # Prompt for URLs
    echo -e "${BLUE}Please provide your Neon database connection strings:${NC}"
    echo ""
    echo -e "${YELLOW}📍 Dev Branch Connection String:${NC}"
    echo "   Format: postgresql://user:password@host:port/database?sslmode=require"
    read -p "   Enter dev DATABASE_URL: " DEV_URL
    echo ""
    
    echo -e "${YELLOW}📍 Production Branch Connection String:${NC}"
    echo "   Format: postgresql://user:password@host:port/database?sslmode=require"
    read -p "   Enter prod DATABASE_URL: " PROD_URL
    echo ""
fi

# Validate connection strings
if [ -z "$DEV_URL" ]; then
    echo -e "${RED}❌ Dev connection string is required${NC}"
    exit 1
fi

if [ -z "$PROD_URL" ]; then
    echo -e "${YELLOW}⚠️  Production URL not provided. Will only set DATABASE_URL (dev)${NC}"
    echo ""
fi

echo -e "${BLUE}Validating connection strings...${NC}"
if ! validate_connection_string "$DEV_URL"; then
    exit 1
fi

if [ -n "$PROD_URL" ]; then
    if ! validate_connection_string "$PROD_URL"; then
        exit 1
    fi
fi

echo -e "${GREEN}✅ Connection strings validated${NC}"
echo ""

# Extract and display database info
DEV_INFO=$(extract_db_info "$DEV_URL")
DEV_HOST=$(echo "$DEV_INFO" | cut -d'|' -f1)
DEV_DB=$(echo "$DEV_INFO" | cut -d'|' -f2)

echo -e "${CYAN}Dev Database:${NC}"
echo "   Host: $DEV_HOST"
echo "   Database: $DEV_DB"
echo ""

if [ -n "$PROD_URL" ]; then
    PROD_INFO=$(extract_db_info "$PROD_URL")
    PROD_HOST=$(echo "$PROD_INFO" | cut -d'|' -f1)
    PROD_DB=$(echo "$PROD_INFO" | cut -d'|' -f2)
    
    echo -e "${CYAN}Production Database:${NC}"
    echo "   Host: $PROD_HOST"
    echo "   Database: $PROD_DB"
    echo ""
fi

# Replit Secrets configuration
if is_replit; then
    echo -e "${BLUE}Configuring Replit Secrets...${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  IMPORTANT: Replit Secrets must be set manually through the UI${NC}"
    echo ""
    echo -e "${CYAN}Follow these steps:${NC}"
    echo ""
    echo "1. Go to: Tools → Secrets (in Replit)"
    echo ""
    echo "2. Add or update these secrets:"
    echo ""
    echo -e "${GREEN}   DATABASE_URL${NC}"
    echo "   Value: $DEV_URL"
    echo ""
    
    if [ -n "$PROD_URL" ]; then
        echo -e "${GREEN}   DATABASE_URL_PROD${NC}"
        echo "   Value: $PROD_URL"
        echo ""
    fi
    
    echo -e "${GREEN}   NODE_ENV${NC}"
    echo "   Value: development (for dev) or production (for prod deployments)"
    echo ""
    
    echo -e "${YELLOW}📋 Copy these connection strings:${NC}"
    echo ""
    echo "DEV_DATABASE_URL=\"$DEV_URL\""
    if [ -n "$PROD_URL" ]; then
        echo "PROD_DATABASE_URL=\"$PROD_URL\""
    fi
    echo ""
    
    echo -e "${BLUE}After setting secrets:${NC}"
    echo "   1. Restart your Repl"
    echo "   2. The app will automatically use:"
    echo "      - Dev database when NODE_ENV=development"
    echo "      - Prod database when NODE_ENV=production"
    echo ""
    
else
    echo -e "${YELLOW}⚠️  Not running in Replit environment${NC}"
    echo ""
    echo "To set these in your local environment, add to your .env file:"
    echo ""
    echo "DATABASE_URL=\"$DEV_URL\""
    if [ -n "$PROD_URL" ]; then
        echo "DATABASE_URL_PROD=\"$PROD_URL\""
    fi
    echo "NODE_ENV=development"
    echo ""
fi

# Test connections (optional)
echo -e "${BLUE}Test database connections? (y/n)${NC}"
read -p "> " test_conn

if [ "$test_conn" = "y" ] || [ "$test_conn" = "Y" ]; then
    echo ""
    echo -e "${BLUE}Testing dev database connection...${NC}"
    
    if command -v psql &> /dev/null; then
        if psql "$DEV_URL" -c "SELECT version();" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ Dev database connection successful${NC}"
        else
            echo -e "${RED}❌ Dev database connection failed${NC}"
        fi
        
        if [ -n "$PROD_URL" ]; then
            echo ""
            echo -e "${BLUE}Testing production database connection...${NC}"
            if psql "$PROD_URL" -c "SELECT version();" > /dev/null 2>&1; then
                echo -e "${GREEN}✅ Production database connection successful${NC}"
            else
                echo -e "${RED}❌ Production database connection failed${NC}"
            fi
        fi
    else
        echo -e "${YELLOW}⚠️  psql not found. Skipping connection test.${NC}"
        echo "   Install PostgreSQL client to test connections, or test manually."
    fi
    echo ""
fi

echo -e "${GREEN}✅ Configuration complete!${NC}"
echo ""
echo -e "${CYAN}Summary:${NC}"
echo "   • Dev database: $DEV_HOST / $DEV_DB"
if [ -n "$PROD_URL" ]; then
    echo "   • Prod database: $PROD_HOST / $PROD_DB"
fi
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "   1. Set the secrets in Replit (Tools → Secrets)"
echo "   2. Restart your Repl"
echo "   3. Run migrations: bash migrations/run-all.sh"
echo "   4. Start your application"
echo ""

