# Leads Management System - What Exists vs What's Needed

Quick reference comparing current codebase (Invoice Management) with new Leads Management requirements.

---

## 🗄️ DATA SCHEMA

### ✅ Currently Exists
- `users` table (can be adapted for contractors)
- `bankAccounts` table (may not be needed for leads MVP)
- Basic authentication system
- Database connection setup (Drizzle ORM)
- Migration infrastructure

### ❌ New Tables Needed
1. **categories** - Service categories (plumbing, electrical, HVAC, etc.)
   - Completely new
   
3. **leads** - Customer leads available for bidding
   - Completely new
   
4. **bids** - Contractor bids on leads
   - Completely new
   
5. **messages** - Platform messaging for lead communication
   - Similar to a chat/messaging system
   
6. **strike_logs** - Audit trail for non-responses
   - Completely new
   
7. **ban_appeals** - Appeals for bidding bans
   - Completely new
   
8. **conversions** - Track lead conversions
   - Completely new
   
9. **contractor_metrics** - Denormalized analytics
   - Similar to analytics/dashboard data

**Note**: The `users` table will be **extended** with contractor-specific fields. No separate contractors table needed. Contractors are users with `is_contractor = TRUE` and additional fields like `strike_count`, `is_bidding_banned`, `contractor_categories`, etc.

---

## 🎨 FRONTEND

### ✅ Currently Exists
- React 18+ setup
- Tailwind CSS + shadcn/ui components
- TanStack Query (React Query) - **Verify if installed**
- Routing system
- Authentication pages (Login, Register)
- Dashboard page (but for invoices, not leads)
- Settings page
- Onboarding flow
- ThemeProvider, protected routes

### ❌ New Pages Needed
1. **LeadsDashboard** (`/leads` or `/dashboard/leads`)
   - Lead discovery with filters
   - Lead card grid
   - Bid placement UI
   - Real-time countdown timers
   
2. **BidManagement** (`/bids/active`)
   - Active response windows
   - Message composer with Tiptap
   - Countdown timers for 2-hour windows
   
3. **BidHistory** (`/bids/history`)
   - Past bids table
   - Conversion metrics
   - Lead history

### ❌ New Components Needed
1. **LeadCard** - Individual lead display
2. **LeadFilters** - Sidebar filter component
3. **BidInput** - Bid multiplier slider/input
4. **ResponseWindow** - Active response window card
5. **MessageComposer** - Tiptap-based message editor
6. **BanAppealModal** - Ban appeal form
7. **StrikeCounter** - Strike count display
8. **MetricsSummary** - Dashboard metrics cards
9. **CountdownTimer** - Reusable countdown component
10. **UrgencyBadge** - Urgency level badge

### ❌ New Dependencies Needed
1. **Tiptap** - Rich text editor (`@tiptap/react`, `@tiptap/starter-kit`)
2. **Socket.io Client** - Real-time updates (`socket.io-client`)
3. **Zustand** - Client state management (`zustand`) - **Verify if installed**
4. **Day.js or date-fns** - Date/time utilities - **Verify if installed**

### ❌ New Infrastructure Needed
1. **WebSocket Setup** - Socket.io client integration
2. **Real-time State Management** - WebSocket event handlers
3. **Background Job System** - Bull queue for:
   - Bid expiry checks
   - Bidding closure
   - Strike application
   - Lead archiving

---

## 🔄 ADAPTATION STRATEGY

### ✅ Approach: Extend Existing `users` Table
- Add contractor-specific fields to `users` table
- Use `is_contractor` boolean flag to identify contractors
- Contractor-specific fields only populated for contractors
- **Pros**: Single auth system, simpler, no relationship management
- **Cons**: Mixed concerns, but acceptable for MVP
- All foreign keys reference `users.id` (contractor_id = user.id where is_contractor = TRUE)

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 1: Database & Backend
- [ ] Create `contractors` table (or extend `users`)
- [ ] Create `categories` table + seed data
- [ ] Create `leads` table
- [ ] Create `bids` table
- [ ] Create `messages` table
- [ ] Create `strike_logs` table
- [ ] Create `ban_appeals` table
- [ ] Create `conversions` table
- [ ] Create `contractor_metrics` table
- [ ] Add all required indexes
- [ ] Create API endpoints for leads, bids, messages
- [ ] Set up Bull queue for background jobs
- [ ] Implement WebSocket server (Socket.io)

### Phase 2: Frontend Scaffolding
- [ ] Install missing dependencies (Tiptap, Socket.io client, Zustand)
- [ ] Create base layout for Leads Dashboard
- [ ] Set up routing for `/leads`, `/bids/active`, `/bids/history`
- [ ] Create LeadCard component
- [ ] Create LeadFilters sidebar component
- [ ] Integrate Socket.io client
- [ ] Set up TanStack Query hooks for API calls

### Phase 3: Core Features
- [ ] Build bid placement flow
- [ ] Build response window UI
- [ ] Integrate Tiptap for message editor
- [ ] Build countdown timer components
- [ ] Build strike counter display
- [ ] Build ban appeal modal
- [ ] Build metrics dashboard

### Phase 4: Real-time & Polish
- [ ] Implement WebSocket event handlers
- [ ] Add toast notifications for events
- [ ] Implement responsive design
- [ ] Add accessibility features
- [ ] Add error handling & validation
- [ ] Testing (unit, integration, E2E)

---

## 🤔 DECISIONS NEEDED

1. **Users vs Contractors**: Separate table or extend existing?
2. **Routing**: Use `/leads` or integrate into existing `/dashboard`?
3. **Auth Integration**: How to link contractors to existing user auth?
4. **UI Library**: Continue with shadcn/ui or add new components?
5. **Real-time Strategy**: Socket.io only or add Server-Sent Events fallback?

