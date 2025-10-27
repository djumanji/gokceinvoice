# Invoice Management System

## Overview

A multi-tenant invoice management system built with React, Express, TypeScript, and PostgreSQL. The application enables users to create, manage, and track invoices, clients, and services with comprehensive authentication support (local credentials and OAuth). Features a clean, professional UI inspired by Linear, Stripe Dashboard, and Notion design patterns.

**Core Purpose**: Streamline billing workflows for freelancers and small businesses by providing an intuitive interface for invoice creation, client management, and financial tracking.

**Tech Stack**:
- Frontend: React 18 + TypeScript, Vite, TanStack Query, Wouter routing, Tailwind CSS + shadcn/ui
- Backend: Express.js + TypeScript, PostgreSQL 17, Drizzle ORM
- Authentication: Passport.js with local strategy and OAuth (Google, GitHub)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Component Structure**: Page-based routing with reusable UI components from shadcn/ui library. All components follow a consistent design system with light/dark mode support.

**State Management**: TanStack Query for server state with built-in caching and optimistic updates. Local UI state managed with React hooks.

**Routing**: Wouter for lightweight client-side routing. Protected routes enforce authentication checks before rendering sensitive pages.

**Design Tokens**: Centralized theming using CSS variables (HSL color format). Supports seamless theme switching between light and dark modes via ThemeProvider context.

**Form Handling**: React Hook Form with Zod validation for type-safe form schemas. All user input is validated client-side before submission.

**Data Fetching Pattern**: Global API loading tracker to provide unified loading states across requests. Custom `apiRequest` wrapper handles authentication, error responses, and loading state coordination.

**Onboarding Flow**: Step-by-step guided setup requiring users to create at least one client, service, and invoice before accessing the main dashboard. Progress tracked via dedicated hook (`useOnboardingGuard`).

### Backend Architecture

**Storage Layer Abstraction**: Dual implementation (in-memory `MemStorage` and PostgreSQL `PgStorage`) via unified `IStorage` interface. All database operations go through this abstraction, enabling easy testing and potential storage backend swaps.

**Multi-Tenant Data Isolation**: Every database query filters by `userId` to enforce complete data separation between users. Foreign keys cascade deletes for users while restricting deletes on referenced entities (e.g., cannot delete client with existing invoices).

**Authentication Flow**:
- Local strategy: bcrypt password hashing with express-session for stateful auth
- OAuth: Passport.js strategies for Google and GitHub (optional, only configured if credentials present)
- Session management: MemoryStore with 7-day cookie expiration, CSRF protection via sameSite: 'strict'

**Security Measures**:
- Rate limiting on auth endpoints (5 attempts per 15 minutes in production)
- XSS protection via DOMPurify for all user-generated content
- Server-side calculation validation for invoice totals to prevent tampering
- Database-level constraints and foreign keys for data integrity

**API Design**: RESTful endpoints with consistent error handling. All routes under `/api/*` require authentication via middleware. Returns appropriate HTTP status codes (401 for auth failures, 404 for not found, 400 for validation errors).

**Invoice Number Generation**: Atomic server-side generation using PostgreSQL queries to prevent race conditions. Sequential numbering per user (INV-000001, INV-000002, etc.).

**Input Sanitization**: Dedicated sanitization service using DOMPurify to strip HTML tags and attributes from user input before storage.

### Database Schema

**Core Tables**:
- `users`: Authentication data, supports local and OAuth providers
- `clients`: Customer information with contact details and payment terms
- `invoices`: Invoice records with status tracking (draft, sent, paid, overdue)
- `line_items`: Individual invoice line items with quantity/price
- `services`: Reusable service catalog for quick invoice creation

**Relationship Design**:
- One-to-many: users → clients, users → invoices, users → services, invoices → line_items
- Foreign keys: CASCADE on user deletion (removes all user data), RESTRICT on client deletion (prevents deletion if invoices exist)

**Performance Optimizations**:
- 16+ indexes on foreign keys and frequently queried columns
- Atomic invoice number generation to eliminate race conditions
- Database-level defaults and constraints for data integrity

**Known Limitations**: Uses VARCHAR for UUIDs instead of native UUID type (legacy decision). Schema includes migration files for adding critical indexes and security constraints.

## External Dependencies

### Database
- **PostgreSQL 17**: Primary data store, connection via `postgres.js` client
- **Drizzle ORM**: Type-safe database queries with schema definitions in `shared/schema.ts`
- **Environment Configuration**: `DATABASE_URL` required for database connection

### Authentication Services
- **Passport.js**: OAuth provider integration
- **Google OAuth** (optional): Requires `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`
- **GitHub OAuth** (optional): Requires `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL`
- **bcrypt.js**: Password hashing for local authentication

### Third-Party Libraries
- **express-session**: Session management with MemoryStore
- **express-rate-limit**: Brute force protection on auth endpoints
- **DOMPurify** (isomorphic): XSS prevention via HTML sanitization
- **Zod**: Runtime type validation for API requests and form schemas
- **TanStack Query**: Server state management and caching
- **shadcn/ui + Radix UI**: Pre-built accessible UI components
- **Tailwind CSS**: Utility-first styling framework
- **GSAP**: Animation library for loading states
- **Mixpanel**: Analytics tracking (token: `0ff4af01f6a3ed3ff6030cafbe6305c6`, EU endpoint)

### Development Tools
- **Vite**: Development server and build tool with HMR
- **TypeScript**: Type safety across frontend and backend
- **Replit Integrations**: Cartographer and dev banner plugins (development only)

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Cryptographically secure session encryption key (required)
- `NODE_ENV`: Environment flag (`development` or `production`)
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` (optional for OAuth)
- `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_CALLBACK_URL` (optional for OAuth)

### Deployment Considerations
- Designed for Replit deployment with included `.replit` and `replit.nix` configuration files
- Database migrations available in `/migrations/` directory
- Quick start guide in `REPLIT_QUICK_START.md` for 10-minute deployment
- Supports Docker-based PostgreSQL for local development via `docker-compose.yml`