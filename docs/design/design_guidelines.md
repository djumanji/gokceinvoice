# Invoice Management System - Design Guidelines

## Design Approach
**System:** Hybrid approach drawing from Linear's clean data presentation + Stripe Dashboard's financial clarity + Notion's organizational patterns

**Justification:** Invoice management requires exceptional clarity for financial data, professional credibility, and efficient workflows. This is a utility-focused application where precision and usability take priority over visual flair.

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Primary: 220 13% 18% (Deep slate - professional, trustworthy)
- Background: 0 0% 100% (Pure white)
- Surface: 220 13% 97% (Light gray for cards/panels)
- Border: 220 13% 91% (Subtle separation)
- Success: 142 76% 36% (Green for paid invoices)
- Warning: 38 92% 50% (Amber for pending)
- Danger: 0 84% 60% (Red for overdue)
- Text Primary: 220 13% 18%
- Text Secondary: 220 9% 46%

**Dark Mode:**
- Primary: 220 13% 91% (Light text)
- Background: 224 71% 4% (Deep navy-black)
- Surface: 220 13% 10% (Elevated surfaces)
- Border: 220 13% 18% (Subtle borders)
- [Same success/warning/danger values]
- Text Primary: 220 13% 91%
- Text Secondary: 220 9% 63%

### B. Typography
- **Primary Font:** Inter (via Google Fonts CDN)
- **Monospace Font:** JetBrains Mono (for invoice numbers, amounts)
- **Hierarchy:**
  - Page Headers: text-3xl font-bold tracking-tight
  - Section Headers: text-xl font-semibold
  - Card Titles: text-lg font-medium
  - Body: text-base font-normal
  - Labels: text-sm font-medium
  - Metadata: text-sm text-secondary
  - Invoice Numbers/Amounts: font-mono

### C. Layout System
**Spacing Primitives:** Use Tailwind units of 1, 2, 3, 4, 6, 8, 12, 16
- Tight spacing: p-2, gap-1
- Standard spacing: p-4, gap-4, m-6
- Section spacing: py-8, py-12
- Page margins: px-6 md:px-8

**Container Strategy:**
- Max width: max-w-7xl mx-auto
- Dashboard grid: Two-column split (sidebar + main content)
- Sidebar: w-64 fixed left
- Main content: ml-64 with responsive stacking on mobile

### D. Component Library

**Dashboard Layout:**
- Top Navigation: Sticky header with logo, search, user menu (h-16)
- Sidebar Navigation: Fixed left sidebar with icon + label menu items
- Stats Cards: 4-column grid on desktop showing: Total Invoices, Paid, Pending, Overdue
  - Include large number (text-3xl font-bold)
  - Label below (text-sm text-secondary)
  - Trend indicator with icon (↑ or ↓)

**Invoice List/Table:**
- Tabular format with columns: Invoice #, Client, Date, Due Date, Amount, Status
- Row hover state with subtle background change
- Status badges: Pill-shaped with appropriate color (paid=green, pending=amber, overdue=red, draft=gray)
- Sortable column headers with chevron icons
- Search bar above table (w-full max-w-md)
- Filter dropdown for status
- Action buttons: View, Edit, Delete (icon buttons aligned right)

**Invoice Creation/Edit Form:**
- Two-column layout for large screens
- Left Column: Client selection dropdown, Invoice details (number, date, due date, notes)
- Right Column: Live invoice preview card showing current state
- Line Items Section: Table with columns: Description, Quantity, Price, Amount
  - Add Item button below table
  - Auto-calculate subtotal, tax, total
  - Editable inline rows
- Bottom action bar: Save as Draft, Mark as Sent, Generate PDF

**Invoice Detail View:**
- Card-based layout with professional invoice template
- Header: Business logo area, Business details (right-aligned)
- Client section: Bill To information
- Invoice metadata: Invoice #, Date, Due Date in structured format
- Line items table: Clean, bordered table
- Totals section: Right-aligned with Subtotal, Tax, Total (Total in larger, bold text)
- Action buttons: Edit, Delete, Download PDF, Mark as Paid

**Client Management:**
- Grid of client cards (2-3 columns)
- Each card shows: Client name, contact email, phone, total invoices, outstanding amount
- Quick actions: Edit, View Invoices
- Add New Client button (prominent, primary color)

**Forms:**
- Input fields: border-2, rounded-lg, focus:ring-2 focus:ring-primary
- Labels: text-sm font-medium mb-2
- Required fields: Asterisk indicator
- Error states: Red border + error message below
- Dropdown selects: Custom styled with chevron icon

**Buttons:**
- Primary: bg-primary text-white rounded-lg px-4 py-2 font-medium
- Secondary: border-2 border-primary text-primary (outline style)
- Danger: bg-red-600 text-white for delete actions
- Icon buttons: p-2 rounded hover:bg-surface

**Cards:**
- Background: bg-surface
- Border: border border-border
- Rounded: rounded-lg
- Padding: p-6
- Shadow: shadow-sm

**Modals:**
- Overlay: bg-black/50 backdrop-blur-sm
- Modal content: max-w-2xl centered, bg-surface, rounded-xl, p-8
- Close button: Top right, icon only

### E. Data Visualization
- Mini sparklines for invoice trends (use Chart.js via CDN)
- Simple bar chart showing monthly revenue
- Donut chart for invoice status distribution

### F. Responsive Behavior
- Desktop-first approach (optimized for 1440px+)
- Mobile: Stack sidebar below header, single column layouts, horizontal scroll for tables
- Tablet: Maintain two-column where possible

### G. Micro-interactions
- Smooth transitions: transition-all duration-200
- Hover states on interactive elements
- Loading spinners for async operations
- Success toast notifications (top-right)

## Images
No hero images required. This is a data-focused application. Include:
- Placeholder business logo area in invoice template (120x60px recommended)
- Empty state illustrations for: No invoices yet, No clients yet (use simple SVG illustrations via Heroicons or similar)

## Icons
**Library:** Heroicons (outline for navigation, solid for actions)
- Dashboard: ChartBarIcon
- Invoices: DocumentTextIcon
- Clients: UsersIcon
- Settings: CogIcon
- Add: PlusIcon
- Edit: PencilIcon
- Delete: TrashIcon
- Download: ArrowDownTrayIcon

## Professional Polish
- Consistent 8px grid alignment
- Professional invoice template following standard business invoice format
- Print-optimized PDF generation
- Clear visual hierarchy separating navigation, data, and actions
- Prominent status indicators with color + text (never color alone)