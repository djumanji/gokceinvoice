import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import posthog from '@/lib/posthog';
import { identifyUser } from '@/lib/posthog';

/**
 * Feature flag keys used in the application
 * Define all feature flags here for type safety
 */
export const FEATURE_FLAGS = {
  // Messaging features
  ENABLE_REAL_TIME_MESSAGING: 'enable-real-time-messaging',
  ENABLE_MESSAGE_TYPING_INDICATORS: 'enable-message-typing-indicators',
  ENABLE_MESSAGE_READ_RECEIPTS: 'enable-message-read-receipts',

  // Lead capture features
  ENABLE_AI_CHATBOT: 'enable-ai-chatbot',
  ENABLE_LEAD_ENRICHMENT: 'enable-lead-enrichment',

  // Invoice features
  ENABLE_RECURRING_INVOICES: 'enable-recurring-invoices',
  ENABLE_INVOICE_TEMPLATES: 'enable-invoice-templates',
  ENABLE_PDF_EXPORT: 'enable-pdf-export',

  // Payment features
  ENABLE_ONLINE_PAYMENTS: 'enable-online-payments',
  ENABLE_STRIPE_INTEGRATION: 'enable-stripe-integration',

  // Analytics features
  ENABLE_ADVANCED_ANALYTICS: 'enable-advanced-analytics',
  ENABLE_EXPENSE_TRACKING: 'enable-expense-tracking',

  // UI/UX features
  ENABLE_DARK_MODE: 'enable-dark-mode',
  ENABLE_NEW_DASHBOARD: 'enable-new-dashboard',

  // Admin features
  ENABLE_ADMIN_PANEL: 'enable-admin-panel',
  ENABLE_USER_MANAGEMENT: 'enable-user-management',
} as const;

export type FeatureFlagKey = typeof FEATURE_FLAGS[keyof typeof FEATURE_FLAGS];

interface FeatureFlagContextType {
  flags: Record<string, boolean | string | number>;
  isLoading: boolean;
  isFeatureEnabled: (flagKey: FeatureFlagKey) => boolean;
  getFeatureFlagValue: <T = any>(flagKey: FeatureFlagKey, defaultValue?: T) => T;
  reloadFlags: () => void;
}

const FeatureFlagContext = createContext<FeatureFlagContextType>({
  flags: {},
  isLoading: true,
  isFeatureEnabled: () => false,
  getFeatureFlagValue: () => null,
  reloadFlags: () => {},
});

interface FeatureFlagProviderProps {
  children: ReactNode;
  userId?: string;
  userProperties?: Record<string, any>;
}

export function FeatureFlagProvider({
  children,
  userId,
  userProperties
}: FeatureFlagProviderProps) {
  const [flags, setFlags] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Identify user with PostHog when userId changes
  useEffect(() => {
    if (userId) {
      identifyUser(userId, userProperties);
    }
  }, [userId, userProperties]);

  // Load feature flags
  const loadFlags = async () => {
    try {
      setIsLoading(true);

      // Wait for PostHog to be ready
      await new Promise((resolve) => {
        if (typeof posthog?.onFeatureFlags === 'function') {
          posthog.onFeatureFlags(resolve);
        } else {
          // If PostHog is not ready, resolve after a short delay
          setTimeout(resolve, 1000);
        }
      });

      // Get all feature flags
      const allFlags: Record<string, any> = {};
      Object.values(FEATURE_FLAGS).forEach((flagKey) => {
        try {
          if (typeof posthog?.getFeatureFlag === 'function') {
            const value = posthog.getFeatureFlag(flagKey);
            allFlags[flagKey] = value;
          }
        } catch (error) {
          console.warn(`Error loading flag ${flagKey}:`, error);
        }
      });

      setFlags(allFlags);
    } catch (error) {
      console.error('Error loading feature flags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load flags on mount
  useEffect(() => {
    loadFlags();
  }, []);

  // Reload flags when user changes
  useEffect(() => {
    if (userId) {
      loadFlags();
    }
  }, [userId]);

  const isFeatureEnabled = (flagKey: FeatureFlagKey): boolean => {
    const value = flags[flagKey];

    // Handle boolean flags
    if (typeof value === 'boolean') {
      return value;
    }

    // Handle string flags (treat "true" as true)
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true';
    }

    // Default to false
    return false;
  };

  const getFeatureFlagValue = <T = any>(
    flagKey: FeatureFlagKey,
    defaultValue?: T
  ): T => {
    const value = flags[flagKey];
    return value !== null && value !== undefined ? value : (defaultValue as T);
  };

  const reloadFlags = () => {
    if (typeof posthog?.reloadFeatureFlags === 'function') {
      posthog.reloadFeatureFlags();
    }
    loadFlags();
  };

  return (
    <FeatureFlagContext.Provider
      value={{
        flags,
        isLoading,
        isFeatureEnabled,
        getFeatureFlagValue,
        reloadFlags,
      }}
    >
      {children}
    </FeatureFlagContext.Provider>
  );
}

/**
 * Hook to access feature flags context
 */
export function useFeatureFlags() {
  const context = useContext(FeatureFlagContext);
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  return context;
}

/**
 * Hook to check if a specific feature is enabled
 */
export function useFeatureFlag(flagKey: FeatureFlagKey, defaultValue: boolean = false): boolean {
  const { isFeatureEnabled, isLoading, flags } = useFeatureFlags();

  if (isLoading) {
    return defaultValue;
  }

  return isFeatureEnabled(flagKey);
}

/**
 * Hook to get a feature flag value with type safety
 */
export function useFeatureFlagValue<T = any>(
  flagKey: FeatureFlagKey,
  defaultValue: T
): T {
  const { getFeatureFlagValue, isLoading } = useFeatureFlags();

  if (isLoading) {
    return defaultValue;
  }

  return getFeatureFlagValue(flagKey, defaultValue);
}
