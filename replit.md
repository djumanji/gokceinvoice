# Invoice Management System

## Overview

A full-stack invoice management platform built with React, Express.js, PostgreSQL, and Drizzle ORM. The system enables freelancers and small businesses to create, manage, and track invoices with features including client management, service catalogs, expense tracking, and analytics. The application supports both local authentication and OAuth providers (Google, GitHub), with multi-tenant data isolation ensuring secure separation of user data.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System**
- **React 18** with TypeScript for type safety and modern component development
- **Vite** as the build tool, chosen for fast development server and optimized production builds
- **Wouter** for lightweight client-side routing (alternative to React Router)

**State Management & Data Fetching**
- **TanStack Query (React Query)** for server state management, caching, and data synchronization
- Eliminates need for global state management (Redux/Context) for server data
- Automatic background refetching and cache invalidation

**UI Component Strategy**
- **shadcn/ui** with **Radix UI** primitives for accessible, customizable components
- **Tailwind CSS** for utility-first styling with custom design tokens
- **Recharts** for data visualization and analytics dashboards
- **Lottie** animations (@lottiefiles/dotlottie-react) for enhanced UX on auth pages

**Path Aliases**
- `@/*` maps to `client/src/*` for clean imports
- `@shared/*` maps to `shared/*` for shared types and schemas
- `@assets/*` maps to `attached_assets/*` for static assets

### Backend Architecture

**Server Framework**
- **Express.js** with TypeScript for type-safe API development
- **Session-based authentication** using express-session with PostgreSQL store (connect-pg-simple)
- **Passport.js** for OAuth integration (Google, GitHub)

**Security Layer**
- **CSRF protection** using `csrf` tokens library with double-submit cookie pattern
- **Helmet.js** for security headers (CSP, HSTS, etc.)
- **Rate limiting** (express-rate-limit) on authentication endpoints to prevent brute force attacks
- **DOMPurify** for XSS protection via input sanitization
- **bcryptjs** for password hashing (10 rounds)
- Multi-tenant data isolation through user ID filtering on all queries

**API Design**
- RESTful endpoints organized by resource (clients, invoices, services, expenses)
- Controller-based architecture separating route handling from business logic
- Middleware chain: requireAuth → validateCsrf → sanitizeBody → controller
- File uploads handled via **Multer** (in-memory storage, 10MB limit, image-only validation)

**Background Jobs**
- **node-cron** for scheduled tasks (invoice scheduling, recurring invoices)
- Cron job processes scheduled invoices based on send dates

### Database Architecture

**Database System**
- **PostgreSQL 17** for relational data with ACID compliance
- **Drizzle ORM** for type-safe database queries and schema management
- Connection pooling (max 10 connections, 20s idle timeout)

**Schema Design**
- **Multi-tenant isolation**: All tables include `user_id` foreign key
- **Enums** for constrained values (invoice_status, payment_method, currency, etc.)
- **Composite indexes** for performance on multi-column queries (16+ optimized indexes)
- **Foreign key constraints** with CASCADE deletes for data integrity

**Key Tables**
- `users` - User accounts with OAuth provider support, email verification, password reset
- `clients` - Customer information linked to users
- `invoices` - Invoice headers with status tracking, scheduling, and recurrence
- `line_items` - Invoice line items (many-to-one with invoices)
- `services` - Service catalog for quick invoice creation
- `expenses` - Expense tracking with receipt uploads
- `bank_accounts` - Payment details for invoices
- `projects` - Project organization (optional grouping)

**Performance Optimizations**
- Indexed columns: user_id (all tables), email (users), invoice_number (invoices), status (invoices)
- Compound indexes for common query patterns (user_id + created_at, user_id + status)
- Unique constraints on business keys (email, invoice_number per user)

### External Dependencies

**Cloud Storage**
- **AWS S3** for receipt and invoice document storage
- **@aws-sdk/client-s3** and **@aws-sdk/s3-request-presigner** for file operations and signed URLs
- Uploads handled server-side with pre-signed URL generation for client downloads

**Email Service**
- Email verification and password reset flows implemented
- Email service abstraction in `server/services/email-service.ts`
- Configuration expects SMTP credentials or email service API keys in environment variables

**OAuth Providers**
- **Google OAuth 2.0** - passport-google-oauth20 strategy
- **GitHub OAuth** - passport-github2 strategy
- Strategies only initialized if credentials present in environment (graceful degradation)

**Analytics & Monitoring** (Optional)
- **Mixpanel** client-side analytics (mixpanel-browser)
- **PostHog** product analytics (posthog-js)
- Both configured to exclude from Vite optimization

**Development Tools**
- **Playwright** for E2E testing (Chromium, Firefox, WebKit)
- **Drizzle Kit** for database migrations
- **Replit integrations** (@replit/vite-plugin-runtime-error-modal, cartographer, dev-banner)

**Version Control Integration**
- **@octokit/rest** for GitHub API integration (repository creation from Replit)

**Mobile App** (React Native)
- Separate mobile app in `/mobile` directory
- **Expo** framework for cross-platform development
- **React Navigation** for mobile routing
- Shares backend API with web application
- Separate package.json with mobile-specific dependencies

### Configuration Management

**Environment Variables** (via .env)
- `DATABASE_URL` - PostgreSQL connection string (required)
- `SESSION_SECRET` - Session encryption key (required)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` - Google OAuth (optional)
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL` - GitHub OAuth (optional)
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`, `AWS_REGION` - S3 storage (optional)
- `VITE_E2E_BYPASS_AUTH` - Test mode to bypass authentication (development/testing only)

**Trust Proxy**
- Enabled (`app.set('trust proxy', 1)`) for correct client IP detection behind reverse proxies
- Critical for rate limiting and session management on cloud platforms (Replit, Netlify)

### Deployment Architecture

**Production Build**
- Frontend: Vite builds static assets to `dist/public`
- Backend: esbuild bundles server code to `dist/index.js` (ESM format)
- Server serves frontend as static files in production mode

**Database Provisioning**
- Scripts in `scripts/database-scripts/` for setup and verification
- Migration system using Drizzle Kit (`npm run db:push`)
- Setup script creates tables and initial indexes

**Hosting Considerations**
- Designed for platforms with PostgreSQL support
- Session storage requires database (not compatible with serverless edge functions without modifications)
- File uploads to S3 allow horizontal scaling without local storage dependencies