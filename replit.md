# Overview

This is a modern invoice management system built with React, Express, and PostgreSQL. The application provides a complete solution for creating and managing invoices, clients, services, and expenses with secure multi-tenant architecture. Key features include:

- Secure authentication (local email/password + OAuth with Google/GitHub)
- Invoice creation, tracking, and management with multiple status states
- Client and service catalog management
- Expense tracking with receipt uploads to AWS S3
- Dashboard with analytics and data visualization
- Dark mode support
- Multi-tenant data isolation with user-based access control

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Core Technology Stack:**
- React 18 with TypeScript for type safety
- Vite as the build tool for fast development and optimized production builds
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management, caching, and data fetching
- Tailwind CSS with shadcn/ui component library for consistent UI design
- Recharts for data visualization on the dashboard

**Key Design Decisions:**
- Component-based architecture with reusable UI components in `client/src/components/`
- Custom hooks in `client/src/hooks/` for shared logic (e.g., onboarding state)
- Protected routes using `ProtectedRoute` component to enforce authentication
- Global loading state with `LoadingModal` component
- Theme system supporting dark/light modes via `ThemeProvider`
- Internationalization setup with i18next for multi-language support
- Client-side form validation using React Hook Form with Zod schema validation

## Backend Architecture

**Core Technology Stack:**
- Express.js with TypeScript for the REST API
- PostgreSQL 17 as the primary database
- Drizzle ORM for type-safe database queries and migrations
- Session-based authentication using express-session with PostgreSQL session store
- CSRF protection using `csrf` tokens library
- Rate limiting with express-rate-limit to prevent brute force attacks

**Security Measures:**
- Helmet.js for security headers (CSP, HSTS, etc.)
- DOMPurify for XSS protection on user input
- bcrypt for password hashing
- Multi-tenant data isolation enforced at the database query level
- Session security with httpOnly, secure, and sameSite cookie settings
- Trust proxy configuration for cloud deployment (Replit, etc.)

**API Structure:**
- RESTful API endpoints organized by resource (`/api/clients`, `/api/invoices`, etc.)
- Authentication routes in `server/auth-routes.ts` (register, login, email verification, password reset)
- OAuth routes in `server/oauth.ts` (Google and GitHub strategies using Passport.js)
- Protected endpoints require authentication middleware (`requireAuth`)
- CSRF validation middleware on all mutation endpoints
- File upload handling with multer for in-memory processing before S3 upload

**Storage Layer:**
- Dual-storage architecture: `PgStorage` class in `server/postgres-storage.ts` for PostgreSQL operations
- Generic `IStorage` interface in `server/storage.ts` defining all data access methods
- Multi-tenant queries enforce userId filtering on all operations
- Transaction support for critical operations (e.g., invoice creation with line items)

## Data Storage

**Database:**
- PostgreSQL 17 with Drizzle ORM
- Schema defined in `shared/schema.ts` with Zod validation schemas
- Database migrations in `migrations/` directory
- Performance optimizations include 16+ indexes for common query patterns
- Foreign key constraints with cascade delete rules for data integrity
- Multi-tenant isolation with userId columns on all user-owned tables

**Schema Highlights:**
- `users` table: Supports both local and OAuth authentication (Google/GitHub)
- `clients` table: Client information with foreign key to users
- `invoices` table: Invoice header with status enum (draft, sent, viewed, partial, paid, overdue, cancelled, refunded)
- `line_items` table: Individual invoice line items
- `services` table: Reusable service catalog
- `expenses` table: Expense tracking with receipt storage
- `bank_accounts` table: Banking information for invoice payment details

**Session Storage:**
- PostgreSQL-backed session store using connect-pg-simple
- Sessions stored in database for persistence across server restarts
- Session cookie configuration for security (httpOnly, secure in production)

## External Dependencies

**Authentication & OAuth:**
- Passport.js for OAuth strategies
- Google OAuth: Requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_CALLBACK_URL`
- GitHub OAuth: Requires `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `GITHUB_CALLBACK_URL`
- Octokit REST API client for GitHub integration

**Email Service:**
- Resend API for transactional emails (email verification, password reset)
- Configuration: `RESEND_API_KEY` and `RESEND_FROM_EMAIL`
- Development: Uses `onboarding@resend.dev` (can only send to account owner)
- Production: Requires verified domain

**File Storage:**
- AWS S3 for receipt and invoice image uploads
- AWS SDK v3 (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)
- Configuration: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_S3_BUCKET`
- Pre-signed URLs for secure file uploads and downloads
- Automatic file cleanup when records are deleted

**Database Hosting:**
- Supabase PostgreSQL (recommended for Replit deployments - free tier available)
- Compatible with standard PostgreSQL connection strings
- Can use local PostgreSQL via Docker (docker-compose.yml provided)

**Analytics (Optional):**
- Mixpanel for product analytics
- PostHog for session recording and feature flags
- Both are optional and can be disabled via environment variables

**Testing:**
- Playwright for end-to-end testing
- Automated test suite in `tests/` directory
- Test reporter generates bug reports and integrates with Linear for issue tracking
- MCP (Model Context Protocol) integration for Playwright in `.cursor/mcp.json`

**Development Tools:**
- Vite dev server with HMR for fast development
- Replit-specific plugins for enhanced development experience
- ESLint for code quality
- Drizzle Kit for database migrations

**Environment Variables:**
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `NODE_ENV`: Environment mode (development/production)
- OAuth credentials for Google and GitHub
- AWS credentials for S3
- Resend API key for emails
- Optional analytics keys (Mixpanel, PostHog)