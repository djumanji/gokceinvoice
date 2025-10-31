import { useFeatureFlag, useFeatureFlagValue, FEATURE_FLAGS, useFeatureFlags } from '@/contexts/FeatureFlagContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

/**
 * Demo page to test and showcase feature flags
 * Visit /feature-flag-demo to see this page
 */
export default function FeatureFlagDemo() {
  const { flags, isLoading, reloadFlags } = useFeatureFlags();

  // Test various feature flags
  const isMessagingEnabled = useFeatureFlag(FEATURE_FLAGS.ENABLE_REAL_TIME_MESSAGING);
  const isChatbotEnabled = useFeatureFlag(FEATURE_FLAGS.ENABLE_AI_CHATBOT);
  const isNewDashboardEnabled = useFeatureFlag(FEATURE_FLAGS.ENABLE_NEW_DASHBOARD);
  const isAdminPanelEnabled = useFeatureFlag(FEATURE_FLAGS.ENABLE_ADMIN_PANEL);
  const isDarkModeEnabled = useFeatureFlag(FEATURE_FLAGS.ENABLE_DARK_MODE);

  // Test getting flag values
  const darkModeValue = useFeatureFlagValue<string>(FEATURE_FLAGS.ENABLE_DARK_MODE, 'auto');

  const flagTests = [
    {
      name: 'Real-time Messaging',
      key: FEATURE_FLAGS.ENABLE_REAL_TIME_MESSAGING,
      enabled: isMessagingEnabled,
      description: 'Enable Socket.IO real-time messaging between users'
    },
    {
      name: 'AI Chatbot',
      key: FEATURE_FLAGS.ENABLE_AI_CHATBOT,
      enabled: isChatbotEnabled,
      description: 'Enable AI-powered lead capture chatbot'
    },
    {
      name: 'New Dashboard',
      key: FEATURE_FLAGS.ENABLE_NEW_DASHBOARD,
      enabled: isNewDashboardEnabled,
      description: 'Show redesigned dashboard UI'
    },
    {
      name: 'Admin Panel',
      key: FEATURE_FLAGS.ENABLE_ADMIN_PANEL,
      enabled: isAdminPanelEnabled,
      description: 'Enable admin-only features and controls'
    },
    {
      name: 'Dark Mode',
      key: FEATURE_FLAGS.ENABLE_DARK_MODE,
      enabled: isDarkModeEnabled,
      description: 'Enable dark mode theme',
      value: darkModeValue
    },
  ];

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Feature Flags Demo</h1>
            <p className="text-muted-foreground mt-2">
              Test and monitor PostHog feature flags in real-time
            </p>
          </div>
          <Button
            onClick={reloadFlags}
            disabled={isLoading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Reload Flags
          </Button>
        </div>

        {isLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">Loading feature flags from PostHog...</p>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        {flagTests.map((flag) => (
          <Card key={flag.key} className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{flag.name}</CardTitle>
                  <CardDescription className="mt-1">{flag.description}</CardDescription>
                </div>
                <Badge
                  variant={flag.enabled ? 'default' : 'secondary'}
                  className={`ml-2 ${flag.enabled ? 'bg-green-500 hover:bg-green-600' : ''}`}
                >
                  {flag.enabled ? (
                    <>
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      ON
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3 w-3 mr-1" />
                      OFF
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Flag Key:</span>
                  <code className="bg-muted px-2 py-1 rounded text-xs">
                    {flag.key}
                  </code>
                </div>
                {flag.value && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Value:</span>
                    <code className="bg-muted px-2 py-1 rounded text-xs">
                      {flag.value}
                    </code>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status:</span>
                  <span className={flag.enabled ? 'text-green-600 font-medium' : 'text-gray-500'}>
                    {flag.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </CardContent>
            {flag.enabled && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-green-600" />
            )}
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>How to Create Flags in PostHog</CardTitle>
          <CardDescription>
            Follow these steps to create and test feature flags
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                1
              </span>
              <div>
                <p className="font-medium">Go to PostHog Dashboard</p>
                <p className="text-sm text-muted-foreground">
                  Visit <a href="https://app.posthog.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">app.posthog.com</a> and navigate to "Feature Flags"
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                2
              </span>
              <div>
                <p className="font-medium">Create a New Flag</p>
                <p className="text-sm text-muted-foreground">
                  Click "New feature flag" and use one of the keys above (e.g., <code className="bg-muted px-1 rounded">enable-real-time-messaging</code>)
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                3
              </span>
              <div>
                <p className="font-medium">Set Release Conditions</p>
                <p className="text-sm text-muted-foreground">
                  Choose percentage rollout (e.g., 50% of users) or target specific users (e.g., <code className="bg-muted px-1 rounded">email = "you@example.com"</code>)
                </p>
              </div>
            </li>

            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                4
              </span>
              <div>
                <p className="font-medium">Enable & Test</p>
                <p className="text-sm text-muted-foreground">
                  Toggle "Enable feature flag" and click "Reload Flags" above to see changes
                </p>
              </div>
            </li>
          </ol>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium mb-2">💡 Pro Tip</p>
            <p className="text-sm text-blue-700">
              Use the Feature Flag Debug Panel (bottom-right corner) to see all flags in real-time during development!
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Total Flags Loaded</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{Object.keys(flags).length}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {Object.values(flags).filter(Boolean).length} enabled
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">PostHog Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={isLoading ? 'secondary' : 'default'} className="bg-green-500">
              {isLoading ? 'Loading...' : 'Connected'}
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              {import.meta.env.VITE_POSTHOG_HOST || 'app.posthog.com'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
