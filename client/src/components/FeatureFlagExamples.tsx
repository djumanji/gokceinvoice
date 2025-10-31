/**
 * Example components demonstrating different ways to use feature flags
 */

import { useFeatureFlag, useFeatureFlagValue, FEATURE_FLAGS } from '@/contexts/FeatureFlagContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/**
 * Example 1: Simple boolean feature flag
 * Show/hide a feature based on a flag
 */
export function MessagingFeatureExample() {
  const isMessagingEnabled = useFeatureFlag(FEATURE_FLAGS.ENABLE_REAL_TIME_MESSAGING);

  if (!isMessagingEnabled) {
    return null; // Hide the feature completely
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Real-time Messaging</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This feature is enabled via PostHog feature flags!</p>
        <Button>Open Messages</Button>
      </CardContent>
    </Card>
  );
}

/**
 * Example 2: Conditional rendering with fallback
 * Show different UI based on flag status
 */
export function DashboardVariantExample() {
  const useNewDashboard = useFeatureFlag(FEATURE_FLAGS.ENABLE_NEW_DASHBOARD);

  return (
    <div>
      {useNewDashboard ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded">
          <h2>New Dashboard (Beta)</h2>
          <p>You're seeing the new dashboard design!</p>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded">
          <h2>Classic Dashboard</h2>
          <p>You're seeing the classic dashboard.</p>
        </div>
      )}
    </div>
  );
}

/**
 * Example 3: Feature flag with value (not just boolean)
 * Use flag value to configure behavior
 */
export function ThemeExample() {
  // Feature flag can return a string value like "light", "dark", "auto"
  const themeMode = useFeatureFlagValue<string>(
    FEATURE_FLAGS.ENABLE_DARK_MODE,
    'light'
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Mode</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Current theme: <Badge>{themeMode}</Badge></p>
      </CardContent>
    </Card>
  );
}

/**
 * Example 4: Progressive feature rollout
 * Enable features for specific user segments
 */
export function AdvancedAnalyticsExample() {
  const hasAdvancedAnalytics = useFeatureFlag(FEATURE_FLAGS.ENABLE_ADVANCED_ANALYTICS);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analytics Dashboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Always show basic analytics */}
          <div>
            <h3 className="font-semibold mb-2">Basic Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Total invoices, revenue, etc.
            </p>
          </div>

          {/* Only show advanced analytics if flag is enabled */}
          {hasAdvancedAnalytics && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">Advanced Analytics</h3>
              <p className="text-sm text-muted-foreground">
                Cohort analysis, retention curves, predictive insights
              </p>
              <Badge variant="secondary">Beta Feature</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Example 5: A/B Testing with feature flags
 * Show different button colors to test conversion
 */
export function CTAButtonExample() {
  // PostHog can return variant names like "control", "variant-a", "variant-b"
  const buttonVariant = useFeatureFlagValue<string>(
    'cta-button-variant' as any,
    'control'
  );

  const buttonClass = {
    control: 'bg-blue-500 hover:bg-blue-600',
    'variant-a': 'bg-green-500 hover:bg-green-600',
    'variant-b': 'bg-purple-500 hover:bg-purple-600',
  }[buttonVariant] || 'bg-blue-500 hover:bg-blue-600';

  return (
    <Button className={buttonClass}>
      Get Started {buttonVariant !== 'control' && `(${buttonVariant})`}
    </Button>
  );
}

/**
 * Example 6: Feature access based on user properties
 * Enable features for admins or premium users
 */
export function AdminPanelExample() {
  const isAdminPanelEnabled = useFeatureFlag(FEATURE_FLAGS.ENABLE_ADMIN_PANEL);

  if (!isAdminPanelEnabled) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded">
        <p className="text-sm">
          Admin panel is not available for your account.
        </p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Admin controls and settings</p>
        <Button>Manage Users</Button>
      </CardContent>
    </Card>
  );
}
