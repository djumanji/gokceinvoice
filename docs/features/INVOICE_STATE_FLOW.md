# Invoice State Flow and Business Logic

## Invoice States

Based on the schema, invoices can have the following states (from `invoice_status` enum):
1. **draft** - Initial state, invoice being prepared
2. **sent** - Invoice has been sent to the client
3. **viewed** - Client has viewed the invoice
4. **partial** - Partial payment received
5. **paid** - Fully paid
6. **overdue** - Past due date, not paid
7. **cancelled** - Invoice cancelled
8. **refunded** - Payment refunded

## State Transitions

### Entry Triggers

1. **draft** → **sent**
   - **Trigger**: User clicks "Mark as Sent" button
   - **Actions**: 
     - Update invoice status to 'sent'
     - Optionally send email to client
     - Set sent_date timestamp

2. **sent** → **viewed**
   - **Trigger**: Client opens the invoice via a shared link
   - **Actions**:
     - Update invoice status to 'viewed'
     - Set viewed_date timestamp

3. **sent/viewed** → **partial**
   - **Trigger**: Payment received that is less than total amount
   - **Actions**:
     - Update amount_paid
     - Update invoice status to 'partial'

4. **sent/viewed/partial** → **paid**
   - **Trigger**: amount_paid >= total
   - **Actions**:
     - Update status to 'paid'
     - Set paid_date timestamp

5. **sent/viewed** → **overdue**
   - **Trigger**: Middle_date < CURRENT_DATE AND status IN ('sent', 'viewed')
   - **Actions**:
     - Automatic update by database trigger
     - Set overdue_date

6. **Any state** → **cancelled**
   - **Trigger**: User explicitly cancels the invoice
   - **Actions**:
     - Update status to 'cancelled'
     - Set cancelled_date

7. **paid** → **refunded**
   - **Trigger**: User initiates refund
   - **Actions**:
     - Update status to 'refunded'
     - Set refunded_date

### Exit Triggers

1. **draft** - Exit when:
   - User saves as draft (remains in draft)
   - User clicks "Mark as Sent" → goes to **sent**

2. **sent** - Exit when:
   - Client views it → goes to **viewed**
   - Partial payment received → goes to **partial**
   - Full payment received → goes to **paid**
   - Due date passes → goes to **overdue**
   - User cancels → goes to **cancelled**

3. **viewed** - Exit when:
   - Partial payment received → goes to **partial**
   - Full payment received → goes to **paid**
   - Due date passes → goes to **overdue**
   - User cancels → goes to **cancelled**

4. **partial** - Exit when:
   - Full payment received → goes to **paid**
   - Due date passes (should not change status)
   - User cancels → goes to **cancelled**

5. **paid** - Exit when:
   - User initiates refund → goes to **refunded**

6. **overdue** - Exit when:
   - Payment received (partial or full) → goes to **partial** or **paid**
   - User cancels → goes to **cancelled**

## Current Implementation

### Save as Draft Flow
1. User fills invoice form
2. Clicks "Save as Draft" button
3. Invoice created/updated with `status = 'draft'`
4. User can continue editing later

### Mark as Sent Flow
1. User fills invoice form
2. Clicks "Mark as Sent" button
3. Invoice created/updated with `status = 'sent'`
4. Invoice is locked from further editing (optional)
5. Ready to be shared with client

## Recommended Flow

```
CREATE INVOICE
   ↓
[Save as Draft Button] → status: 'draft' → Can edit later
   ↓
[Mark as Sent Button] → status: 'sent' → Ready to send
   ↓
CLIENT VIEWS → status: 'viewed'
   ↓
PARTIAL PAYMENT → status: 'partial'
   ↓
FULL PAYMENT → status: 'paid'
   ↓
REFUND → status: 'refunded'

ALTERNATIVE PATH:
   ↓
OVERDUE → status: 'overdue' (automatic trigger when due_date passes)
   ↓
PAYMENT RECEIVED → status: 'partial' or 'paid'
```

