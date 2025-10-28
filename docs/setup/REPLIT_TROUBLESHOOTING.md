# 🔧 Replit Troubleshooting Guide

## Current Error: "helium" DNS Issue

Your registration is failing because `DATABASE_URL` is set to something with hostname "helium".

### ⚡ Quick Fix

**Run this in Replit Shell:**

```bash
# Check what DATABASE_URL is currently set to
echo $DATABASE_URL

# If it shows "helium" or invalid value, unset it
unset DATABASE_URL

# Or check all environment variables
env | grep DATABASE
```

### Option A: Remove DATABASE_URL (Use In-Memory)

If you don't want to use a database right now:

1. In Replit Shell:
   ```bash
   unset DATABASE_URL
   ```

2. In Replit Secrets (🔒 icon):
   - If `DATABASE_URL` exists, **delete it**
   - Keep `SESSION_SECRET`

3. Restart your Repl (click Stop, then Run)

Registration will work with in-memory storage! ✅

---

### Option B: Use Valid Database

**In Replit Secrets:**

1. Click "Secrets" (🔒 icon)
2. Look for `DATABASE_URL`
3. **Delete it** if it has "helium"
4. **Add a proper one:**

   **Option 1: Create Replit Database**
   - Tools → Database → Create Database
   - Copy connection string
   - Paste as new DATABASE_URL

   **Option 2: Use Supabase (Free)**
   - Go to supabase.com
   - Create free project
   - Copy connection string
   - Paste as new DATABASE_URL

---

## OAuth Error Fix

**Error:** `Unknown authentication strategy "github"`

**Fix:** Already fixed in latest code! OAuth will gracefully handle missing credentials.

**What happened:**
- User clicked "Continue with GitHub"
- GitHub OAuth not configured
- Error occurred

**New behavior:**
- If OAuth not configured, returns error message instead of crashing
- No more "Unknown strategy" errors

---

## 🔍 Debugging Steps

### Step 1: Check Environment Variables

```bash
# In Replit Shell
env | grep DATABASE
env | grep SESSION
env | grep GITHUB
```

### Step 2: Check What's Running

```bash
# Check if server is running
ps aux | grep node

# Check logs
# Look at Replit console output
```

### Step 3: Test Database Connection

```bash
# If DATABASE_URL is set, test it
psql $DATABASE_URL -c "SELECT version();"

# If it fails, the DATABASE_URL is wrong
```

### Step 4: Restart Everything

1. Stop your Repl (click Stop button)
2. Wait 5 seconds
3. Click Run button
4. Watch for startup messages

---

## ✅ Quick Resolution

**Easiest fix right now:**

```bash
# In Replit Shell
# 1. Unset bad DATABASE_URL
unset DATABASE_URL

# 2. Make sure SESSION_SECRET exists
# Check in Secrets (🔒 icon)

# 3. Restart Repl (Stop → Run)
```

**Then try registering again!**

---

## 📝 What Changed in Latest Code

✅ Added trust proxy (fixes rate limiting)
✅ Added DATABASE_URL validation (rejects "helium")
✅ Added OAuth error handling
✅ Better error messages

**Make sure your Replit has the latest code!**

---

## 🆘 Still Having Issues?

1. **Check DATABASE_URL:**
   ```bash
   echo $DATABASE_URL
   ```

2. **Check Secrets:**
   - Go to Secrets (🔒 icon)
   - List all environment variables
   - Remove any with "helium"

3. **Check Logs:**
   - Look at Replit console
   - Look for "Registration attempt" messages
   - See what step is failing

4. **Try In-Memory Storage:**
   - Don't set DATABASE_URL at all
   - App will work without database
   - Data won't persist but that's fine for testing

---

## 🎯 Next Steps

1. ✅ Pull latest code (should auto-update on Replit)
2. ✅ Unset/replace DATABASE_URL
3. ✅ Ensure SESSION_SECRET is set
4. ✅ Restart Repl
5. ✅ Try registration

**You should be good to go!** 🚀

