// Check if Mixpanel is enabled via environment variable
const isMixpanelEnabled = import.meta.env.VITE_ENABLE_MIXPANEL === 'true';

// Mock Mixpanel for when it's disabled
const mockMixpanel = {
  init: () => {},
  track: () => {},
  identify: () => {},
  reset: () => {},
  people: {
    set: () => {}
  }
};

let mixpanelInstance: any = mockMixpanel;

// Only import and initialize real Mixpanel if enabled
// IMPORTANT: This prevents Mixpanel from even attempting to load when disabled
if (isMixpanelEnabled && !import.meta.env.DEV) {
  // Only load Mixpanel in production AND when explicitly enabled
  try {
    // Dynamic import to completely avoid loading Mixpanel when disabled
    import('mixpanel-browser').then((module) => {
      const mixpanelBrowser = module.default;
      const MIXPANEL_TOKEN = import.meta.env.VITE_MIXPANEL_TOKEN;

      if (!MIXPANEL_TOKEN) {
        console.warn('Mixpanel token not configured');
        return;
      }

      mixpanelBrowser.init(MIXPANEL_TOKEN, {
        debug: false,
        track_pageview: true,
        persistence: 'localStorage',
        api_host: 'https://api-eu.mixpanel.com',
        batch_size: 50,
        batch_flush_interval_ms: 10000,
        autocapture: true,
        record_sessions_percent: 100,
      });

      mixpanelInstance = mixpanelBrowser;
      console.log('Mixpanel initialized');
    }).catch((error) => {
      console.warn('Failed to load Mixpanel:', error);
    });
  } catch (error) {
    console.warn('Mixpanel not available:', error);
  }
} else {
  if (import.meta.env.DEV) {
    console.log('Mixpanel disabled in local development');
  } else {
    console.log('Mixpanel disabled via environment configuration');
  }
}

// Enhanced tracking functions
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  if (!isMixpanelEnabled) {
    console.log('[Mixpanel Disabled] Track event:', eventName, properties);
    return;
  }
  try {
    mixpanelInstance.track(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    });
  } catch (error) {
    console.warn('Mixpanel track error:', error);
  }
};

export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  if (!isMixpanelEnabled) {
    console.log('[Mixpanel Disabled] Identify user:', userId, properties);
    return;
  }
  try {
    mixpanelInstance.identify(userId);
    if (properties) {
      mixpanelInstance.people.set(properties);
    }
  } catch (error) {
    console.warn('Mixpanel identify error:', error);
  }
};

export const resetMixpanel = () => {
  if (!isMixpanelEnabled) {
    console.log('[Mixpanel Disabled] Reset');
    return;
  }
  try {
    mixpanelInstance.reset();
  } catch (error) {
    console.warn('Mixpanel reset error:', error);
  }
};

// Track page views
export const trackPageView = (pageName: string) => {
  if (!isMixpanelEnabled) {
    console.log('[Mixpanel Disabled] Track page view:', pageName);
    return;
  }
  try {
    mixpanelInstance.track('Page View', {
      page: pageName,
      url: window.location.href,
    });
  } catch (error) {
    console.warn('Mixpanel page view error:', error);
  }
};

export default mixpanelInstance;
