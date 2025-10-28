# Detailed UI Flow & Interactions

## 🎨 Complete User Experience Design

---

## PAGE 1: Welcome & Business Basics

### Initial State

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│                           [InvoiceHub Logo]                      │
│                                                                   │
│                     Welcome to InvoiceHub! 🎉                    │
│             Let's get you set up in less than 3 minutes          │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  STEP 1: Tell us about your business                        │ │
│ │                                                              │ │
│ │  Company Name *                                              │ │
│ │  ┌─────────────────────────────────────────────────────┐   │ │
│ │  │ [Your Company Name]                                  │   │ │
│ │  └─────────────────────────────────────────────────────┘   │ │
│ │                                                              │ │
│ │  Preferred Currency *                                       │ │
│ │  ┌─────────────────────────────────────────────────────┐   │ │
│ │  │ EUR ▼                                                │   │ │
│ │  └─────────────────────────────────────────────────────┘   │ │
│ │                                                              │ │
│ │                                                              │ │
│ │                     [Continue →]                             │ │
│ │                                                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ Progress: [▓▓░░░░░░░░] 10%                                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Interactions

**Behavior**:
- Page loads with smooth fade-in (300ms)
- Logo has gentle pulse animation (infinite, 2s)
- Inputs have focused states with blue border

**Company Name Input**:
- Placeholder: "Your Company Name"
- Real-time validation: Enables Continue button when 2+ characters
- Error state: Red border + "Please enter at least 2 characters"
- Auto-focus on page load

**Currency Dropdown**:
- Default: EUR
- Options: EUR, USD, GBP, AUD, TRY
- Shows flag emoji: 🇪🇺 EUR, 🇺🇸 USD, etc.
- Dropdown opens upward if near bottom of viewport

**Continue Button**:
- Disabled (gray) until company name entered
- Hover: Blue background, scale 1.02
- Click: Loading spinner + "Please wait..." text
- Success: Slide to next stage (500ms)

**Progress Bar**:
- Animated fill from left to right
- Current: 10% (Step 1 of 6 total)
- Updates real-time as user progresses

---

## PAGE 2: Add Your First Client

### Initial State

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│                    ← Back to step 1                               │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  STEP 2: Who's your first client?                           │ │
│ │                                                              │ │
│ │  This will appear on your invoices                          │ │
│ │                                                              │ │
│ │  Client Name *                                               │ │
│ │  ┌─────────────────────────────────────────────────────┐   │ │
│ │  │ [Client Company Name]                                │   │ │
│ │  └─────────────────────────────────────────────────────┘   │ │
│ │                                                              │ │
│ │  Email (optional but recommended)                           │ │
│ │  ┌─────────────────────────────────────────────────────┐   │ │
│ │  │ [client@example.com]                                 │   │ │
│ │  └─────────────────────────────────────────────────────┘   │ │
│ │                                                              │ │
│ │                                                              │ │
│ │        [Add Client →]                                       │ │
│ │                                                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│                                                                   │
│ Progress: [▓▓▓▓░░░░░░] 30%                                       │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Interactions

**Back Button**:
- Top left ← Back to step 1
- Hover: Underline animation
- Click: Smooth slide animation to previous page
- Saves state (form data persists)

**Client Name Input**:
- Auto-focus on page load
- Validation: Minimum 2 characters
- No special characters validation
- Placeholder: "Client Company Name"
- Character counter below (2/50)

**Email Input**:
- Optional field
- Validation: Proper email format if filled
- Real-time validation as user types
- Suggestion dropdown if email exists in system (future feature)

**Add Client Button**:
- Primary action (blue)
- Disabled until client name entered
- Hover: Subtle shadow + scale 1.02
- Loading state: Spinner + "Adding client..."
- Success: Brief checkmark animation → Slide to next

**Help Text** (tooltip):
- Question mark icon next to "Email"
- On hover: "We'll use this to send invoices automatically"

---

## PAGE 3: Add Your First Service

### Initial State

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
豺                    ← Back to step 2                               │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  STEP 3: What are you selling?                              │ │
│ │                                                              │ │
│ │  Add a service or product you invoice for                   │ │
│ │                                                              │ │
│ │  Service Name *                                              │ │
│ │  ┌─────────────────────────────────────────────────────┐   │ │
│ │  │ [e.g., Web Design, Consulting, etc.]                 │   │ │
│ │  └─────────────────────────────────────────────────────┘   │ │
│ │                                                              │ │
│ │  Price *                                                    │ │
│ │  ┌─────────────────────────────────────────────────────┐   │ │
│ │  │ €                                                      │   │ │
│ │  └─────────────────────────────────────────────────────┘   │ │
│ │                                                              │ │
│ │                                                              │ │
│ │        [Add Service →]                                      │ │
│ │                                                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
Priority         │                                                                   │
│ Progress: [▓▓▓▓▓▓▓▓░░░░] 50%                                      │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Interactions

**Service Name Input**:
- Auto-focus
- Examples in placeholder rotate: "Web Design", "Consulting", "Training", "Design Services"
- Validation: 2+ characters
- Accepts any text

**Price Input**:
- Currency symbol (€) in left
- Number-only with decimal support
- Formatting: 0.00 (2 decimal places)
- Real-time: €100.00 display
- Min: 0.01
- Maximum warning: "Price seems unusually high (> €10,000)"

**Add Service Button**:
- Same behavior as previous
- Success animation: Checkmark bounce

**Progress Indicator**:
- At 50% now
- Smoothly animated to this state

---

## PAGE 4: Review & Generate

### Initial State

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│                    ← Back to step 3                               │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  STEP 4: Review and generate your first invoice!            │ │
│ │                                                              │ │
│ │  📄 Invoice Preview                                         │ │
│ │  ┌─────────────────────────────────────────────────────┐   │ │
│ │  │                                                      │   │ │
│ │  │   INVOICE                                           │   │ │
│ │  │                                                      │   │ │
│ │  │   From: Your Company Name                           │   │ │
│ │  │   To:   Client Company Name                         │   │ │
│ │  │   Date: January 15, 2024                            │   │ │
│ │  │                                                      │   │ │
│ │  │   Service Details:                                  │   │ │
│ │  │   ┌────────────────────────────────────────────┐   │   │ │
│ │  │   │ Service Name        Quantity  Price  Total │   │   │ │
│ │  │   │ ─────────────────────────────────────────  │   │   │ │
│ │  │   │ [Service Name]         1      €100   €100  │   │   │ │
│ │  │   └────────────────────────────────────────────┘   │   │ │
│ │  │                                                      │   │ │
│ │  │                            TOTAL: €100              │   │ │
│ │  │                                                      │   │ │
│ │  └─────────────────────────────────────────────────────┘   │ │
│ │                                                              │ │
│ │  Invoice Number: INV-000001 (auto-generated)                │ │
│ │                                                              │ │
│ │                                                              │ │
│ │              [Generate My First Invoice →]                   │ │
│ │                                                              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│ Progress: [▓▓▓▓▓▓▓▓▓▓░░] 90%                                     │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Interactions

**Invoice Preview**:
- Real-time updates as user changes fields
- PDF-like styling
- Subtle shadow for depth
- Auto-generates invoice number
- Shows current date
- Currency from step 1

**Editable Fields** (click to edit):
- Click "Your Company Name" → Inline edit
- Click "Client Company Name" → Inline edit
- Click "Service Name" → Inline edit
- Click price → Inline edit with validation

**Generate Button**:
- Large, prominent primary action
- Icon: 🎉 Rocket icon next to text
- Loading state: "Creating your invoice..."
- Success: Confetti animation + slide to success

---

## PAGE 5: Success Celebration

### Initial State

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│                                                                   │
│                                                                   │
│                            🎉                                     │
│                    (confetti animation)                           │
│                                                                   │
│               Congratulations! 🎉                                │
│                                                                   │
│         You've created your first invoice!                        │
│                                                                   │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │  Your invoice INV-000001 is ready!                          │ │
│ │                                                              │ │
│ │  📄 Download PDF              📧 Send via Email             │ │
│ │                                                              │ │
│ │  [Download Invoice]           [Send to Client]              │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│                                                                   │
│                                                                   │
│              [Go to Dashboard →]                                 │
│                                                                   │
 محیط─────────────────────────────────────────────────────────────┘
```

### Interactions

**Confetti Animation**:
- Triggers on page load
- Duration: 2 seconds
- Particles fall from top
- Colors: Brand colors
- Audio: Optional celebratory sound (user can disable)

**Download Button**:
- Secondary action (outline)
- Icon: Download arrow
- Click: Downloads PDF immediately
- Loading: "Generating PDF..."

**Send Email Button**:
- Uses client email from step 2
- Click: Opens email modal
- Success: "Invoice sent to client@example.com"

**Go to Dashboard**:
- Primary action (blue)
- Loading: "Taking you to your dashboard..."
- Transitions to dashboard after 3 seconds (auto)

**Auto-redirect**:
- If no action taken: Redirect after 5 seconds
- Countdown shown: "Redirecting in 5... 4... 3..."
- Cancel button to stay on page

---

## DASHBOARD: Post-Onboarding State

### State When Landing

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│  Dashboard                              [Settings] [Logout]      │
│                                                                   │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  👋 Welcome back! Your first invoice is ready             │ │
│  │                                                           │ │
│  │  Invoice INV-000001                   Status: Draft       │ │
│  │  Client: Client Company Name          Amount: €100       │ │
│  │                                                           │ │
│  │  [View Invoice] [Send to Client] [Edit]                  │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                   │
│  💡 Complete your setup (optional)                               │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ 📋 Profile   │  │ 👥 Clients   │  │ 📦 Services  │          │
│  │              │  │              │  │ error        │          │
│  │ Add full     │  │ You have 1   │  │ You have 1   │          │
│  │ business     │  │ client       │  │ service      │          │
│  │ details      │  │              │  │              │          │
│  │              │  │ Add more     │  │ Build catalog│          │
│  │ [Complete]   │  │ [Add Client] │  │ [Add Service]│          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│                                                                   │
│  Recent Activity                                                  │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ • Created invoice INV-000001           2 minutes ago      │ │
│  │ • Added client "Client Company Name"   5 minutes ago      │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                   │
│                                                                   │
│  [Create New Invoice] (large, prominent)                         │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Interactions

**Welcome Message**:
- Personalized with user's company name
- Dismissible after 24 hours
- Can be collapsed

**Setup Cards**:
- Subtle animations on hover
- "Dismiss" option on each
- Reappear in 7 days if not completed
- Optional but encouraged

**Recent Activity**:
- Fade-in animation on load
- Updates in real-time
- Click to view details

---

## 🎨 Design System Details

### Colors

**Primary** (Blue):
- `hsl(221, 83%, 53%)` - Buttons, links
- Hover: `hsl(221, 83%, 48%)`
- Disabled: `hsl(221, 83%, 85%)`

**Success** (Green):
- `hsl(142, 71%, 45%)` - Checkmarks, success states
- Background: `hsl(142, 71%, 95%)`

**Warning** (Yellow):
- `hsl(38, 92%, 50%)` - Warnings

**Error** (Red):
- `hsl(0, 84%, 60%)` - Errors

### Typography

**Headings**:
- Font: Inter, sans-serif
- Weight: 600 (semibold)
- Sizes: 32px (h1), 24px (h2), 20px (h3)

**Body**:
- Font: Inter, sans-serif
- Weight: 400 (regular)
- Size: 16px base, 14px small

**Monospace**:
- Font: JetBrains Mono, monospace
- Invoice numbers, codes

### Spacing

**Padding**:
- Page: 24px (mobile), 40px (desktop)
- Cards: 24px
- Inputs: 12px vertical, 16px horizontal

**Gaps**:
- Between sections: 32px
- Between cards: 16px
- Between form fields: 24px

### Animations

**Transitions**:
- Standard: 150ms ease-in-out
- Fast: 100ms ease-out
- Slow: 500ms ease-in-out

**Curves**:
- Default: cubic-bezier(0.4, 0, 0.2, 1)
- Bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55)

**Effects**:
- Hover: Scale(1.02) + Shadow
- Click: Scale(0.98)
- Slide: Transform X 20px

---

## 📱 Mobile Responsive Breakpoints

### Mobile (< 768px)

**Changes**:
- Single column layout
- Larger touch targets (44px minimum)
- Bottom sheet modals
- Swipe gestures for navigation
- Stacked form fields
- Full-width buttons

**Mobile Optimizations**:
```
┌─────────────────┐
│   ← Back        │
│                 │
│  STEP 1 of 4    │
│  [▓▓░░░░░░] 20% │
│                 │
│ ┌─────────────┐ │
│ │             │ │
│ │  Company    │ │
│ │  Name       │ │
│ │             │ │
│ │  [________] │ │
│ │             │ │
│ │  [Continue →]│ │
│ │             │ │
│ └─────────────┘ │
│                 │
└─────────────────┘
```

### Tablet (768px - 1024px)

**Changes**:
- Two-column grid
- Slightly larger cards
- Palace navigation becomes icon-based

### Desktop (> 1024px)

**Changes**:
- Maximum width container (1200px)
- Centered layout
- Side-by-side form fields where appropriate

---

## 🔄 State Management

### Loading States

**Buttons**:
```tsx
// Before click
<Button>Continue</Button>

// Loading
<Button disabled>
  <Loader className="mr-2" /> Please wait...
</Button>

// Success (brief)
<Button>
  <CheckCircle /> Done!
</Button>
```

**Forms**:
- Disable all inputs during submission
- Show spinner in submit button
- Disable back navigation

### Error States

**Input Errors**:
- Red border on field
- Error message below field
- Shake animation (300ms)
- Focus management (scroll to error)

**API Errors**:
- Toast notification
- Retry button
- Error persists until resolved

### Success States

**Field Success**:
- Green border
- Checkmark icon (right side)
- Brief animation (bounce-in)

**Step Completion**:
- Progress bar updates
- Checkmark on completed step
- Slide animation to next step

---

## 🎯 Micro-Interactions

### Input Focus
- Border changes from gray → blue
- Shadow appears
- Label moves up and shrinks
- Duration: 200ms

### Button Click
- Press down (scale 0.98)
- Release (scale 1.0)
- Duration: 100ms

### Checkmark Animation
- Circle draws (800ms)
- Checkmark draws (400ms)
- Bounce at end (500ms)

### Progress Bar
- Smooth fill animation
- Updates every 16.7ms (60fps)
- Easing: ease-out

### Tooltip
- Fade in + slide up
- Duration: 200ms
- Arrow points to element
- Dismiss on hover out or click

---

## 🚫 Error Handling

### Validation Errors

**Real-time**:
- Validate on blur
- Show error immediately
- Clear error when valid

**Messages**:
- Clear and actionable
- "Please enter a company name" ✓
- "Invalid" ✗

### Network Errors

**Display**:
```
┌─────────────────────────────────┐
│ ⚠️  Something went wrong         │
│                                  │
│ Please check your internet      │
│ connection and try again         │
│                                  │
│ [Retry]                          │
└─────────────────────────────────┘
```

### Constraint Errors

**Example**:
- "Invoice number already exists, generating new number..."
- "Client email already in system, updating existing client..."

---

## 📊 Progress Tracking

### Visual Progress

**Progress Bar**:
- Shows percentage completion
- Fills smoothly
- Color-coded:
  - 0-33%: Red (getting started)
  - 34-66%: Yellow (in progress)
  - 67-100%: Plain (almost done)

### Completion Indicators

**Step Numbers**:
```
[1✓]  [2✓]  [3]  [4]  
  ✓     ✓    ●    ○
```

**On Step 3**:
- Steps 1-2: Green with checkmark
- Step 3: Blue current indicator
- Step 4: Gray future step

---

## 🔔 Toast Notifications

### Success Toast
```
┌────────────────────────────────┐
│ ✓ Client added successfully    │
└────────────────────────────────┘
```
- Green background
- Auto-dismiss after 3s
- Swipe to dismiss

### Error Toast
```
┌────────────────────────────────┐
│ ✕ Failed to save. Try again?  │
│                         [Retry] │
└────────────────────────────────┘
```
- Red background
- Persist until dismissed
- Action button included

### Info Toast
```
┌────────────────────────────────┐
│ ℹ️  Saving your progress...    │
└────────────────────────────────┘
```
- Blue background
- Auto-dismiss after 2s

---

This complete UI flow provides every interaction detail needed for implementation!

