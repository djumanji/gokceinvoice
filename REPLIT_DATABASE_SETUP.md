# 🗄️ Replit Database Setup Guide

## The Issue

You have **TWO separate databases**:

### 1. **Local Development Database** (Docker)
- **Location:** Your local machine
- **Runs via:** `docker-compose.yml`
- **URL:** `postgresql://postgres:postgres@localhost:5433/invoicedb`
- **Status:** ✅ Working locally
- **Access:** Only from your local machine

### 2. **Replit Production Database** (Replit Hosted)
- **Location:** Replit's servers
- **Setup:** Through Replit Tools → Database
- **URL:** Provided by Replit automatically
- **Status:** ❌ Not set up yet
- **Access:** Only from Replit

**The Problem:** Your Docker database is **local only** - Replit can't access it!

---

## ✅ Solution: Create Replit Database

### Step 1: Create Database in Replit

1. **In your Replit project:**
   - Click **"Tools"** (left sidebar)
   - Click **"Database"**
   - Click **"Create Database"** or **"New Database"**
   - Select **"PostgreSQL"**
   
2. **Replit will automatically:**
   - Create the database
   - Set `DATABASE_URL` environment variable
   - Give you a connection string

### Step 2: Run Database Setup Script

In Replit Shell, run:
```bash
bash setup-replit-db.sh
```

Or manually:
```bash
# Apply migrations
psql $DATABASE_URL -f migrations/001_critical_indexes.sql
psql $DATABASE_URL -f migrations/004_invoice_number_fix.sql
```

### Step 3: Verify Setup

Check if database is connected:
```bash
psql $DATABASE_URL -c "SELECT version();"
```

You should see PostgreSQL version info.

---

## 🎯 Understanding the Two Environments

| Aspect | Local Development | Replit Production |
|--------|------------------|-------------------|
| **Database** | Docker on your computer | Replit hosted |
| **DATABASE_URL** | `localhost:5433` | Replit provided URL |
| **Access** | Your machine only | Replit servers |
| **Persistence** | Saved in Docker volume | Saved in Replit cloud |
| **Shared?** | ❌ No | ❌ No |

---

## 🔍 Check Current Status

In your Replit Shell:
```bash
# Check if DATABASE_URL is set
echo $DATABASE_URL

# If it shows a URL, database is set up
# If it's empty, you need to create one
```

---

## 📝 Configuration Summary

### Local `.env` file:
```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/invoicedb
SESSION_SECRET=your-local-secret
```

### Replit Secrets:
```bash
DATABASE_URL=postgresql://... (provided by Replit)
SESSION_SECRET=your-production-secret
```

---

## 🚀 After Setup

Once Replit database is created:
1. ✅ Registration will work
2. ✅ Data will persist
3. ✅ Users can log back in
4. ✅ No more "helium" errors

---

## ⚠️ Important Notes

- **Docker DB ≠ Replit DB** - They are separate
- **Local data doesn't sync to Replit** - Start fresh
- **Replit DB is free** for development/testing
- **Each user on Replit has separate DB** if shared

---

## 🆘 Troubleshooting

**"helium" error?**
- Check `echo $DATABASE_URL` in Replit Shell
- If it shows "helium", create a new database

**Connection failed?**
- Verify database is created in Tools → Database
- Check DATABASE_URL in Secrets matches database

**Migrations failed?**
- Database might not exist yet
- Create it first, then run migrations

---

## ✅ Quick Checklist

- [ ] Create PostgreSQL database in Replit Tools → Database
- [ ] Verify `echo $DATABASE_URL` shows a valid URL
- [ ] Run `bash setup-replit-db.sh`
- [ ] Test registration at your Replit URL
- [ ] Check logs for any errors

**You're all set!** 🎉

