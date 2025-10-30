# Fixing Neon "Endpoint Disabled" Error

## Error Message
```
{"error":"The endpoint has been disabled. Enable it using Neon API and retry."}
```

## Common Causes

1. **Database auto-paused** - Neon pauses databases after inactivity to save resources
2. **Endpoint manually disabled** - Someone disabled it in the Neon dashboard
3. **Free tier limits** - Database went to sleep mode

## Solutions

### Option 1: Re-enable via Neon Dashboard (Easiest)

1. **Go to Neon Console**
   - Visit: https://console.neon.tech
   - Log in to your account

2. **Find Your Project**
   - Select your project from the dashboard
   - Navigate to your database

3. **Enable the Endpoint**
   - Look for the database endpoint status
   - Click "Resume" or "Enable" if it shows as paused
   - Wait 10-30 seconds for it to wake up

4. **Verify Connection**
   ```bash
   psql $DATABASE_URL -c "SELECT version();"
   ```

### Option 2: Use Neon API to Enable Endpoint

If you have API access, you can enable it programmatically:

```bash
# Get your API key from Neon dashboard → Settings → Developer Settings
export NEON_API_KEY="your-api-key"

# List your projects
curl -X GET "https://console.neon.tech/api/v2/projects" \
  -H "Authorization: Bearer $NEON_API_KEY"

# Enable endpoint (replace PROJECT_ID and ENDPOINT_ID)
curl -X POST "https://console.neon.tech/api/v2/projects/PROJECT_ID/endpoints/ENDPOINT_ID/start" \
  -H "Authorization: Bearer $NEON_API_KEY"
```

### Option 3: Use Neon CLI

```bash
# Install Neon CLI
npm install -g neonctl

# Login
neonctl auth

# List projects
neonctl projects list

# Start/Resume endpoint
neonctl projects start PROJECT_ID
```

### Option 4: Update DATABASE_URL

Sometimes the endpoint changes. Get a fresh connection string:

1. Go to Neon Dashboard → Your Project → Connection Details
2. Copy the new connection string
3. Update your `.env` file:
   ```bash
   DATABASE_URL="postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require"
   ```

### Option 5: Create a New Endpoint

If re-enabling doesn't work:

1. Go to Neon Dashboard → Your Project
2. Click "Create Endpoint" or "Add Endpoint"
3. Choose "Primary" or "Read-Write" endpoint
4. Copy the new connection string
5. Update your `DATABASE_URL`

## Prevention

### For Development (Free Tier)
- The database will auto-pause after ~5 minutes of inactivity
- First connection after pause takes 10-30 seconds (cold start)
- This is normal behavior for Neon's free tier

### For Production
- Upgrade to Neon Pro/Scale plan for always-on databases
- Or use connection pooling with Neon's built-in pooler
- Set up a keep-alive script to ping the database periodically

## Quick Test

After re-enabling, test your connection:

```bash
# Test connection
psql $DATABASE_URL -c "SELECT NOW();"

# Or use the verify script
npm run db:verify
```

## Troubleshooting

If it still doesn't work:

1. **Check DATABASE_URL format**
   ```bash
   echo $DATABASE_URL | grep -o "postgresql://.*"
   ```

2. **Verify credentials**
   - Make sure username/password are correct
   - Check if password was rotated

3. **Check Neon dashboard status**
   - Look for any error messages
   - Check database usage/quota limits

4. **Try a fresh connection string**
   - Generate new credentials if needed
   - Update DATABASE_URL with new values

## Need More Help?

- Neon Documentation: https://neon.tech/docs
- Neon Discord: https://discord.gg/neondatabase
- Neon Status Page: https://status.neon.tech

