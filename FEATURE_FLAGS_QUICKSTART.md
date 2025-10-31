# Feature Flags Quick Start

PostHog feature flags are now fully integrated! 🎉

## What's New

### ✅ Integrated Components:
1. **FeatureFlagProvider** - React context for managing flags
2. **FeatureFlagDebugPanel** - Dev tool to see all flags (bottom-right corner)
3. **Feature Flag Hooks** - Easy-to-use React hooks

### 📍 Where to Find:
- Context: `client/src/contexts/FeatureFlagContext.tsx`
- Debug Panel: `client/src/components/FeatureFlagDebugPanel.tsx`
- Examples: `client/src/components/FeatureFlagExamples.tsx`
- Docs: `docs/FEATURE_FLAGS.md`

## Quick Usage

### 1. Use a Feature Flag

```tsx
import { useFeatureFlag, FEATURE_FLAGS } from '@/contexts/FeatureFlagContext';

function MyComponent() {
  const isEnabled = useFeatureFlag(FEATURE_FLAGS.ENABLE_REAL_TIME_MESSAGING);

  if (!isEnabled) return null;

  return <div>Feature is enabled!</div>;
}
```

### 2. Get Flag Value

```tsx
import { useFeatureFlagValue, FEATURE_FLAGS } from '@/contexts/FeatureFlagContext';

function ThemeComponent() {
  const theme = useFeatureFlagValue<string>(
    FEATURE_FLAGS.ENABLE_DARK_MODE,
    'light' // default
  );

  return <div>Current theme: {theme}</div>;
}
```

## Available Feature Flags

All flags are defined in `FEATURE_FLAGS` constant:

```typescript
// Messaging
ENABLE_REAL_TIME_MESSAGING
ENABLE_MESSAGE_TYPING_INDICATORS
ENABLE_MESSAGE_READ_RECEIPTS

// Lead Capture
ENABLE_AI_CHATBOT
ENABLE_LEAD_ENRICHMENT

// Invoices
ENABLE_RECURRING_INVOICES
ENABLE_INVOICE_TEMPLATES
ENABLE_PDF_EXPORT

// Payments
ENABLE_ONLINE_PAYMENTS
ENABLE_STRIPE_INTEGRATION

// Analytics
ENABLE_ADVANCED_ANALYTICS
ENABLE_EXPENSE_TRACKING

// UI/UX
ENABLE_DARK_MODE
ENABLE_NEW_DASHBOARD

// Admin
ENABLE_ADMIN_PANEL
ENABLE_USER_MANAGEMENT
```

## Creating Flags in PostHog

### Step 1: Go to PostHog Dashboard
Visit https://app.posthog.com and navigate to "Feature Flags"

### Step 2: Create New Flag
- Click "New feature flag"
- Key: `enable-real-time-messaging` (use flag from FEATURE_FLAGS)
- Description: "Enable real-time messaging feature"

### Step 3: Set Release Conditions

#### Option A: Percentage Rollout
Release to 50% of users:
```
50% of all users
```

#### Option B: Target Specific Users
```
email = "admin@example.com"
OR
isAdmin = true
```

#### Option C: Multivariate Testing
Create variants for A/B testing:
- control: 33%
- variant-a: 33%
- variant-b: 34%

### Step 4: Enable the Flag
Toggle "Enable feature flag" to activate

## Development Tools

### Debug Panel (Development Only)

Look for a "Feature Flags" button in the bottom-right corner of your app. Click it to see:
- All feature flags and their values
- Current ON/OFF status
- Refresh button to reload flags

### Test in Development

```tsx
// The debug panel shows all flags in real-time
// Make changes in PostHog and click refresh to see updates
```

## Example: Gradual Rollout

```tsx
// 1. Create flag in PostHog: enable-new-dashboard

// 2. Start with 1% rollout
function Dashboard() {
  const useNew = useFeatureFlag(FEATURE_FLAGS.ENABLE_NEW_DASHBOARD);

  return useNew ? <NewDashboard /> : <OldDashboard />;
}

// 3. Monitor metrics in PostHog

// 4. Gradually increase: 1% → 10% → 50% → 100%

// 5. Once at 100%, remove flag and keep NewDashboard
```

## Example: A/B Testing

```tsx
// 1. Create multivariate flag in PostHog: cta-button-test
// Variants: control (33%), green (33%), purple (34%)

function CTAButton() {
  const variant = useFeatureFlagValue('cta-button-test', 'control');

  const colors = {
    control: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
  };

  return (
    <Button className={colors[variant]}>
      Get Started
    </Button>
  );
}

// 2. Track button clicks in PostHog
// 3. Analyze which variant performs best
// 4. Roll out winning variant to 100%
```

## Next Steps

1. **Test the Debug Panel**: Open your app and look for the feature flags button
2. **Create Your First Flag**: Go to PostHog and create a test flag
3. **Use in Code**: Import and use the flag in your components
4. **Read Full Docs**: See `docs/FEATURE_FLAGS.md` for comprehensive guide

## Support

For issues or questions:
- Check the full documentation in `docs/FEATURE_FLAGS.md`
- See examples in `client/src/components/FeatureFlagExamples.tsx`
- PostHog docs: https://posthog.com/docs/feature-flags

Happy feature flagging! 🚀
