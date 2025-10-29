# Dashboard Hooks Fix - Impact Analysis

## ✅ What This Fix Does

Moves React hooks (`useQuery`) before conditional returns to follow Rules of Hooks.

## 🟢 Safe - Won't Break

### 1. **Query Cache Sharing** ✅
- Other components (Invoices.tsx, Clients.tsx, CreateInvoice.tsx) use the same query keys
- They don't have `enabled: false`, so they fetch normally
- Dashboard's `enabled: false` doesn't block other components
- React Query cache is shared - if data exists from other components, Dashboard will use it when enabled

### 2. **Query Invalidation** ✅
- `queryClient.invalidateQueries()` still works normally
- Invalidates the cache regardless of which component has `enabled: false`
- Dashboard's delete handler will still trigger refetches properly

### 3. **Early Return Protection** ✅
- We return early if `!isOnboardingComplete`, so disabled queries never cause rendering issues
- Data is only used after onboarding is complete anyway

### 4. **Automatic Fetching** ✅
- When `isOnboardingComplete` changes from `false` → `true`, React Query automatically starts fetching
- No manual intervention needed

## 🟡 Potential Edge Cases (Should Be Fine)

### 1. **Race Condition on Navigation**
**Scenario**: User completes onboarding → immediately clicks "View Dashboard"

**What happens**:
- `useOnboardingGuard()` might still show `isOnboardingComplete: false` for 1 render
- Query stays disabled during that render
- But we show loading state anyway via early return
- Next render updates, query enables, fetches data

**Impact**: ⚠️ Slight delay (expected - loading state shows anyway)

**Mitigation**: ✅ Already handled with loading state

### 2. **Stale Cache Usage**
**Scenario**: User visits Invoices page (fetches data) → then visits Dashboard

**What happens**:
- Invoices page populates cache with `/api/invoices`
- Dashboard's query sees cache exists and uses it (React Query behavior)
- Query is enabled, so it might refetch depending on `staleTime`

**Impact**: 🟢 Actually beneficial - uses cached data if fresh

### 3. **Query Key Consistency**
**Scenario**: Multiple components use same query keys

**Current state**:
- Dashboard: `enabled: isOnboardingComplete && !onboardingLoading`
- Invoices: No `enabled` (always fetches)
- Clients: No `enabled` (always fetches)

**Impact**: 🟢 Fine - each component controls its own fetching behavior

## 🔴 What Could Break (Unlikely)

### 1. **If `staleTime` Was Short**
- **Current**: `staleTime: Infinity` in queryClient config
- **Risk**: None - data is considered fresh forever
- **Impact**: ✅ No issue

### 2. **If Other Components Depend on Dashboard Fetching First**
- **Current**: Each component fetches independently
- **Risk**: None - components don't depend on Dashboard
- **Impact**: ✅ No issue

### 3. **If `isOnboardingComplete` State Flapping**
- **Scenario**: Rapidly toggling between true/false
- **Risk**: Low - state comes from useOnboardingGuard hook
- **Impact**: Query would enable/disable but we redirect away anyway

## 📊 Expected Behavior

### Normal Flow (After Onboarding):
1. User completes onboarding → `isOnboardingComplete: true`
2. User navigates to Dashboard
3. Query enables automatically (`enabled: true`)
4. Query fetches data (or uses cache if available)
5. Dashboard renders with data

### Edge Case (Immediate Navigation):
1. User completes onboarding
2. User clicks "View Dashboard" immediately
3. First render: `isOnboardingComplete` might be false → shows loading
4. Second render: `isOnboardingComplete: true` → query enables → fetches → renders

## ✅ Conclusion

**The fix is safe.** The `enabled` flag:
- ✅ Prevents unnecessary API calls during onboarding
- ✅ Doesn't interfere with other components
- ✅ Automatically starts fetching when conditions are met
- ✅ Works well with React Query's cache sharing

The only "cost" is a potential 1-frame delay if navigating immediately after onboarding, but this is already handled by the loading state.

