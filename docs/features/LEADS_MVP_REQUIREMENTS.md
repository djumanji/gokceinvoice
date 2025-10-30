# Leads Management System - Frontend & Data Schema Requirements

This document extracts the **Frontend Requirements** and **Data Schema Requirements** from the comprehensive MVP specification for the B2B lead generation and bidding platform.

---

## 📊 DATA SCHEMA REQUIREMENTS

### Database Tables

#### 1. Users Table (Extended for Contractors)
**Purpose**: Existing users table extended with contractor-specific fields

**NOTE**: The existing `users` table will be extended with these additional fields. Contractors are users with contractor-specific data.

```sql
-- Existing users table fields (already exist):
-- id, email, username, password, provider, providerId, 
-- isEmailVerified, name, companyName, phone, etc.

-- NEW fields to ADD to users table:
ALTER TABLE users ADD COLUMN service_area_zip_codes TEXT; -- JSON array of zip codes
ALTER TABLE users ADD COLUMN contractor_categories TEXT; -- JSON array of category IDs
ALTER TABLE users ADD COLUMN profile_rating DECIMAL(3,2) DEFAULT 0.00; -- 0.00 to 5.00
ALTER TABLE users ADD COLUMN response_rate DECIMAL(3,2) DEFAULT 0.00; -- Conversion %
ALTER TABLE users ADD COLUMN strike_count INT DEFAULT 0;
ALTER TABLE users ADD COLUMN is_bidding_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN subscription_tier VARCHAR(50); -- 'starter', 'pro', 'enterprise' (future)
ALTER TABLE users ADD COLUMN subscription_renewal_date DATE;
ALTER TABLE users ADD COLUMN lead_discount_multiplier DECIMAL(3,2) DEFAULT 1.00; -- Based on rating
ALTER TABLE users ADD COLUMN is_contractor BOOLEAN DEFAULT FALSE; -- Flag to identify contractors

-- NEW indexes for contractor fields:
CREATE INDEX idx_users_contractor_categories ON users USING GIN (contractor_categories) WHERE is_contractor = TRUE;
CREATE INDEX idx_users_is_bidding_banned ON users(is_bidding_banned) WHERE is_contractor = TRUE;
CREATE INDEX idx_users_service_area ON users USING GIN (service_area_zip_codes) WHERE is_contractor = TRUE;
CREATE INDEX idx_users_is_contractor ON users(is_contractor);
```

#### 2. Categories Table
**Purpose**: Service categories (plumbing, electrical, HVAC, etc.)

```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY,
  slug VARCHAR(50) UNIQUE NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. Leads Table
**Purpose**: Customer leads available for bidding

```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES categories(id),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_zip_code VARCHAR(10) NOT NULL,
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  urgency_level VARCHAR(20), -- 'low', 'medium', 'high', 'urgent'
  service_area_radius_km INT, -- Radius from customer zip
  lead_source VARCHAR(50) NOT NULL, -- 'google_local_services', 'facebook_leads', etc.
  base_lead_cost DECIMAL(10,2) NOT NULL, -- Platform's cost before multiplier
  status VARCHAR(50) DEFAULT 'CREATED', -- See state machine
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  bidding_closes_at TIMESTAMP, -- 30 min after creation
  metadata JSONB, -- Source-specific data, qualification scores
  is_qualified BOOLEAN DEFAULT FALSE -- Has passed all qualification rules
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_category ON leads(category_id);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX idx_leads_bidding_closes ON leads(bidding_closes_at) WHERE status IN ('CREATED', 'ACTIVE');
```

**Lead Status Values**:
- `CREATED`: Lead ingested, awaiting bid period (configurable, default 30 minutes)
- `ACTIVE`: Open for bidding
- `BIDDING_CLOSED`: Bidding ended, top 3 identified
- `PENDING_RESPONSE_1/2/3`: Contractor N has active 2-hour response window
- `CONTACTED`: At least one contractor sent message (conversion achieved)
- `EXPIRED`: All 3 contractors failed to respond within windows
- `ARCHIVED`: Lead older than 30 days or manually archived

#### 4. Bids Table
**Purpose**: Contractor bids on leads

```sql
CREATE TABLE bids (
  id UUID PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id),
  contractor_id UUID NOT NULL REFERENCES users(id), -- Users who are contractors
  bid_multiplier DECIMAL(3,2) NOT NULL, -- 0.5 to 2.0 (50% to 200% of base)
  final_bid_amount DECIMAL(10,2) NOT NULL, -- base_lead_cost * bid_multiplier * discount_multiplier
  bid_rank INT, -- 1, 2, or 3 (top 3 only)
  bid_placed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'ACTIVE', -- 'ACTIVE', 'WON', 'LOST', 'EXPIRED'
  response_window_starts_at TIMESTAMP, -- When contractor gets 2-hour window
  response_window_ends_at TIMESTAMP, -- 2 hours after starts_at
  responded_at TIMESTAMP, -- When contractor sends first message
  strike_applied BOOLEAN DEFAULT FALSE, -- True if window expired without response
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bids_lead ON bids(lead_id);
CREATE INDEX idx_bids_contractor ON bids(contractor_id);
CREATE INDEX idx_bids_status ON bids(status);
CREATE INDEX idx_bids_response_window ON bids(response_window_ends_at) WHERE status = 'ACTIVE';
CREATE UNIQUE INDEX idx_bids_lead_contractor ON bids(lead_id, contractor_id); -- One bid per contractor per lead
```

#### 5. Messages Table
**Purpose**: Platform messaging for lead communication

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id),
  sender_id UUID NOT NULL REFERENCES users(id), -- Users who are contractors
  recipient_id UUID, -- NULL if recipient is customer (future feature)
  message_text TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_lead ON messages(lead_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_sent_at ON messages(sent_at DESC);
```

#### 6. Strike Logs Table
**Purpose**: Audit trail for non-responses

```sql
CREATE TABLE strike_logs (
  id UUID PRIMARY KEY,
  contractor_id UUID NOT NULL REFERENCES users(id), -- Users who are contractors
  lead_id UUID NOT NULL REFERENCES leads(id),
  bid_id UUID NOT NULL REFERENCES bids(id),
  strike_reason VARCHAR(100), -- 'response_window_expired'
  strike_count_after INT NOT NULL,
  ban_triggered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_strike_logs_contractor ON strike_logs(contractor_id);
CREATE INDEX idx_strike_logs_created_at ON strike_logs(created_at DESC);
```

#### 7. Ban Appeals Table
**Purpose**: Appeals for bidding bans

```sql
CREATE TABLE ban_appeals (
  id UUID PRIMARY KEY,
  contractor_id UUID NOT NULL REFERENCES users(id), -- Users who are contractors
  appeal_reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING', -- 'PENDING', 'APPROVED', 'REJECTED'
  reviewed_by_id UUID, -- Admin user (future)
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ban_appeals_contractor ON ban_appeals(contractor_id);
CREATE INDEX idx_ban_appeals_status ON ban_appeals(status);
```

#### 8. Conversions Table
**Purpose**: Track lead conversions (contact events)

```sql
CREATE TABLE conversions (
  id UUID PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id),
  contractor_id UUID NOT NULL REFERENCES users(id), -- Users who are contractors
  conversion_type VARCHAR(50) DEFAULT 'contacted', -- 'contacted' for MVP
  converted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversions_lead ON conversions(lead_id);
CREATE INDEX idx_conversions_contractor ON conversions(contractor_id);
```

#### 9. Contractor Metrics Table
**Purpose**: Denormalized analytics for performance

```sql
CREATE TABLE contractor_metrics (
  id UUID PRIMARY KEY,
  contractor_id UUID NOT NULL UNIQUE REFERENCES users(id), -- Users who are contractors
  total_bids_placed INT DEFAULT 0,
  total_leads_won INT DEFAULT 0,
  total_leads_contacted INT DEFAULT 0,
  contact_rate DECIMAL(3,2) DEFAULT 0.00,
  avg_time_to_contact_minutes INT,
  total_spent DECIMAL(12,2) DEFAULT 0.00,
  roi DECIMAL(5,2), -- Return on ad spend (future)
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_contractor_metrics_contact_rate ON contractor_metrics(contact_rate DESC);
```

### Schema Relationships

```
users (1) ───< bids (N) [where is_contractor = TRUE]
users (1) ───< messages (N) [where is_contractor = TRUE]
users (1) ───< strike_logs (N) [where is_contractor = TRUE]
users (1) ───< ban_appeals (N) [where is_contractor = TRUE]
users (1) ───< conversions (N) [where is_contractor = TRUE]
users (1) ───< contractor_metrics (1) [where is_contractor = TRUE]

categories (1) ───< leads (N)
leads (1) ───< bids (N)
leads (1) ───< messages (N)
leads (1) ───< conversions (N)
```

---

## 🎨 FRONTEND REQUIREMENTS

### Technology Stack

- **Framework**: React 18+
- **State Management**: 
  - TanStack Query (React Query) for server state
  - Zustand for client state
- **UI Components**: Headless UI (Radix UI) + Tailwind CSS
- **Rich Text Editor**: Tiptap (MIT license) for message composition
- **Real-time**: Socket.io client
- **Date/Time**: Day.js or date-fns
- **Validation**: Zod (TypeScript-first schema validation)
- **HTTP Client**: Axios or native Fetch

### Pages & Components

#### 1. Lead Discovery Dashboard (`/dashboard` or `/leads`)

**Layout Structure**:
```
┌─────────────────────────────────────────────────────┐
│ Header: Contractor name, rating, strike count, nav  │
├──────────┬──────────────────────────────────────────┤
│          │                                          │
│ Sidebar  │         Lead Card Grid                   │
│ Filters  │         (3-col desktop, 2-col tablet,    │
│          │          1-col mobile)                    │
│          │                                          │
└──────────┴──────────────────────────────────────────┘
```

**Header Components**:
- Contractor name (from auth context)
- Profile rating badge (0.00 - 5.00, color-coded)
- Strike count display (only if > 0): "X strikes" with warning icon
- Navigation menu (hamburger on mobile)

**Left Sidebar Filters**:
- **Category Filter**: Multi-select dropdown/checkboxes
  - Display: Category display names
  - Storage: Category IDs
- **Urgency Level Filter**: Radio buttons or checkboxes
  - Options: Low, Medium, High, Urgent
  - Color coding hints: green=low, yellow=medium, orange=high, red=urgent
- **Budget Range Slider**: 
  - Min/Max inputs or dual-handle slider
  - Format: $X - $Y
- **Service Area Filter**: 
  - Zip code input or radius selector
  - OR: "Within X km of [Contractor's primary zip]"

**Lead Card Component**:
- **Card Header**:
  - Lead title (truncated, expandable)
  - Category badge (color-coded)
  - Urgency level badge (color + text)
- **Customer Info Section**:
  - Customer name
  - Zip code
  - Lead source badge (small, gray, e.g., "Google Local Services")
- **Lead Details**:
  - Budget range: "$X - $Y" or "Budget: $X"
  - Lead description (truncated to 2 lines, "Read more" expands)
- **Bidding Section** (if ACTIVE status):
  - Bid input field:
    - Slider: 0.5x - 2.0x multiplier
    - OR text input (decimal, 0.5 to 2.0)
  - Real-time calculation: "Your bid will be $XXX" (shows discount if applicable)
  - "Place Bid" button
    - Disabled if:
      - Bidding window closed
      - Contractor is bidding-banned
      - Already bid on this lead
  - Status indicators:
    - "Bidding closes in X mins" countdown timer
    - "Your bid placed ✓" if contractor already bid
    - "Your rank: #X" if bidding closed and in top 3
- **Countdown Timer**: 
  - Shows time remaining until bidding closes
  - Updates every minute (or real-time via WebSocket)
  - Red styling if < 5 minutes remaining

**Responsive Behavior**:
- Desktop (1920px+): 3-column grid, sidebar 280px fixed
- Tablet (768px - 1024px): 2-column grid, collapsible sidebar
- Mobile (< 768px): 1-column stack, hidden sidebar (hamburger menu)

#### 2. Bid Management / Response Window (`/bids/active` or inline modal)

**Active Response Window Card** (shown when contractor has 2-hour window):

- **Urgent Banner**:
  - Background: Red/orange gradient
  - Text: "You've been selected! Respond within 2 hours"
  - Timer: "Respond by HH:MM" (large, prominent)
  - Urgent styling if < 30 mins left
- **Lead Details Panel**:
  - Lead title
  - Customer details:
    - Name
    - Phone (clickable: tel: link)
    - Email (clickable: mailto: link)
    - Zip code
    - Budget range
  - Lead description (full text)
- **Message Compose Box**:
  - Rich text editor (Tiptap)
    - Basic formatting: bold, italic, bullet lists
    - Character counter: "X / 5000 characters"
    - Max length: 5000 characters
    - File upload: DISABLED for MVP
  - "Send Response" button
    - Disables after click
    - Shows "Sending..." state
    - Then "Sent ✓" confirmation
  - Optional: "Can't respond? Mark as unable to contact" button
    - Does NOT charge bid
    - Counts as "helped manage lead"
    - Opens modal for reason

**Expired Response Window**:
- Red banner: "Response window expired. Strike applied to your account."
- Strike count display: "X of 10 strikes" (warning icon)
- If 10 strikes reached:
  - Red banner: "Bidding suspended. Appeal or wait for automatic reinstatement after 30 days."
  - Link to ban appeal modal

#### 3. Lead History / Conversions Tab (`/bids/history`)

**Metrics Summary Section** (top of page):
- Card grid (responsive):
  - Total leads bid on (lifetime)
  - Total leads won
  - Total leads contacted (conversion metric)
  - Contact rate % (contacts / wins)
  - Avg time to contact (minutes/hours)
  - Total spent (lifetime)
  - ROI (if integrated later, placeholder for future)

**History Table**:
Columns:
- Lead title + date (linked to lead details)
- Customer name + contact info (expandable tooltip)
- Status badge:
  - `CONTACTED ✓` (green)
  - `EXPIRED ✗` (red)
  - `PENDING` (yellow, if awaiting response window)
- Bid amount paid (formatted: $XXX.XX)
- Time-to-contact (if contacted, e.g., "45 mins")
- Actions: View lead details, View messages (if contacted)

**Table Features**:
- Pagination (default 20 per page, max 100)
- Sorting: By date (newest first), status, bid amount
- Filtering: Status, date range, category

#### 4. Ban Appeal Modal

**Trigger**: 
- Automatic modal on page load if contractor has 10 strikes + bidding ban
- OR manual trigger: "Request Appeal" button in expired response window

**Modal Content**:
- Title: "Account Suspension"
- Message: "Your account has been suspended from bidding due to [10] non-responses."
- Text area:
  - Label: "Explain why you'd like to appeal this ban"
  - Placeholder: "e.g., I was on-site with another client, my phone died..."
  - Character limit: 1000 characters
  - Validation: Required, min 10 characters
- "Submit Appeal" button
- After submission:
  - Shows: "Appeal submitted. We'll review and respond within 48 hours."
  - Button: "Close" (dismisses modal)

**Appeal Status Display** (if appeal exists):
- Banner on dashboard: "Appeal status: PENDING / APPROVED / REJECTED"
- If approved: "Your account has been reinstated. You can bid again."
- If rejected: "Appeal rejected. You can submit another appeal in 7 days."

### Real-Time Updates (WebSocket Events)

**Server → Client Events**:
- `lead:new` → New lead added to contractor's category
  - Show toast notification
  - Auto-refresh lead list (if on dashboard)
- `bid:won` → Contractor won a lead bidding slot
  - Show red banner: "You've been selected! Respond within 2 hours"
  - Redirect or open modal to response window
- `response_window:start` → 2-hour countdown begins
  - Update UI: Show active response window card
  - Start countdown timer
- `response_window:expiring` → 30 mins left warning
  - Show warning toast: "30 minutes remaining to respond"
  - Update timer styling to red/orange
- `response_window:expired` → Contractor didn't respond (strike applied)
  - Show red banner: "Response window expired. Strike applied (X/10)"
  - Update strike count in header
  - Disable message input
- `message:incoming` → Customer or next bidder messaged (future)
- `strike:applied` → Real-time strike count update
  - Update header strike count
  - Show toast if < 10, banner if = 10
- `ban:applied` → Account suspended from bidding
  - Show modal: Ban appeal form
  - Disable all "Place Bid" buttons

**Client → Server Events**:
- `bid:place` → Bid placed
- `message:send` → Message sent
- `bid:cancel` → Cancel bid (before window assigned? TBD)

### User Flows (Frontend Perspective)

#### Flow 1: Contractor Discovers & Bids on Lead
1. Contractor logs in → Dashboard loads (`/dashboard`)
2. Filters applied:
   - Select category: "Plumbing"
   - Urgency: "High" or "Urgent"
   - Budget range: $500 - $5000
3. Lead grid updates (WebSocket: new leads push-notify if watching)
4. Contractor sees active lead card:
   - Title: "Kitchen sink leak - urgent"
   - Countdown: "Bidding closes in 18 mins"
   - Budget: "$800 - $1200"
5. Contractor adjusts bid multiplier slider:
   - Slider: 0.5x - 2.0x
   - Current value: 1.25x
   - Real-time calculation: "Your bid will be $85.50"
6. Clicks "Place Bid"
7. POST `/bids` → Response: `{ bidRank: 2, status: 'WAITING_FOR_TOP_3_CLOSE' }`
8. Lead card updates:
   - Shows "Your bid placed ✓"
   - Shows rank if determined
9. If rank ≤ 3 after 30-min bidding window closes:
   - WebSocket event: `bid:won`
   - RED banner appears: "You've been selected! Respond within 2 hours"
   - Timer shows countdown
   - "Send Response" button enabled

#### Flow 2: Contractor Responds to Lead (Converts)
1. Contractor sees response window banner + lead details
2. Reads customer info: name, phone, email, budget, service description
3. Types message in rich text editor (Tiptap):
   - "Hi [Customer Name], I can help with this..."
   - Character counter: "156 / 5000 characters"
4. Clicks "Send Response"
5. Frontend:
   - Disables button
   - Shows "Sending..." state
6. Backend processes → WebSocket: `message:sent`
7. Frontend:
   - Shows "Sent ✓" confirmation
   - Updates bid card to "Lead contacted ✓"
   - Hides message input
   - Shows conversation view (if multiple messages)

#### Flow 3: Contractor Misses Response Window (Strike)
1. Contractor has active 2-hour window, sees banner with countdown
2. Timer counts down: "45 minutes remaining" → "30 minutes" → "5 minutes" (red)
3. Timer expires → WebSocket event: `response_window:expired`
4. Red banner replaces timer:
   - "Response window expired. Strike applied (2/10)"
   - Shows updated strike count
5. Message input disabled (grayed out)
6. If now bidding-banned (10 strikes):
   - Red banner on dashboard: "Your bidding privileges have been suspended"
   - "Place Bid" buttons disabled across all leads
   - Modal appears: "Request ban appeal" (optional)

### Responsive Design Requirements

#### Desktop (1920px+)
- Lead grid: 3 columns
- Sidebar: 280px fixed width
- Main content: Flexible width with max-width container
- Message composer: Full width within card

#### Tablet (768px - 1024px)
- Lead grid: 2 columns
- Sidebar: Collapsible hamburger menu
- Message input: Full width
- Touch-friendly buttons (min 44px height)

#### Mobile (< 768px)
- Lead grid: 1 column, full width
- Sidebar: Hidden by default (accessible via hamburger)
- Bid multiplier: Slider (easier than text input on mobile)
- Response window banner: 
  - Sticky at top when active
  - Shows timer + "Send" button in footer
- Message composer: Auto-expand textarea on focus

**Mobile Optimizations**:
- Touch-friendly buttons (min 44px height)
- Collapse lead descriptions to 2 lines + "Read more" expandable
- Message composer: Auto-expand textarea on focus
- Timer updates: Use CSS animation or requestAnimationFrame (avoid excessive DOM updates)

### Accessibility Requirements (WCAG 2.1 Level AA)

#### Semantic HTML
- Use `<button>` for actions, `<a>` for navigation
- `<form>` with `<label>` for all inputs
- Proper heading hierarchy (h1 → h2 → h3)
- ARIA landmarks: `<main>`, `<nav>`, `<aside>`

#### Color & Contrast
- Urgency badges: Not color-only (include text: "Low", "High", "Urgent")
- Status icons: Include text label ("✓ Contacted", "✗ Expired")
- Minimum contrast ratio 4.5:1 for normal text, 3:1 for large text

#### Keyboard Navigation
- Tab order: Left sidebar → Lead cards → Message input
- Escape key: Close modals
- Enter key: Submit forms
- Arrow keys: (optional) Navigate lead list

#### Screen Reader
- Add ARIA labels to timers: `aria-live="polite" aria-label="Time remaining: 45 minutes"`
- Button labels: "Place Bid", not "Submit"
- Error messages: `role="alert"` for real-time notifications
- Form validation: Associate errors with inputs via `aria-describedby`

#### Animations
- `prefers-reduced-motion`: Disable animations for users who opt out
- Avoid autoplaying videos or infinite animations

### Error Handling (Frontend)

#### Bid Placement Errors
- **Bidding window closed**: Toast: "Bidding closed for this lead"
- **Contractor is bidding-banned**: Toast: "Your account is suspended"
- **Contractor already bid**: Toast: "You've already placed a bid"
- **Bid multiplier out of range**: Toast: "Invalid bid amount (must be 0.5x - 2.0x)"
- **Lead doesn't exist**: Toast: "Lead not found"

#### Message Sending Errors
- **Response window expired**: Message input disabled, error toast
- **Lead already contacted**: Toast: "This lead was already contacted"
- **Message > 5000 chars**: Toast: "Message exceeds 5000 characters"
- **Empty message**: Toast: "Cannot send empty message"

### Performance Optimization (Frontend)

#### Code Splitting
- Route-based: Dashboard, Bid History, Settings as separate chunks
- Component: Message editor loaded on demand (Tiptap)

#### Caching Strategy
- `/leads` - Stale while revalidate (SWR): Cache 30 secs, fetch in background
- `/metrics` - Cache 5 mins, invalidate on bid placement
- Static assets: CDN with 1-year expires

#### Bundle Size
- Tiptap: Tree-shake unused plugins
- Day.js: Import only used locales
- Target: < 200KB JS (gzipped)

### API Endpoints (Frontend Integration)

**Authentication**:
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/logout`
- `POST /auth/refresh-token`
- `GET /auth/me`

**Leads**:
- `GET /leads?category=tech&urgency=high&skip=0&limit=20`
  - Returns active leads + contractor's bid status
  - Real-time: WebSocket subscription for new leads
- `POST /leads/:id/bid`
  - Body: `{ bidMultiplier: 1.5 }`
  - Returns: `{ finalBidAmount, bidRank (if top 3), responseWindowStartsAt (if rank <=3) }`
- `GET /leads/:id` - Lead details + all bids

**Bids**:
- `GET /bids/active` - Contractor's current response windows
- `GET /bids/history?skip=0&limit=50` - Past bids with status + conversion data

**Messages**:
- `POST /messages` - Body: `{ leadId, text }`
- `GET /messages/:leadId` - All messages for a lead

**Strikes & Bans**:
- `GET /strikes/count` - Current strike count
- `POST /appeals` - Body: `{ reason }`
- `GET /appeals/:id` - Appeal status

**Metrics**:
- `GET /metrics` - Contractor's dashboard metrics

---

## 📝 Implementation Notes

### State Management Strategy

**Server State (TanStack Query)**:
- `/leads` - Keep fresh, poll every 30 seconds or use WebSocket
- `/bids/active` - High priority, real-time via WebSocket
- `/metrics` - Cache for 5 minutes
- `/messages/:leadId` - Real-time via WebSocket

**Client State (Zustand)**:
- `ui.selectedCategory` - Selected category filters
- `ui.budgetRange` - Budget filter range
- `ui.responseWindowCountdowns` - Local component state preferred
- `auth.contractor` - JWT claims (or store in React Query cache)

### Component Structure

```
client/src/
  pages/
    LeadsDashboard.tsx        # Main lead discovery page
    BidManagement.tsx          # Active bids / response windows
    BidHistory.tsx             # Lead history / conversions tab
  components/
    leads/
      LeadCard.tsx            # Individual lead card component
      LeadFilters.tsx         # Sidebar filters component
      BidInput.tsx            # Bid multiplier slider/input
      ResponseWindow.tsx      # Active response window card
      MessageComposer.tsx     # Tiptap message editor
      BanAppealModal.tsx      # Ban appeal form
      StrikeCounter.tsx       # Strike count display
      MetricsSummary.tsx      # Dashboard metrics cards
    shared/
      CountdownTimer.tsx      # Reusable countdown component
      StatusBadge.tsx         # Status badge with colors
      UrgencyBadge.tsx        # Urgency level badge
```

---

## ✅ Next Steps

1. **Database Setup**: Create PostgreSQL schema, run migrations
2. **Frontend Scaffolding**: 
   - Set up React Router with routes
   - Create base layout (header, sidebar, main content)
   - Install dependencies (TanStack Query, Zustand, Tiptap, Socket.io client)
3. **Lead Discovery Dashboard**: 
   - Build LeadCard component
   - Implement filters sidebar
   - Integrate WebSocket for real-time updates
4. **Bid Management**: 
   - Build ResponseWindow component
   - Integrate Tiptap for message editor
   - Implement countdown timer
5. **Ban Appeal**: 
   - Build BanAppealModal component
   - Integrate with appeals API
6. **Testing**: 
   - Unit tests for components
   - Integration tests for bid flow
   - E2E tests for user flows

