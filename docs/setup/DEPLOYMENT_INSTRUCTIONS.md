# 🚀 Deployment Instructions for Replit

## Current Issue: DATABASE_URL Not Set

Your registration is failing because there's no valid database connection configured.

## Solution: Choose One Option

### Option 1: Use In-Memory Storage (Easiest) ⚡

**Pros:** Quick setup, no database needed  
**Cons:** Data is lost when server restarts

**Steps:**
1. Do **NOT** set DATABASE_URL in Replit Secrets
2. The app will automatically use in-memory storage
3. Registration will work, but data won't persist

✅ **This is fine for testing/demo purposes**

---

### Option 2: Set Up Replit Database (Recommended) 💾

**Pros:** Data persists, production-ready  
**Cons:** Requires database setup

**Steps:**

1. **In Replit:**
   - Click "Tools" → "Database" 
   - Click "Create database"
   - Select "PostgreSQL"
   - Copy the connection string

2. **In Replit Secrets (🔒 icon):**
   - Click "+ New secret"
   - Key: `DATABASE_URL`
   - Value: Paste the connection string from step 1
   - Click "Add secret"

3. **Run database migrations:**
   ```bash
   # In Replit Shell
   psql $DATABASE_URL -f migrations/001_critical_indexes.sql
   ```

4. **Restart your Repl**

---

### Option 3: Use External Database

If you have an external PostgreSQL database (like Neon, Supabase, etc.):

1. **In Replit Secrets:**
   - Key: `DATABASE_URL`
   - Value: Your database connection string
   - Format: `postgresql://user:password@host:5432/database`

2. **Restart your Repl**

---

## Required Environment Variables

Make sure you have these in Replit Secrets:

✅ **SESSION_SECRET** (Required!)
   ```bash
   # Generate with:
   openssl rand -base64 32
   ```

✅ **DATABASE_URL** (Optional, but recommended for production)

---

## Quick Fix for Right Now

Since you don't have DATABASE_URL set, the app **should** use in-memory storage. But the error suggests there's a bad DATABASE_URL somewhere.

**Quick fix:**
1. In Replit, go to Shell
2. Run: `unset DATABASE_URL`
3. Or check if there's a `.env` file: `cat .env`
4. If DATABASE_URL is set to something with "helium", delete that value

---

## Test After Setting Up

1. Try to register a new user
2. Check logs for errors
3. If it works, try logging in
4. Refresh the page - if data persists, database is working ✅

---

## Current Status

Based on your error logs:
- ❌ DATABASE_URL either not set OR set to invalid value with "helium" hostname
- ✅ SESSION_SECRET (presumably set since server is running)
- ❌ Trust proxy issue (now fixed in latest commit)

---

## Next Steps

1. **Deploy the latest code** (already pushed)
2. **Check Replit Secrets** - look for any DATABASE_URL with "helium"
3. **Either** delete bad DATABASE_URL OR add valid one
4. **Set SESSION_SECRET** if not already set
5. **Restart Repl**
6. **Test registration**

---

## Need Help?

The app will work with **in-memory storage** if DATABASE_URL is completely unset. Just make sure:
- No DATABASE_URL in Secrets (or it's valid)
- SESSION_SECRET is set
- Latest code is deployed

