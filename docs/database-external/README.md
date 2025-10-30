# External Database Options

This directory contains guides for using external PostgreSQL databases with the Invoice Management System.

## Current Setup ✅

**Using: Replit Neon Integration (10GB free)**

- ✅ **Automatic setup** - Configured via Replit Tools → Database
- ✅ **Free 10GB storage** - Included with Replit
- ✅ **No personal account needed** - Managed by Replit
- ✅ **Simple and reliable** - Recommended for most use cases

See [`NEON_DATABASE_SETUP.md`](./NEON_DATABASE_SETUP.md) for setup instructions.

## Alternative Options

### Personal Neon Account (Optional)

If you need features beyond Replit's integration:
- Separate dev/prod branches with independent data
- Full control and visibility in Neon console
- More than 10GB storage
- Advanced Neon features (time-travel, branching, etc.)

See [`NEON_PERSONAL_SETUP.md`](./NEON_PERSONAL_SETUP.md) for setup guide.

**Note:** Personal Neon setup is optional. Replit Neon integration works great for most use cases.

## Database Configuration

The application supports both setups:

- **Replit Neon (Current):** Uses `DATABASE_URL` automatically set by Replit
- **Personal Neon:** Can use `DATABASE_URL` (dev) and `DATABASE_URL_PROD` (production)

See `server/db.ts` for environment-based database selection logic.

## Migration Scripts

Both setups use the same migration files in `/migrations`:
- `000_create_schema_safe.sql` - Base schema
- `001_critical_indexes.sql` - Performance indexes
- `002-019` - Feature migrations

Run migrations using:
```bash
bash migrations/run-all.sh
```

## Switching Between Setups

### From Replit Neon to Personal Neon

1. Set up personal Neon account (see `NEON_PERSONAL_SETUP.md`)
2. Run migrations on personal Neon databases
3. Update Replit Secrets using `scripts/configure-replit-neon.sh`
4. Restart Repl

### From Personal Neon to Replit Neon

1. Remove `DATABASE_URL_PROD` from Replit Secrets (if set)
2. Ensure `DATABASE_URL` points to Replit's Neon database
3. Run migrations on Replit Neon database
4. Restart Repl

## Support

- **Replit Neon Issues:** Check Replit documentation and support
- **Personal Neon Issues:** See Neon documentation at https://neon.tech/docs
- **Migration Issues:** See `../database/MIGRATION_GUIDE.md`
