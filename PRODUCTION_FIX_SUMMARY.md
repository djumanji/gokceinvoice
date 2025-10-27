# 🔧 Production Registration Fix

## Issues Fixed

### 1. Trust Proxy Error ✅
**Error:** `The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false`

**Fix:** Added `app.set('trust proxy', 1)` to `server/index.ts`

```typescript
const app = express();

// Trust proxy - required for Replit and other cloud platforms
// This ensures rate limiting and sessions work correctly behind a proxy
app.set('trust proxy', 1);
```

**Why:** Replit runs behind a proxy. Without this setting, Express doesn't trust forwarded headers, causing rate limiting to fail.

### 2. DNS Error for "helium" ❌

**Error:** `getaddrinfo ENOTFOUND helium`

**Issue:** The DATABASE_URL environment variable appears to be incorrectly configured with hostname "helium".

**Solution:** 

1. **Check Replit Secrets** - Look for DATABASE_URL
2. **Verify the hostname** - It should be a valid PostgreSQL hostname (not "helium")
3. **For Replit Database:** Use the correct hostname from your Replit database settings

### 3. Better Error Handling ✅

Added validation and better error messages in `server/storage.ts`:

```typescript
// Validate DATABASE_URL format
if (!dbUrl.includes('://')) {
  console.error('Invalid DATABASE_URL format. Missing protocol');
  return new MemStorage();
}
```

## Deployment Checklist

- [x] Trust proxy setting added
- [x] Better error logging added
- [ ] **DATABASE_URL needs to be fixed in Replit**
- [ ] **SESSION_SECRET must be set**

## Steps to Fix in Replit

1. Go to your Replit project
2. Open "Secrets" (🔒 icon)
3. Check DATABASE_URL value
4. Update it with correct PostgreSQL connection string:
   ```
   postgresql://user:password@correct-hostname:5432/database
   ```

5. Ensure SESSION_SECRET is set:
   ```
   openssl rand -base64 32
   ```

## Expected Behavior After Fix

✅ Rate limiting works correctly  
✅ Sessions persist  
✅ No DNS errors  
✅ Registration succeeds  
✅ Users can log in  

## Testing

After deploying these fixes:
1. Try to register a new user
2. Check logs for any remaining errors
3. Verify session persistence by refreshing the page

## Files Changed

- `server/index.ts` - Added trust proxy
- `server/storage.ts` - Added DATABASE_URL validation

## Next Steps

1. Commit and push these changes
2. Check Replit DATABASE_URL configuration
3. Redeploy if needed
4. Test registration

