// Check if PostHog is enabled via environment variable
const isPostHogEnabled = import.meta.env.VITE_ENABLE_POSTHOG === 'true';

// Mock PostHog for when it's disabled
const mockPostHog = {
  init: () => {},
  capture: () => {},
  identify: () => {},
  reset: () => {},
  onFeatureFlags: () => {},
  getFeatureFlag: () => null,
  isFeatureEnabled: () => false,
  reloadFeatureFlags: () => {}
};

let posthogInstance: any = mockPostHog;

// Only import and initialize real PostHog if enabled
if (isPostHogEnabled) {
  // Dynamic import to completely avoid loading PostHog when disabled
  import('posthog-js').then((module) => {
    const posthog = module.default;
    const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY;
    const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com';

    if (!POSTHOG_KEY) {
      console.warn('PostHog key not configured');
      return;
    }

    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: true,
      capture_pageleave: true,
      loaded: (posthog) => {
        if (import.meta.env.DEV) console.log('PostHog loaded', posthog);
      }
    });

    posthogInstance = posthog;
    console.log('PostHog initialized');
  }).catch((error) => {
    console.warn('Failed to load PostHog:', error);
  });
} else {
  console.log('PostHog disabled via environment configuration');
}

// Enhanced tracking functions
export const captureEvent = (eventName: string, properties?: Record<string, any>) => {
  if (!isPostHogEnabled) {
    console.log('[PostHog Disabled] Capture event:', eventName, properties);
    return;
  }
  try {
    posthogInstance.capture(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    });
  } catch (error) {
    console.warn('PostHog capture error:', error);
  }
};

export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (!isPostHogEnabled) {
    console.log('[PostHog Disabled] Identify user:', userId, properties);
    return;
  }
  try {
    posthogInstance.identify(userId, properties);
  } catch (error) {
    console.warn('PostHog identify error:', error);
  }
};

export const resetPostHog = () => {
  if (!isPostHogEnabled) {
    console.log('[PostHog Disabled] Reset');
    return;
  }
  try {
    posthogInstance.reset();
  } catch (error) {
    console.warn('PostHog reset error:', error);
  }
};

// Feature flag functions
export const getFeatureFlag = (flagKey: string) => {
  if (!isPostHogEnabled) {
    console.log('[PostHog Disabled] Get feature flag:', flagKey);
    return null;
  }
  try {
    return posthogInstance.getFeatureFlag(flagKey);
  } catch (error) {
    console.warn('PostHog get feature flag error:', error);
    return null;
  }
};

export const isFeatureEnabled = (flagKey: string) => {
  if (!isPostHogEnabled) {
    console.log('[PostHog Disabled] Is feature enabled:', flagKey);
    return false;
  }
  try {
    return posthogInstance.isFeatureEnabled(flagKey);
  } catch (error) {
    console.warn('PostHog is feature enabled error:', error);
    return false;
  }
};

export const reloadFeatureFlags = () => {
  if (!isPostHogEnabled) {
    console.log('[PostHog Disabled] Reload feature flags');
    return;
  }
  try {
    posthogInstance.reloadFeatureFlags();
  } catch (error) {
    console.warn('PostHog reload feature flags error:', error);
  }
};

// Track page views
export const trackPageView = (pageName: string) => {
  if (!isPostHogEnabled) {
    console.log('[PostHog Disabled] Track page view:', pageName);
    return;
  }
  try {
    posthogInstance.capture('$pageview', {
      page: pageName,
      url: window.location.href,
    });
  } catch (error) {
    console.warn('PostHog page view error:', error);
  }
};

export default posthogInstance;