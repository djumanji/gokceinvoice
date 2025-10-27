import mixpanelBrowser from 'mixpanel-browser';

// Initialize Mixpanel with your token
const MIXPANEL_TOKEN = 'b47d22b9652dcdffbcb7a623a82f84b2';

// Initialize Mixpanel immediately
mixpanelBrowser.init(MIXPANEL_TOKEN, {
  debug: process.env.NODE_ENV === 'development',
  track_pageview: true,
  persistence: 'localStorage',
  api_host: 'https://api-eu.mixpanel.com',
  batch_size: 50,
  batch_flush_interval_ms: 10000,
  autocapture: true,
  record_sessions_percent: 100,
});

// Enhanced tracking functions
export const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  try {
    mixpanelBrowser.track(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    });
  } catch (error) {
    console.warn('Mixpanel track error:', error);
  }
};

export const identifyUser = (userId: string, properties?: Record<string, any>) => {
  try {
    mixpanelBrowser.identify(userId);
    if (properties) {
      mixpanelBrowser.people.set(properties);
    }
  } catch (error) {
    console.warn('Mixpanel identify error:', error);
  }
};

export const resetMixpanel = () => {
  try {
    mixpanelBrowser.reset();
  } catch (error) {
    console.warn('Mixpanel reset error:', error);
  }
};

// Track page views
export const trackPageView = (pageName: string) => {
  try {
    mixpanelBrowser.track('Page View', {
      page: pageName,
      url: window.location.href,
    });
  } catch (error) {
    console.warn('Mixpanel page view error:', error);
  }
};

export default mixpanelBrowser;
