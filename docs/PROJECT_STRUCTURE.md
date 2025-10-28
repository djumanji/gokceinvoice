# Project Structure Overview

This document provides a visual overview of the project's organization after recent restructuring.

## 📁 Root Directory Structure

```
gokceinvoice/
│
├── 📄 Configuration Files
│   ├── package.json              # Dependencies and scripts
│   ├── tsconfig.json             # TypeScript configuration
│   ├── vite.config.ts            # Vite build configuration
│   ├── tailwind.config.ts        # Tailwind CSS configuration
│   ├── postcss.config.js         # PostCSS configuration
│   ├── drizzle.config.ts         # Drizzle ORM configuration
│   ├── components.json           # shadcn/ui components config
│   ├── docker-compose.yml        # PostgreSQL Docker setup
│   └── .env                      # Environment variables (gitignored)
│
├── 📚 Documentation (docs/)
│   ├── security/                 # Security audits and fixes
│   │   ├── COMPLETE_SECURITY_AUDIT.md
│   │   └── SECURITY_FIXES.md
│   ├── database/                 # Database documentation
│   │   ├── DATABASE_SUMMARY.md          ⭐ Quick reference
│   │   ├── DATABASE_ASSESSMENT.md       📊 Full assessment
│   │   ├── MIGRATION_GUIDE.md           🔧 How to migrate
│   │   ├── DATABASE_CHECKLIST.md        ✅ Progress tracking
│   │   ├── DATABASE_SCHEMA_DIAGRAM.md   📐 Visual diagrams
│   │   ├── DATABASE_COMMANDS.md         💻 Common commands
│   │   └── PGADMIN_SETUP.md            🛠️ PgAdmin guide
│   ├── design/                   # Design documentation
│   │   ├── design_guidelines.md
│   │   └── REFACTORING_OPPORTUNITIES.md
│   └── README.md                 # Documentation index
│
├── 💾 Database (migrations/)
│   ├── 001_critical_indexes.sql          ✅ Applied
│   ├── 002_data_integrity_constraints.sql ⏳ Pending
│   ├── 003_row_level_security.sql        ⏳ Pending
│   └── 004_invoice_number_fix.sql        ✅ Applied
│
├── 🖼️ Assets (assets/)
│   ├── competitor-screenshots/   # UI/UX references
│   └── generated-icon.png        # App icon
│
├── 💿 Backups (backups/)
│   └── backup_YYYYMMDD_HHMMSS.sql # Database backups
│
├── 🎨 Frontend (client/)
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── ui/             # shadcn/ui components
│   │   │   ├── AppSidebar.tsx
│   │   │   ├── ClientCard.tsx
│   │   │   ├── InvoiceForm.tsx
│   │   │   ├── LoadingModal.tsx
│   │   │   ├── OnboardingProgressBanner.tsx
│   │   │   ├── ProtectedRoute.tsx
│   │   │   └── ThemeProvider.tsx
│   │   ├── hooks/              # Custom hooks
│   │   │   ├── use-onboarding.ts
│   │   │   ├── use-toast.ts
│   │   │   └── use-mobile.tsx
│   │   ├── lib/                # Utilities
│   │   │   ├── queryClient.ts  # React Query setup
│   │   │   └── utils.ts
│   │   ├── pages/              # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Invoices.tsx
│   │   │   ├── CreateInvoice.tsx
│   │   │   ├── Clients.tsx
│   │   │   ├── Services.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Onboarding.tsx
│   │   │   └── not-found.tsx
│   │   ├── App.tsx             # Root component
│   │   ├── main.tsx            # Entry point
│   │   └── index.css           # Global styles
│   ├── public/                 # Static assets
│   └── index.html              # HTML template
│
├── ⚙️ Backend (server/)
│   ├── auth.ts                 # Auth utilities
│   ├── auth-routes.ts          # Auth endpoints
│   ├── oauth.ts                # OAuth providers
│   ├── routes.ts               # API routes
│   ├── storage.ts              # In-memory storage
│   ├── postgres-storage.ts     # PostgreSQL impl
│   ├── sanitize.ts             # XSS protection
│   ├── middleware.ts           # Auth middleware
│   ├── index.ts                # Server entry
│   └── vite.ts                 # Vite dev server
│
└── 🔄 Shared (shared/)
    └── schema.ts               # DB schema + types
```

## 📊 File Count Summary

| Category | Count |
|----------|-------|
| Root configuration files | 9 |
| Security documents | 2 |
| Database documents | 7 |
| Design documents | 2 |
| Database migrations | 4 |
| Frontend pages | 9 |
| Frontend components | 10+ |
| Backend modules | 9 |
| Total documentation files | 11+ |

## 🎯 Key Changes Made

### Before Cleanup
- 34 files in root directory
- No organized documentation structure
- Scattered temporary files
- No clear project overview

### After Cleanup
- 17 configuration files in root (lean)
- 3 organized documentation directories
- Dedicated backups and assets folders
- Clear README and structure guide
- All temporary files removed

## 📝 File Naming Conventions

### Documentation
- `UPPERCASE_WORDS.md` - Important reference documents
- `lowercase_words.md` - Guidelines and notes
- `README.md` - Index/overview files

### Code Files
- `kebab-case.tsx/ts` - React components and pages
- `camelCase.ts` - Utilities and services
- `PascalCase.tsx` - React component files

### Database
- `001_descriptive_name.sql` - Migration files (numbered)

## 🔍 Finding What You Need

| I want to... | Go to... |
|--------------|----------|
| Set up the project | `README.md` |
| Understand security | `docs/security/` |
| Learn about database | `docs/database/DATABASE_SUMMARY.md` |
| Review design decisions | `docs/design/` |
| Find API routes | `server/routes.ts` |
| Add a new page | `client/src/pages/` |
| Create a component | `client/src/components/` |
| Modify database schema | `shared/schema.ts` |
| Add migration | `migrations/` |

## 🚀 Quick Commands

```bash
# Development
npm run dev              # Start dev server

# Documentation
cat docs/README.md       # View docs index
cat README.md            # View project README

# Database
psql $DATABASE_URL       # Connect to database
cd migrations && ls      # List migrations

# Project structure
tree -L 2 -I 'node_modules|dist'  # View structure
```

## 📦 What's Where

### Frontend Application (`client/`)
All React code, components, pages, and styles

### Backend API (`server/`)
Express server, routes, authentication, database

### Shared Code (`shared/`)
TypeScript types and database schema used by both frontend and backend

### Database (`migrations/`)
SQL migration files for database schema changes

### Documentation (`docs/`)
All project documentation organized by topic

### Assets (`assets/`)
Images, icons, and reference materials

### Backups (`backups/`)
Database backup files (gitignored)

---

*This structure follows industry best practices for full-stack TypeScript applications.*
*Last updated: 2025-10-27*
