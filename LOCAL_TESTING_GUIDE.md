# 🧪 Local Testing Guide

## How to Test Changes Before Pushing

### Step 1: Start the Development Server

In your terminal (local machine):

```bash
# Make sure you're in the project directory
cd /Users/cemreuludag/Desktop/gokceinvoice

# Install dependencies (if needed)
npm install

# Start the dev server
npm run dev
```

**Wait for it to start** - You'll see:
```
  VITE ready in XXX ms
  ➜  Local:   http://localhost:3000/
```

### Step 2: Open in Browser

Open your browser and go to: **http://localhost:3000**

### Step 3: Test Your Changes

#### Test Invoice Buttons:
1. **Login/Register** if needed
2. **Navigate to:** Create Invoice (`/invoices/new`)
3. **Fill in the form** with:
   - Select a client
   - Add invoice date
   - Add at least one line item
4. **Test "Save as Draft":**
   - Click "Save as Draft"
   - ✅ Should save without requiring all fields
   - ✅ Button should show "Saving..."
   - ✅ Should redirect to invoices list
5. **Test "Mark as Sent":**
   - Click "Mark as Sent" with incomplete form
   - ❌ Should show validation errors
   - Fill in required fields
   - ✅ Should save successfully
   - ✅ Should redirect to invoices list

#### Test Mixpanel:
1. **Open browser DevTools** (F12)
2. **Go to Network tab**
3. **Filter by:** "mixpanel"
4. **Try registering/login**:
   - ✅ Should see requests to `api-eu.mixpanel.com`
   - ✅ Status should be 200
5. **Check Console tab:**
   - ✅ Should see Mixpanel initialization logs
   - ✅ Should see track events being logged

### Step 4: Verify Everything Works

✅ **Check for:**
- No console errors
- Toast notifications work
- Buttons show loading states
- Validation works correctly
- Redirects happen properly

### Step 5: Stop When Done

Press `Ctrl + C` in terminal to stop the dev server.

---

## 🔧 Common Issues & Fixes

### "Port 3000 already in use"
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

### "Module not found errors"
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### "Database connection errors"
```bash
# If testing without database, the app will use in-memory storage
# That's fine for local testing!

# If you want to use your local database:
# Make sure Docker is running and run:
docker-compose up -d

# Then set DATABASE_URL in .env file
```

---

## 🚀 Recommended Testing Workflow

### 1. **Make Changes Locally**
```bash
# Edit files in your IDE
# Make your changes
```

### 2. **Test Locally First**
```bash
# Start dev server
npm run dev

# Test in browser
# Verify everything works
```

### 3. **Commit When Confident**
```bash
# If tests pass, commit
git add .
git commit -m "Your commit message"

# Push to GitHub
git push origin main
```

### 4. **Deploy to Production**
```bash
# In Replit, pull the latest changes
# Restart the Repl
# Test the live version
```

---

## 🎯 Quick Testing Checklist

Before pushing, make sure:

- [ ] Dev server starts without errors
- [ ] Page loads in browser
- [ ] No console errors
- [ ] New feature works as expected
- [ ] Existing features still work
- [ ] Toast notifications appear
- [ ] Buttons show loading states
- [ ] Validation works correctly
- [ ] Redirects happen properly
- [ ] Mobile view looks OK (optional)

---

## 📊 Testing Invoice Buttons NOW

**Quick test in 2 minutes:**

```bash
# 1. Start server
npm run dev

# 2. Open browser
# Go to: http://localhost:3000

# 3. Register/Login
# 4. Go to: http://localhost:3000/invoices/new
# 5. Fill form and test buttons
```

---

## 💡 Pro Tips

### Hot Module Reload (HMR)
- Changes auto-reload in browser
- **No need to refresh manually!**
- Fast feedback loop

### Browser DevTools
- **Console:** See errors/logs
- **Network:** Check API calls
- **Elements:** Inspect HTML
- **Application:** Check storage/cookies

### Test Different Scenarios:
1. ✅ Happy path (everything works)
2. ❌ Error path (missing data)
3. 🔄 Loading states
4. 📱 Responsive design
5. 🎨 Dark/light theme

---

## 🆘 Need Help?

**If something doesn't work:**
1. Check browser console for errors
2. Check terminal for server errors
3. Try refreshing the page
4. Clear browser cache
5. Restart dev server

**Common fixes:**
```bash
# Clear cache and restart
npm run dev -- --force

# Or
rm -rf dist .vite node_modules
npm install
npm run dev
```

---

## ✅ Summary

**Local Testing Workflow:**
1. `npm run dev` → Start server
2. Open browser → Test changes
3. Fix any issues
4. When happy → Commit & push

**That's it!** Simple and fast local testing. 🎉

