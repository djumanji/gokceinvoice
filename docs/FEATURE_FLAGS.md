# Feature Flags with PostHog

This application uses PostHog for feature flag management, allowing you to:
- Roll out features gradually to specific users
- A/B test different UI variants
- Enable/disable features without deploying code
- Target features to specific user segments

## Setup

### 1. PostHog Configuration

Feature flags are already configured in `.env`:

```env
VITE_ENABLE_POSTHOG=true
VITE_POSTHOG_KEY=your_posthog_key
VITE_POSTHOG_HOST=https://app.posthog.com
```

### 2. Wrap Your App with FeatureFlagProvider

In your main `App.tsx`, wrap your application with the provider:

```tsx
import { FeatureFlagProvider } from '@/contexts/FeatureFlagContext';
import { useQuery } from '@tanstack/react-query';

function App() {
  // Get current user
  const { data: user } = useQuery({ queryKey: ['/api/auth/me'] });

  return (
    <FeatureFlagProvider
      userId={user?.id}
      userProperties={{
        email: user?.email,
        isAdmin: user?.isAdmin,
        // Add any properties for targeting
      }}
    >
      <YourApp />
    </FeatureFlagProvider>
  );
}
```

## Using Feature Flags

### Available Flags

All feature flags are defined in `FEATURE_FLAGS` constant for type safety:

```tsx
import { FEATURE_FLAGS } from '@/contexts/FeatureFlagContext';

// Messaging features
FEATURE_FLAGS.ENABLE_REAL_TIME_MESSAGING
FEATURE_FLAGS.ENABLE_MESSAGE_TYPING_INDICATORS
FEATURE_FLAGS.ENABLE_MESSAGE_READ_RECEIPTS

// Lead capture features
FEATURE_FLAGS.ENABLE_AI_CHATBOT
FEATURE_FLAGS.ENABLE_LEAD_ENRICHMENT

// Invoice features
FEATURE_FLAGS.ENABLE_RECURRING_INVOICES
FEATURE_FLAGS.ENABLE_INVOICE_TEMPLATES
FEATURE_FLAGS.ENABLE_PDF_EXPORT

// Payment features
FEATURE_FLAGS.ENABLE_ONLINE_PAYMENTS
FEATURE_FLAGS.ENABLE_STRIPE_INTEGRATION

// Analytics features
FEATURE_FLAGS.ENABLE_ADVANCED_ANALYTICS
FEATURE_FLAGS.ENABLE_EXPENSE_TRACKING

// UI/UX features
FEATURE_FLAGS.ENABLE_DARK_MODE
FEATURE_FLAGS.ENABLE_NEW_DASHBOARD

// Admin features
FEATURE_FLAGS.ENABLE_ADMIN_PANEL
FEATURE_FLAGS.ENABLE_USER_MANAGEMENT
```

### Method 1: Simple Boolean Check

```tsx
import { useFeatureFlag, FEATURE_FLAGS } from '@/contexts/FeatureFlagContext';

function MessagingButton() {
  const isMessagingEnabled = useFeatureFlag(
    FEATURE_FLAGS.ENABLE_REAL_TIME_MESSAGING
  );

  if (!isMessagingEnabled) {
    return null; // Hide feature
  }

  return <Button>Open Messages</Button>;
}
```

### Method 2: Conditional Rendering

```tsx
function Dashboard() {
  const useNewDashboard = useFeatureFlag(FEATURE_FLAGS.ENABLE_NEW_DASHBOARD);

  return (
    <>
      {useNewDashboard ? (
        <NewDashboard />
      ) : (
        <ClassicDashboard />
      )}
    </>
  );
}
```

### Method 3: Get Flag Value (String, Number, etc.)

```tsx
import { useFeatureFlagValue, FEATURE_FLAGS } from '@/contexts/FeatureFlagContext';

function ThemeSelector() {
  // Flag can return "light", "dark", "auto"
  const themeMode = useFeatureFlagValue<string>(
    FEATURE_FLAGS.ENABLE_DARK_MODE,
    'light' // default value
  );

  return <div>Current theme: {themeMode}</div>;
}
```

### Method 4: A/B Testing

```tsx
function CTAButton() {
  // PostHog can return variant names
  const buttonVariant = useFeatureFlagValue<string>(
    'cta-button-test',
    'control'
  );

  const colors = {
    control: 'bg-blue-500',
    'variant-a': 'bg-green-500',
    'variant-b': 'bg-purple-500',
  };

  return (
    <Button className={colors[buttonVariant]}>
      Get Started
    </Button>
  );
}
```

## Creating Feature Flags in PostHog

### 1. Go to PostHog Dashboard
Navigate to **Feature Flags** in the PostHog dashboard

### 2. Create a New Flag
- Click "New feature flag"
- Enter flag key (e.g., `enable-real-time-messaging`)
- Add description

### 3. Set Release Conditions

#### Option A: Percentage Rollout
- Release to 10% of users
- Increase gradually to 100%

#### Option B: Target Specific Users
```
email = "admin@example.com"
OR
isAdmin = true
```

#### Option C: Multivariate (A/B Testing)
- control: 33%
- variant-a: 33%
- variant-b: 34%

### 4. Enable the Flag
Toggle "Enable feature flag" to activate

## Development Tools

### Feature Flag Debug Panel

In development mode, you'll see a "Feature Flags" button in the bottom right corner showing all active flags and their status.

```tsx
import { FeatureFlagDebugPanel } from '@/components/FeatureFlagDebugPanel';

function App() {
  return (
    <>
      <YourApp />
      <FeatureFlagDebugPanel /> {/* Only shows in dev */}
    </>
  );
}
```

## Best Practices

### 1. Always Use FEATURE_FLAGS Constants
```tsx
// ✅ Good - Type-safe
useFeatureFlag(FEATURE_FLAGS.ENABLE_MESSAGING)

// ❌ Bad - Typo-prone
useFeatureFlag('enable-mesaging')
```

### 2. Provide Default Values
```tsx
// ✅ Good - Graceful fallback
const enabled = useFeatureFlag(FEATURE_FLAGS.ENABLE_FEATURE, false);

// ⚠️ Risky - Undefined behavior if flag doesn't exist
const enabled = useFeatureFlag(FEATURE_FLAGS.ENABLE_FEATURE);
```

### 3. Clean Up Old Flags
- Remove feature flags from code once fully rolled out
- Archive flags in PostHog dashboard
- Keep code clean

### 4. Test Both States
Test your features with flags ON and OFF:
```tsx
// In tests
const { reloadFlags } = useFeatureFlags();

// Test with flag enabled
act(() => {
  posthog.featureFlags = { 'enable-feature': true };
  reloadFlags();
});

// Test with flag disabled
act(() => {
  posthog.featureFlags = { 'enable-feature': false };
  reloadFlags();
});
```

## Common Use Cases

### 1. Beta Features
Roll out new features to beta users first:
```tsx
// In PostHog: target users where `betaTester = true`
const canSeeBeta = useFeatureFlag(FEATURE_FLAGS.ENABLE_NEW_FEATURE);
```

### 2. Gradual Rollout
Start with 1%, increase to 10%, 50%, then 100%

### 3. Kill Switch
Quickly disable a feature if issues arise

### 4. A/B Testing
Test which UI performs better:
```tsx
const variant = useFeatureFlagValue('checkout-flow-test', 'v1');
return variant === 'v2' ? <NewCheckout /> : <OldCheckout />;
```

### 5. Premium Features
Enable features only for paying users:
```tsx
// In PostHog: target where `plan = "premium"`
const hasPremium = useFeatureFlag(FEATURE_FLAGS.ENABLE_PREMIUM_FEATURES);
```

## Troubleshooting

### Flags Not Loading?
1. Check PostHog is enabled: `VITE_ENABLE_POSTHOG=true`
2. Verify API key is correct
3. Check browser console for errors
4. Use the debug panel to see flag status

### Flags Not Updating?
1. Call `reloadFlags()` from context
2. PostHog caches flags - may take a few seconds
3. Clear local storage and refresh

### Flag Not Targeting Correctly?
1. Verify user properties are passed to `FeatureFlagProvider`
2. Check targeting rules in PostHog dashboard
3. Use PostHog's "Person" tab to see user properties

## Example Implementation

See `client/src/components/FeatureFlagExamples.tsx` for complete working examples.
