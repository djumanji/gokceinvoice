import { useState } from 'react';
import { useFeatureFlags, FEATURE_FLAGS } from '@/contexts/FeatureFlagContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Eye, EyeOff } from 'lucide-react';

/**
 * Debug panel to view and test feature flags
 * Only show this in development or for admin users
 */
export function FeatureFlagDebugPanel() {
  const { flags, isLoading, isFeatureEnabled, reloadFlags } = useFeatureFlags();
  const [isVisible, setIsVisible] = useState(false);

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsVisible(true)}
          className="shadow-lg"
        >
          <Eye className="h-4 w-4 mr-2" />
          Feature Flags
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Feature Flags</CardTitle>
              <CardDescription>
                {isLoading ? 'Loading...' : `${Object.keys(flags).length} flags loaded`}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={reloadFlags}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="max-h-96 overflow-y-auto">
          <div className="space-y-2">
            {Object.entries(FEATURE_FLAGS).map(([name, flagKey]) => {
              const enabled = isFeatureEnabled(flagKey);
              const value = flags[flagKey];

              return (
                <div
                  key={flagKey}
                  className="flex items-center justify-between p-2 rounded-lg border bg-card text-card-foreground hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-xs truncate" title={flagKey}>
                      {flagKey}
                    </div>
                    <div className="text-xs text-muted-foreground truncate" title={name}>
                      {name}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    {typeof value !== 'boolean' && value !== null && value !== undefined && (
                      <span className="text-xs px-2 py-1 bg-muted rounded">
                        {String(value)}
                      </span>
                    )}
                    <Badge
                      variant={enabled ? 'default' : 'secondary'}
                      className={enabled ? 'bg-green-500 hover:bg-green-600' : ''}
                    >
                      {enabled ? 'ON' : 'OFF'}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>

          {Object.keys(flags).length === 0 && !isLoading && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No feature flags loaded</p>
              <p className="text-xs mt-2">
                Create flags in your PostHog dashboard
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
