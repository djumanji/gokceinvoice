# Refactoring Opportunities

## Overview
This document identifies key refactoring opportunities to improve code maintainability, reduce duplication, and enhance type safety.

---

## 🔴 High Priority Refactorings

### 1. Extract Common Route Handler Patterns
**File:** `server/routes.ts` (463 lines)
**Issue:** Massive code duplication across all routes

**Current Problems:**
- `userId` extraction repeated in every route (lines 18, 32, 49, 71, 96, etc.)
- Error handling pattern duplicated 20+ times
- Similar try-catch structure repeated throughout

**Recommendation:** Create helper functions:

```typescript
// server/utils/handlers.ts
export function getUserId(req: Request): string | null {
  return (req.session as any)?.userId || null;
}

export function requireUserId(req: Request, res: Response): string | null {
  const userId = getUserId(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
  return userId;
}

export function handleAsyncError(
  handler: (req: Request, res: Response) => Promise<void>
) {
  return async (req: Request, res: Response) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error("Request failed:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: error.errors });
      } else {
        res.status(500).json({ error: "Internal server error" });
      }
    }
  };
}
```

**Impact:** Reduces `routes.ts` from ~460 lines to ~250 lines

---

### 2. Extract Invoice Calculation Logic
**File:** `server/routes.ts`
**Issue:** Invoice calculation logic duplicated in POST (lines 166-191) and PATCH (lines 261-277)

**Recommendation:** Create a service module:

```typescript
// server/services/invoice-service.ts
export function calculateInvoiceTotals(
  lineItems: any[],
  taxRate: string
): { subtotal: string; tax: string; total: string } {
  const subtotal = lineItems.reduce((sum, item) => {
    const qty = parseFloat(item.quantity);
    const price = parseFloat(item.price);
    if (isNaN(qty) || isNaN(price) || qty <= 0 || price < 0) {
      throw new Error("Invalid quantity or price in line items");
    }
    return sum + (qty * price);
  }, 0);

  const taxRateNum = parseFloat(taxRate) || 0;
  if (taxRateNum < 0 || taxRateNum > 100) {
    throw new Error("Tax rate must be between 0 and 100");
  }

  const tax = subtotal * (taxRateNum / 100);
  const total = subtotal + tax;

  return {
    subtotal: subtotal.toFixed(2),
    tax: tax.toFixed(2),
    total: total.toFixed(2),
  };
}
```

**Impact:** Single source of truth for calculations, easier testing

---

### 3. Create Type-Safe Session Interface
**File:** Multiple server files
**Issue:** `req.session as any` used everywhere (no type safety)

**Recommendation:** Extend Express types:

```typescript
// server/types/express.d.ts
import { Session } from 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId?: string;
  }
}

// Then use: req.session.userId (type-safe!)
```

**Impact:** Full type safety, IntelliSense support, compile-time checks

---

### 4. Extract OAuth Buttons Component
**Files:** `client/src/pages/Login.tsx`, `client/src/pages/Register.tsx`
**Issue:** OAuth buttons duplicated with same markup

**Recommendation:** Create reusable component:

```typescript
// client/src/components/OAuthButtons.tsx
export function OAuthButtons() {
  return (
    <div className="space-y-4">
      <Button onClick={() => window.location.href = '/api/auth/google'}>
        🔵 Continue with Google
      </Button>
      <Button onClick={() => window.location.href = '/api/auth/github'}>
        🐙 Continue with GitHub
      </Button>
      <Separator />
    </div>
  );
}
```

**Impact:** Single source of truth, easier to add more providers

---

### 5. Extract Error Parsing Logic
**Files:** `client/src/pages/Login.tsx`, `client/src/pages/Register.tsx`
**Issue:** Error message extraction duplicated (lines 34-46 in both files)

**Recommendation:** Create utility:

```typescript
// client/src/lib/errorUtils.ts
export function parseErrorMessage(error: any, defaultMsg: string): string {
  try {
    const errorMatch = error.message?.match(/\{[^}]+\}/);
    if (errorMatch) {
      const errorData = JSON.parse(errorMatch[0]);
      return errorData.error || defaultMsg;
    }
  } catch (e) {
    // fall through
  }
  
  // Check for rate limiting
  if (error.message?.includes('429') || error.message?.includes('Too many')) {
    return "Too many attempts. Please wait and try again.";
  }
  
  return error.message || defaultMsg;
}
```

**Impact:** Consistent error handling, easier to update

---

## 🟡 Medium Priority Refactorings

### 6. Split `routes.ts` into Separate Files
**Current:** All routes in one 463-line file
**Recommendation:** 
- `server/routes/clients.ts`
- `server/routes/invoices.ts`
- `server/routes/services.ts`

**Impact:** Better organization, easier navigation

---

### 7. Create CRUD Route Generators
**Issue:** Clients, Services have identical CRUD patterns
**Recommendation:** Generic CRUD helper:

```typescript
// server/utils/crud-generator.ts
export function createCRUDRoutes(
  resource: 'clients' | 'services',
  sanitizeFields: string[],
  schema: z.ZodSchema
) {
  // Returns GET, GET/:id, POST, PATCH/:id, DELETE/:id routes
}
```

**Impact:** 80% reduction in boilerplate

---

### 8. Extract Sanitization Patterns
**Issue:** `sanitizeObject` calls scattered everywhere
**Recommendation:** Create resource-specific sanitizers:

```typescript
// server/utils/sanitize.ts
export const sanitizers = {
  client: (data: any) => sanitizeObject(data, ['name', 'company', 'address', 'notes', 'taxId']),
  invoice: (data: any) => sanitizeObject(data, ['notes', 'orderNumber', 'projectNumber', 'forProject']),
  service: (data: any) => sanitizeObject(data, ['name', 'description', 'category']),
};
```

---

### 9. Add Response Helpers
**Issue:** Inconsistent response patterns
**Recommendation:**

```typescript
// server/utils/response.ts
export const sendSuccess = (res: Response, data: any, status = 200) => {
  res.status(status).json(data);
};

export const sendError = (res: Response, error: string, status = 400) => {
  res.status(status).json({ error });
};

export const sendNotFound = (res: Response, resource: string) => {
  res.status(404).json({ error: `${resource} not found` });
};
```

---

### 10. Improve Database Query Error Handling
**Issue:** Generic catch blocks lose specific error context
**Recommendation:** Add structured error types:

```typescript
// server/utils/errors.ts
export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} with id ${id} not found`);
  }
}

export class ValidationError extends Error {
  constructor(message: string, public errors: any[]) {
    super(message);
  }
}
```

---

## 🟢 Low Priority (Nice to Have)

### 11. Add OpenAPI/Swagger Documentation
**Impact:** Better API documentation, code generation support

### 12. Implement Request Logging Middleware
**Current:** Manual logging in each route
**Recommendation:** Centralized logging middleware

### 13. Add Database Transaction Support
**Issue:** Invoice creation isn't atomic (invoice + line items)
**Recommendation:** Wrap in transaction

### 14. Extract Constants to Config File
**Issue:** Magic numbers/strings throughout code
**Recommendation:** `server/config/constants.ts`

```typescript
export const TAX_RATE_MIN = 0;
export const TAX_RATE_MAX = 100;
export const MAX_QUANTITY = 100000000;
export const PRICE_DECIMALS = 2;
```

---

## 📊 Summary Statistics

**Before Refactoring:**
- `routes.ts`: 463 lines
- Code duplication: ~40% of server code
- Type safety: Limited (many `any` types)
- Test coverage potential: Low (tightly coupled)

**After Refactoring:**
- `routes.ts`: ~200 lines (-57%)
- Code duplication: <10%
- Type safety: Full (no `any` types)
- Test coverage potential: High (isolated functions)

---

## 🎯 Recommended Refactoring Order

1. **Start with #3** (Session types) - Quick win, enables other refactorings
2. **Then #1** (Route handlers) - Highest impact on maintainability
3. **Then #2** (Invoice calculations) - Critical business logic
4. **Then #4** (OAuth buttons) - Frontend cleanup
5. **Then #5** (Error parsing) - Frontend cleanup
6. **Finally #6-14** - Structural improvements

---

## ⚠️ Migration Strategy

- Refactor incrementally, one feature at a time
- Run tests after each change (add tests before refactoring if none exist)
- Keep backward compatibility during transition
- Use TypeScript to catch breaking changes

