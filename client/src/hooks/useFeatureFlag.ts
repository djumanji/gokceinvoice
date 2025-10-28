import { useState, useEffect } from 'react';
import { isFeatureEnabled, getFeatureFlag } from '@/lib/posthog';

/**
 * Hook to check if a feature flag is enabled
 * @param flagKey The key of the feature flag
 * @param defaultValue Default value if flag is not available
 * @returns true if enabled, false otherwise
 */
export function useFeatureFlag(flagKey: string, defaultValue: boolean = false): boolean {
  const [enabled, setEnabled] = useState(defaultValue);

  useEffect(() => {
    const checkFlag = () => {
      const flagValue = isFeatureEnabled(flagKey);
      setEnabled(flagValue);
    };

    checkFlag();
  }, [flagKey]);

  return enabled;
}

/**
 * Hook to get a feature flag value (supports strings, numbers, booleans)
 * @param flagKey The key of the feature flag
 * @param defaultValue Default value if flag is not available
 * @returns The flag value or default value
 */
export function useFeatureFlagValue<T = any>(flagKey: string, defaultValue: T): T {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    const checkFlag = () => {
      const flagValue = getFeatureFlag(flagKey);
      setValue(flagValue !== null && flagValue !== undefined ? flagValue : defaultValue);
    };

    checkFlag();
  }, [flagKey, defaultValue]);

  return value;
}

/**
 * Hook to use feature flags with automatic reloading
 * @param flagKey The key of the feature flag
 * @param defaultValue Default value if flag is not available
 * @param reloadInterval Interval in milliseconds to reload flags (default: 30000)
 * @returns true if enabled, false otherwise
 */
export function useFeatureFlagWithReload(
  flagKey: string,
  defaultValue: boolean = false,
  reloadInterval: number = 30000
): boolean {
  const [enabled, setEnabled] = useState(defaultValue);

  useEffect(() => {
    const checkFlag = () => {
      const flagValue = isFeatureEnabled(flagKey);
      setEnabled(flagValue);
    };

    checkFlag();

    const interval = setInterval(checkFlag, reloadInterval);
    return () => clearInterval(interval);
  }, [flagKey, reloadInterval]);

  return enabled;
}

