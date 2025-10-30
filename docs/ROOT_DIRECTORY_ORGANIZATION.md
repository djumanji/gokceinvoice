# Root Directory Organization

## ✅ Files Organized

### 📁 scripts/database-scripts/
Database-related setup and utility scripts moved here:
- `setup-database.ts` - Database setup script
- `setup-neon-db.sh` - Neon database setup
- `setup-replit-db.sh` - Replit database setup  
- `verify-database.ts` - Database verification utility
- `create-tables.js` - Table creation script
- `create-test-user.ts` - Test user creation utility
- `run-migration.sh` - Migration runner script
- `one-time-migration.sql` - One-time migration SQL

### 📁 config/
Build tool configuration files:
- `components.json` - shadcn/ui components configuration

## 📋 Files Kept at Root (Required by Tools)

These files must remain at root as they're required by their respective tools:

**Build & Development Tools:**
- `vite.config.ts` - Vite bundler configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `postcss.config.js` - PostCSS configuration
- `playwright.config.ts` - Playwright test configuration
- `drizzle.config.ts` - Drizzle ORM configuration

**Deployment:**
- `netlify.toml` - Netlify deployment configuration
- `docker-compose.yml` - Docker Compose configuration

**Package Management:**
- `package.json` - Node.js dependencies
- `package-lock.json` - Dependency lock file

**Project Files:**
- `README.md` - Project documentation
- `.gitignore` - Git ignore rules
- `.replit` - Replit configuration
- `.semgrepignore` - Semgrep ignore rules

## 📝 Backup Files

The following backup files exist but are typically ignored by git:
- `.env.bak`, `.env.bak2`, `.env.bak3` - Environment file backups

**Recommendation:** These can be safely deleted if `.env` is properly configured, or moved to `backups/` directory if needed for reference.

## 🎯 Organization Benefits

1. **Cleaner Root**: Root directory now only contains essential project files
2. **Better Discoverability**: Database scripts are grouped together
3. **Standard Structure**: Follows common project organization patterns
4. **Easier Maintenance**: Related scripts are co-located

