# Invoice Management System

## Overview

This is a professional invoice management system built to create, track, and organize invoices with integrated client management. The application provides a clean, utility-focused interface for managing billing workflows with support for line items, client data, and invoice status tracking.

The system is designed as a full-stack web application with a React frontend and Express backend, featuring real-time data synchronization and a responsive UI that adapts to both light and dark themes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React 18 with TypeScript
- **Routing:** Wouter (lightweight client-side routing)
- **State Management:** TanStack Query (React Query) for server state
- **UI Components:** Radix UI primitives with shadcn/ui component library
- **Styling:** Tailwind CSS with custom design system
- **Build Tool:** Vite

**Design System:**
- Implements a hybrid design approach inspired by Linear's data presentation, Stripe's financial clarity, and Notion's organizational patterns
- Dual theme support (light/dark mode) with custom CSS variables
- Typography: Inter (primary) and JetBrains Mono (for invoice numbers/amounts)
- Color palette focused on professional financial presentation with semantic colors for invoice statuses (green for paid, amber for pending, red for overdue)
- Consistent spacing using Tailwind's spacing primitives

**Component Structure:**
- Page-level components in `client/src/pages/` (Dashboard, Invoices, CreateInvoice, Clients)
- Reusable UI components in `client/src/components/` (InvoiceForm, InvoiceTable, ClientCard, StatCard, etc.)
- UI primitives in `client/src/components/ui/` (shadcn components)
- Custom hooks in `client/src/hooks/`

**State Management Pattern:**
- TanStack Query for all API interactions with automatic caching and refetching
- Local component state for form data and UI interactions
- Theme state managed via React Context (ThemeProvider)
- Query invalidation on mutations to ensure data consistency

### Backend Architecture

**Technology Stack:**
- **Runtime:** Node.js with Express
- **Language:** TypeScript (ESNext modules)
- **Database ORM:** Drizzle ORM
- **Validation:** Zod schemas

**API Design:**
- RESTful endpoints organized by resource type
- Routes defined in `server/routes.ts`
- Endpoints follow pattern: `/api/{resource}` and `/api/{resource}/{id}`
- Request validation using Zod schemas derived from Drizzle tables

**Storage Abstraction:**
- Interface-based storage layer (`IStorage`) in `server/storage.ts`
- In-memory implementation (`MemStorage`) for development
- Designed to be swappable with database-backed implementation
- CRUD operations for Clients, Invoices, and LineItems

**Data Flow:**
1. Client makes API request
2. Express middleware validates and logs request
3. Route handler validates data with Zod schema
4. Storage layer performs operation
5. Response sent back with appropriate status code
6. Client-side React Query updates cache

### Database Schema

**Tables:**
- **clients:** Client contact information (id, name, email, phone, address)
- **invoices:** Invoice metadata (id, invoiceNumber, clientId, date, orderNumber, projectNumber, forProject, status, notes, subtotal, tax, total)
- **line_items:** Individual invoice line items (id, invoiceId, description, quantity, price, amount)

**Schema Design Decisions:**
- Uses PostgreSQL dialect (configured for Neon serverless)
- UUID primary keys via `gen_random_uuid()`
- Decimal type for monetary values to avoid floating-point precision issues
- Foreign key relationships through clientId and invoiceId
- Status field as text enum (draft, sent, paid, overdue)
- Zod schemas auto-generated from Drizzle tables for validation consistency

### Build and Development

**Development Mode:**
- Vite dev server with HMR for frontend
- Express server with tsx for TypeScript execution
- Middleware mode for Vite to serve frontend through Express
- Hot reload for both frontend and backend code

**Production Build:**
- Frontend: Vite builds to `dist/public`
- Backend: esbuild bundles server code to `dist/index.js`
- Single deployment artifact with static files served by Express

**Type Safety:**
- Shared types in `shared/schema.ts` used by both frontend and backend
- Path aliases configured (`@/` for client, `@shared/` for shared code)
- Strict TypeScript compilation with ESNext modules

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem:** react, react-dom, @tanstack/react-query
- **Routing:** wouter (lightweight alternative to react-router)
- **Forms:** react-hook-form with @hookform/resolvers for Zod integration

### UI Component Libraries
- **Radix UI:** Complete suite of unstyled, accessible components (@radix-ui/react-*)
- **shadcn/ui:** Pre-built component implementations using Radix primitives
- **Styling:** Tailwind CSS with class-variance-authority for component variants
- **Icons:** lucide-react
- **Utilities:** clsx, tailwind-merge for className management

### Backend Dependencies
- **Server:** Express with TypeScript support
- **Database:** 
  - Drizzle ORM (@drizzle-orm/pg-core) for type-safe queries
  - @neondatabase/serverless for PostgreSQL connection
  - drizzle-kit for migrations
- **Validation:** Zod for runtime type checking, drizzle-zod for schema generation
- **Session Management:** connect-pg-simple (configured but sessions not fully implemented)

### Build Tools
- **Vite:** Frontend build tool and dev server
- **esbuild:** Backend bundler
- **tsx:** TypeScript execution for development
- **Tailwind CSS:** Utility-first CSS framework with PostCSS

### Development Tools (Replit-specific)
- @replit/vite-plugin-runtime-error-modal
- @replit/vite-plugin-cartographer
- @replit/vite-plugin-dev-banner

### Database Configuration
- **Provider:** Neon serverless PostgreSQL
- **Connection:** Uses DATABASE_URL environment variable
- **Migration Strategy:** Drizzle Kit with push command for schema sync
- **Note:** Application structure supports Drizzle ORM generally, not locked to PostgreSQL specifically