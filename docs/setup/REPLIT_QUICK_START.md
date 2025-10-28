# Replit Deployment - Quick Start Checklist

Use this checklist to deploy your Invoice Management System to Replit in under 10 minutes.

---

## 📋 Pre-Deployment Checklist

- [ ] Replit account created
- [ ] Code pushed to GitHub (or ready to upload)
- [ ] Read `docs/REPLIT_DEPLOYMENT.md` (optional but recommended)

---

## 🚀 Deployment Steps (10 minutes)

### ✅ Step 1: Import to Replit (2 min)

- [ ] Go to [Replit.com](https://replit.com)
- [ ] Click **"Create Repl"**
- [ ] Select **"Import from GitHub"**
- [ ] Choose your repository
- [ ] Wait for Replit to set up

### ✅ Step 2: Create Database (1 min)

- [ ] Click **"Tools"** in left sidebar
- [ ] Select **"Database"** → **"PostgreSQL"**
- [ ] Click **"Create Database"**
- [ ] Verify `DATABASE_URL` is auto-set in Secrets

### ✅ Step 3: Set Environment Variables (2 min)

Click **"Tools"** → **"Secrets"** (🔒 icon):

**Required Variables:**

- [ ] `SESSION_SECRET` = Generate with command below
- [ ] `NODE_ENV` = `production`

```bash
# Generate SESSION_SECRET in Replit Shell:
openssl rand -base64 32
```

**Optional (for OAuth):**

- [ ] `GOOGLE_CLIENT_ID` = (from Google Cloud Console)
- [ ] `GOOGLE_CLIENT_SECRET` = (from Google Cloud Console)
- [ ] `GOOGLE_CALLBACK_URL` = `https://your-repl-name.replit.app/api/auth/google/callback`
- [ ] `GITHUB_CLIENT_ID` = (from GitHub Settings)
- [ ] `GITHUB_CLIENT_SECRET` = (from GitHub Settings)
- [ ] `GITHUB_CALLBACK_URL` = `https://your-repl-name.replit.app/api/auth/github/callback`

### ✅ Step 4: Install & Setup (3 min)

In Replit **Shell** (bottom panel):

```bash
# Install dependencies
npm install

# Run database setup script (automated)
chmod +x setup-replit-db.sh
./setup-replit-db.sh
```

**Expected output:**
```
✅ Database connection successful
✅ Critical indexes created (16 indexes)
✅ Invoice number sequence system installed
🎉 Database setup complete!
```

### ✅ Step 5: Launch! (1 min)

- [ ] Click the big green **"Run"** button at top
- [ ] Wait for "serving on port 5000" message
- [ ] Click the preview URL or open in new tab

---

## ✅ Post-Deployment Verification (5 min)

### Test Basic Functionality

- [ ] **Homepage loads** - No errors
- [ ] **Register new user** - Email/password signup works
- [ ] **Login works** - Can log in with credentials
- [ ] **Dashboard loads** - Shows empty state
- [ ] **Create client** - Can add a new client
- [ ] **Create invoice** - Invoice number is `INV-000001`
- [ ] **Create another invoice** - Invoice number is `INV-000002`
- [ ] **Logout/Login** - Session persists

### Test OAuth (if configured)

- [ ] **Google login** - Works without errors
- [ ] **GitHub login** - Works without errors

---

## 🆘 Quick Troubleshooting

### "Can't find module 'postgres'"

```bash
# Delete and reinstall
rm -rf node_modules
npm install
```

### "DATABASE_URL not set"

1. Go to Tools → Database
2. Create PostgreSQL database
3. Restart Repl

### "Migration failed"

```bash
# Run manual setup
psql $DATABASE_URL -f migrations/001_critical_indexes.sql
psql $DATABASE_URL -f migrations/004_invoice_number_fix.sql
```

### "Session keeps expiring"

Check Secrets:
- `SESSION_SECRET` is set
- `NODE_ENV` = `production`

### Still Having Issues?

See full guide: `docs/REPLIT_DEPLOYMENT.md`

---

## 🎉 Success Indicators

You know it's working when:

✅ No errors in console
✅ Can register and login
✅ Invoice numbers are sequential (INV-000001, INV-000002, ...)
✅ Session persists after refresh
✅ Database queries are fast (<10ms)

---

## 📍 Your Live URLs

- **App**: `https://your-repl-name.replit.app`
- **API Docs**: See `README.md` → API Endpoints section
- **Admin Panel**: (if you add one later)

---

## 🔗 Important Links

- **Full Deployment Guide**: `docs/REPLIT_DEPLOYMENT.md`
- **Project README**: `README.md`
- **Database Docs**: `docs/database/`
- **Security Audit**: `docs/security/`

---

## 🎯 Next Steps

After successful deployment:

1. **Test thoroughly** - Use demo account or create new users
2. **Monitor logs** - Check Console for any errors
3. **Set up backups** - Run `pg_dump $DATABASE_URL > backup.sql` weekly
4. **Add custom domain** - (optional) Link your own domain
5. **Enable Always-On** - (paid) Prevent Repl from sleeping
6. **Share with users** - Your app is live!

---

## 💡 Pro Tips

- **Save your DATABASE_URL**: Store it somewhere safe (encrypted)
- **Never commit .env**: Already in `.gitignore`
- **Use Secrets**: Never hardcode credentials
- **Monitor usage**: Check Replit usage dashboard
- **Backup regularly**: Database backups save lives

---

*Estimated Total Time: 10-15 minutes*
*Last Updated: 2025-10-27*

**Good luck with your deployment! 🚀**
