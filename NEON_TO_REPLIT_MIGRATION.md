# Migrating from Neon to Replit PostgreSQL

This guide will help you migrate your Invoice Management System from Neon PostgreSQL to Replit's built-in PostgreSQL database.

## 📋 Migration Overview

**Why migrate to Replit PostgreSQL?**
- Simplified deployment (no external database management)
- Automatic DATABASE_URL configuration by Replit
- Better integration with Replit's development environment
- Cost savings (no separate database hosting fees)

## 🚀 Choose Your Migration Path

### Option 1: Fresh Setup (Recommended if no production data)
If you have no important data in your current database, use the fresh setup script.

**Steps:**
1. Set up Replit PostgreSQL (Tools → Database → PostgreSQL → Create Database)
2. Run: `./scripts/setup-fresh-replit-db.sh`
3. Set `SESSION_SECRET` in Replit Secrets
4. Run your application

### Option 2: Data Migration (If you have existing data)
If you need to migrate existing data from Neon, use the full migration script.

**Steps:**
1. Set `NEON_DATABASE_URL` in Replit Secrets (temporarily)
2. Set up Replit PostgreSQL (Tools → Database → PostgreSQL → Create Database)
3. Run: `./scripts/migrate-to-replit-postgres.sh`
4. Remove `NEON_DATABASE_URL` from secrets after migration

## 🚀 Fresh Setup (No Existing Data)

### Prerequisites

1. **Replit environment ready** - Your code should be deployed to Replit
2. **Replit PostgreSQL enabled** - Go to Tools → Database → PostgreSQL → Create Database

### Step-by-Step Setup

1. **Enable Replit PostgreSQL:**
   - In your Replit, go to Tools → Database → PostgreSQL
   - Click "Create Database"
   - Replit will automatically set the `DATABASE_URL` environment variable

2. **Run the fresh setup script:**
   ```bash
   # In your Replit shell
   chmod +x scripts/setup-fresh-replit-db.sh
   ./scripts/setup-fresh-replit-db.sh
   ```

3. **Set required environment variables in Replit Secrets:**
   ```bash
   SESSION_SECRET=<generate-with-openssl rand -base64 32>
   NODE_ENV=production
   ```
   (Optional: Add OAuth credentials if you want social login)

4. **Test your application:**
   - Click the "Run" button in Replit
   - Register a new user to test the system
   - Create an invoice to verify everything works

That's it! Your application is now running on Replit PostgreSQL.

## 🔧 Manual Migration (Alternative)

If you prefer to do the migration manually:

### 1. Export Data from Neon

```bash
# Create backup from Neon
pg_dump "your_neon_connection_string" --no-owner --no-privileges --clean --if-exists > neon_backup.sql

# Copy the backup file to your Replit environment
# (Upload via Replit file manager or use scp/wget if accessible)
```

### 2. Set Up Replit PostgreSQL

```bash
# In Replit, run database migrations
bash migrations/run-all.sh
```

### 3. Import Data to Replit

```bash
# Import the backup into Replit PostgreSQL
psql $DATABASE_URL < neon_backup.sql
```

### 4. Verify Migration

```bash
# Compare table counts
echo "Neon tables:"
psql "your_neon_connection_string" -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';"

echo "Replit tables:"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public';"

# Check specific table row counts
psql $DATABASE_URL -c "SELECT 'users' as table, COUNT(*) FROM users UNION ALL SELECT 'invoices', COUNT(*) FROM invoices UNION ALL SELECT 'clients', COUNT(*) FROM clients;"
```

## ⚙️ Environment Variables

### Before Migration
```bash
DATABASE_URL=postgresql://neon_connection_string
```

### After Migration
```bash
DATABASE_URL=postgresql://replit_auto_generated_url  # Auto-set by Replit
```

No other environment variables need to change - your application code is database-agnostic.

## 🧪 Testing the Migration

After migration, test these critical features:

### User Management
- [ ] User registration works
- [ ] Email verification works
- [ ] Password reset works
- [ ] User login/logout works

### Invoice Management
- [ ] Invoice creation works
- [ ] Invoice numbering is sequential
- [ ] Invoice PDF generation works
- [ ] Invoice status updates work

### Data Integrity
- [ ] All existing users are present
- [ ] All existing invoices are present
- [ ] All existing clients are present
- [ ] All relationships are maintained

### OAuth (if configured)
- [ ] Google OAuth login works
- [ ] GitHub OAuth login works
- [ ] Callback URLs work with new domain

## 🔧 Troubleshooting

### Migration Script Issues

**"NEON_DATABASE_URL not set"**
```bash
# Add to Replit Secrets or set temporarily:
export NEON_DATABASE_URL="your_neon_connection_string"
```

**"Failed to connect to database"**
- Verify your Neon connection string is correct
- Check if your Neon database is accessible
- Ensure your IP is whitelisted in Neon (if required)

### Post-Migration Issues

**"Column does not exist" errors**
```bash
# Re-run migrations
bash migrations/run-all.sh
```

**Data appears missing**
```bash
# Check if data was imported
psql $DATABASE_URL -c "SELECT COUNT(*) FROM users;"
psql $DATABASE_URL -c "SELECT COUNT(*) FROM invoices;"

# If missing, check the backup file and re-import
psql $DATABASE_URL < neon_backup.sql
```

**Application won't start**
- Check Replit logs for specific errors
- Verify DATABASE_URL is set correctly
- Ensure all dependencies are installed: `npm install`

## 📊 Performance Considerations

Replit PostgreSQL is suitable for:
- Development and testing
- Small to medium production applications
- Applications with moderate traffic

For high-traffic applications, consider:
- Database connection pooling (already configured)
- Query optimization and indexing (already done)
- Caching layers (Redis/Memcached)

## 🔒 Security Notes

- Replit PostgreSQL is private to your Replit environment
- No additional firewall rules needed
- Database credentials are managed automatically
- SSL/TLS encryption is enabled by default

## 🆘 Rollback Plan

If something goes wrong:

1. **Keep your Neon database active** until migration is verified
2. **Have a backup** of your Neon data before starting
3. **Test thoroughly** before deleting the old database
4. **Document any issues** for support

To rollback:
```bash
# Update DATABASE_URL back to Neon connection string
# Restart your Replit application
```

## 📞 Support

If you encounter issues:

1. Check the [Replit Documentation](https://docs.replit.com)
2. Review the troubleshooting section above
3. Check Replit's community forums
4. Open an issue in your project repository

## ✅ Success Checklist

- [ ] Migration script completed successfully
- [ ] All data migrated (users, invoices, clients, etc.)
- [ ] Application starts without errors
- [ ] User registration/login works
- [ ] Invoice creation and management works
- [ ] OAuth login works (if configured)
- [ ] Email notifications work (if configured)
- [ ] File uploads work (if configured)
- [ ] All features tested and verified
- [ ] Neon database backed up and can be safely deleted
- [ ] Environment variables cleaned up

---

**Migration completed on:** `date +%Y-%m-%d`

**Migrated from:** Neon PostgreSQL
**Migrated to:** Replit PostgreSQL

**Notes:** [Add any special notes or issues encountered]
