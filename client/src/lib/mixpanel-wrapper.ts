// Wrapper to prevent importing mixpanel.ts when disabled
const isMixpanelEnabled = import.meta.env.VITE_ENABLE_MIXPANEL === 'true';

// No-op functions for when Mixpanel is disabled
const noOp = () => {};

const mixpanelFunctions = {
  trackEvent: noOp,
  identifyUser: noOp,
  resetMixpanel: noOp,
  trackPageView: noOp,
};

// Only import the real mixpanel module if enabled
if (isMixpanelEnabled) {
  // Dynamic import to avoid loading when disabled
  import('./mixpanel').then((module) => {
    Object.assign(mixpanelFunctions, {
      trackEvent: module.trackEvent,
      identifyUser: module.identifyUser,
      resetMixpanel: module.resetMixpanel,
      trackPageView: module.trackPageView,
    });
  }).catch((error) => {
    console.warn('Failed to load Mixpanel module:', error);
  });
} else {
  console.log('Mixpanel wrapper: Analytics disabled via environment configuration');
}

// Export functions that delegate to either real or no-op implementations
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (!isMixpanelEnabled) {
    console.log('[Mixpanel Disabled] Track event:', eventName, properties);
    return;
  }
  mixpanelFunctions.trackEvent(eventName, properties);
};

export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (!isMixpanelEnabled) {
    console.log('[Mixpanel Disabled] Identify user:', userId, properties);
    return;
  }
  mixpanelFunctions.identifyUser(userId, properties);
};

export const resetMixpanel = () => {
  if (!isMixpanelEnabled) {
    console.log('[Mixpanel Disabled] Reset');
    return;
  }
  mixpanelFunctions.resetMixpanel();
};

export const trackPageView = (pageName: string) => {
  if (!isMixpanelEnabled) {
    console.log('[Mixpanel Disabled] Track page view:', pageName);
    return;
  }
  mixpanelFunctions.trackPageView(pageName);
};
