# Deploying to Replit - Complete Guide

This guide will walk you through deploying your Invoice Management System to Replit.

## 📋 Prerequisites

- A [Replit](https://replit.com) account
- Your code pushed to GitHub (recommended)
- OAuth credentials for Google/GitHub (optional, for OAuth login)

---

## 🚀 Quick Start (5 Steps)

### Step 1: Import Your Project to Replit

**Option A: From GitHub (Recommended)**
1. Go to [Replit](https://replit.com)
2. Click "Create Repl" → "Import from GitHub"
3. Authorize Replit to access your GitHub
4. Select your repository
5. Replit will automatically detect the configuration

**Option B: Manual Upload**
1. Create a new Repl → "Import from GitHub" → "Upload folder"
2. Upload your entire project folder
3. Wait for Replit to set up the environment

### Step 2: Set Up PostgreSQL Database

Replit provides a built-in PostgreSQL database:

1. In your Repl, click **"Tools"** (left sidebar)
2. Select **"Database"** → **"PostgreSQL"**
3. Click **"Create Database"**
4. Replit will automatically set the `DATABASE_URL` environment variable

**Manual Database Setup (if needed):**
```bash
# In the Replit Shell
psql $DATABASE_URL

# Then run migrations
\i migrations/001_critical_indexes.sql
\i migrations/004_invoice_number_fix.sql
```

### Step 3: Configure Environment Variables

Click on **"Tools"** → **"Secrets"** (lock icon) and add:

**Required:**
```bash
SESSION_SECRET=<generate-with-command-below>
DATABASE_URL=<automatically-set-by-replit>
NODE_ENV=production
```

**Generate SESSION_SECRET:**
```bash
# Run this in Replit Shell
openssl rand -base64 32
```

**Optional (for OAuth):**
```bash
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://your-repl-name.replit.app/api/auth/google/callback

GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GITHUB_CALLBACK_URL=https://your-repl-name.replit.app/api/auth/github/callback
```

### Step 4: Install Dependencies & Run Migrations

In the Replit Shell:

```bash
# Install dependencies
npm install

# Run database migrations
psql $DATABASE_URL -f migrations/001_critical_indexes.sql
psql $DATABASE_URL -f migrations/004_invoice_number_fix.sql
psql $DATABASE_URL -f migrations/005_add_user_profile_fields.sql

# Optional: Apply additional migrations
# psql $DATABASE_URL -f migrations/002_data_integrity_constraints.sql
# psql $DATABASE_URL -f migrations/003_row_level_security.sql
```

### Step 5: Start Your Application

Click the **"Run"** button at the top of Replit!

Your app will be available at: `https://your-repl-name.replit.app`

---

## 🔧 Configuration Files Explained

### `.replit`
Controls how your Repl runs:
- **Development**: `npm run dev` (with hot reload)
- **Production**: Build and run optimized version
- **Port**: Maps internal port 5000 to external port 80

### `replit.nix`
Defines system dependencies:
- Node.js 20
- PostgreSQL 16
- TypeScript support

---

## 📊 Database Migration Steps (Detailed)

### Automatic Migration (Recommended)

Create a setup script that runs on first deployment:

```bash
# In Replit Shell, create setup.sh
cat > setup.sh << 'EOF'
#!/bin/bash
echo "Running database migrations..."

# Check if migrations have been run
if ! psql $DATABASE_URL -c "SELECT 1 FROM pg_tables WHERE tablename = 'invoice_sequences';" | grep -q 1; then
  echo "Applying critical indexes..."
  psql $DATABASE_URL -f migrations/001_critical_indexes.sql

  echo "Fixing invoice number generation..."
  psql $DATABASE_URL -f migrations/004_invoice_number_fix.sql

  echo "Adding user profile fields..."
  psql $DATABASE_URL -f migrations/005_add_user_profile_fields.sql

  echo "✅ Migrations complete!"
else
  echo "✅ Migrations already applied"
fi
EOF

chmod +x setup.sh
./setup.sh
```

### Manual Migration

```bash
# Connect to database
psql $DATABASE_URL

# Check current tables
\dt

# Run migrations one by one
\i migrations/001_critical_indexes.sql
\i migrations/004_invoice_number_fix.sql
\i migrations/005_add_user_profile_fields.sql

# Verify
SELECT tablename FROM pg_tables WHERE schemaname = 'public';

# Exit
\q
```

---

## 🔐 OAuth Setup for Replit

### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Application type: "Web application"
6. Authorized redirect URIs:
   ```
   https://your-repl-name.replit.app/api/auth/google/callback
   ```
7. Copy Client ID and Client Secret to Replit Secrets

### GitHub OAuth

1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in:
   - Application name: Your app name
   - Homepage URL: `https://your-repl-name.replit.app`
   - Authorization callback URL: `https://your-repl-name.replit.app/api/auth/github/callback`
4. Copy Client ID and Client Secret to Replit Secrets

---

## 🌐 Custom Domain (Optional)

### Using Replit's Built-in Domain
Your app will be at: `https://your-repl-name.replit.app`

### Using Your Own Domain

1. In Replit, go to your Repl settings
2. Under "Domains", click "Link Domain"
3. Follow instructions to add DNS records
4. Update OAuth callback URLs to use your custom domain

---

## ⚙️ Environment Variables Reference

### Required Variables

| Variable | Description | How to Get |
|----------|-------------|------------|
| `SESSION_SECRET` | Session encryption key | `openssl rand -base64 32` |
| `DATABASE_URL` | PostgreSQL connection | Auto-set by Replit |
| `NODE_ENV` | Environment mode | Set to `production` |

### Optional Variables (OAuth)

| Variable | Description | Required For |
|----------|-------------|--------------|
| `GOOGLE_CLIENT_ID` | Google OAuth ID | Google login |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | Google login |
| `GOOGLE_CALLBACK_URL` | Google redirect URL | Google login |
| `GITHUB_CLIENT_ID` | GitHub OAuth ID | GitHub login |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth secret | GitHub login |
| `GITHUB_CALLBACK_URL` | GitHub redirect URL | GitHub login |

---

## 🐛 Troubleshooting

### Problem: "Port 5000 is already in use"

**Solution:**
```bash
# Kill existing process
pkill -f "node.*index.js"

# Restart
npm run dev
```

### Problem: "DATABASE_URL not found"

**Solution:**
1. Go to Tools → Database
2. Make sure PostgreSQL database is created
3. Check Secrets to ensure DATABASE_URL is set
4. Restart your Repl

### Problem: "Migration failed"

**Solution:**
```bash
# Check if database is accessible
psql $DATABASE_URL -c "SELECT version();"

# Check what migrations have been run
psql $DATABASE_URL -c "\dt"

# Manually run migrations
psql $DATABASE_URL -f migrations/001_critical_indexes.sql
```

### Problem: "OAuth login not working"

**Solution:**
1. Verify OAuth credentials in Secrets
2. Check callback URLs match exactly (including https://)
3. Make sure OAuth apps are enabled in provider console
4. Check Replit logs for specific errors

### Problem: "Session keeps expiring"

**Solution:**
1. Ensure SESSION_SECRET is set and strong
2. Check if cookies are being sent (browser DevTools → Network → Cookies)
3. Verify NODE_ENV is set to `production`

### Problem: "Build fails"

**Solution:**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

---

## 📈 Performance Optimization

### Enable Always-On (Paid Feature)
Prevents your Repl from sleeping after inactivity.

### Database Connection Pooling
Already configured in `postgres-storage.ts`.

### Caching
Consider adding Redis for session storage in production:
```bash
# In Replit, add Redis database from Tools
# Update session store in server/index.ts
```

---

## 🔄 Continuous Deployment

### Automatic Deployment from GitHub

1. Link your Repl to GitHub repository
2. Enable "Auto-deploy" in Repl settings
3. Every push to main branch will trigger deployment

### Manual Deployment

```bash
# Pull latest changes
git pull origin main

# Install dependencies
npm install

# Run migrations (if any)
psql $DATABASE_URL -f migrations/new_migration.sql

# Restart
# Click "Run" button or use pkill + npm run dev
```

---

## ✅ Post-Deployment Checklist

- [ ] Database created and accessible
- [ ] All environment variables set in Secrets
- [ ] Migrations successfully applied
- [ ] Application starts without errors
- [ ] Can register a new user
- [ ] Can log in with credentials
- [ ] OAuth login works (if configured)
- [ ] Can create invoices
- [ ] Invoice numbers are sequential
- [ ] Session persists across page refreshes
- [ ] Custom domain configured (if applicable)

---

## 📊 Monitoring & Maintenance

### Check Application Logs
In Replit Console, you'll see:
```
[express] serving on port 5000
[express] GET /api/invoices 200 in 5ms
```

### Database Health Check
```bash
# Check database size
psql $DATABASE_URL -c "SELECT pg_size_pretty(pg_database_size(current_database()));"

# Check table sizes
psql $DATABASE_URL -c "SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"

# Check active connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"
```

### Backup Database
```bash
# Create backup
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Download backup (in Replit)
# File will appear in your Repl files, download from there
```

---

## 🆘 Support & Resources

- **Replit Docs**: https://docs.replit.com
- **Replit Discord**: https://replit.com/discord
- **Project README**: See main `README.md`
- **Database Docs**: See `docs/database/`
- **Security Audit**: See `docs/security/`

---

## 🎉 Success!

Your Invoice Management System should now be live on Replit!

**Your app URL**: `https://your-repl-name.replit.app`

**Next Steps:**
1. Test all features thoroughly
2. Set up monitoring alerts
3. Configure regular database backups
4. Add custom domain (optional)
5. Share with users!

---

*Last Updated: 2025-10-27*
*For issues or questions, check the Troubleshooting section above.*
