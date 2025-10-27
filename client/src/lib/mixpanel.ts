// Mock mixpanel object as fallback
const mockMixpanel = {
  track: () => {},
  identify: () => {},
  reset: () => {},
  alias: () => {},
  init: () => {},
  people: {
    set: () => {},
  },
};

let mixpanel: any = mockMixpanel;

// Try to import mixpanel, but don't fail if blocked
try {
  // Dynamic import to prevent blocking
  import('mixpanel-browser').then((mixpanelModule) => {
    mixpanel = mixpanelModule.default || mixpanelModule;
    // Initialize Mixpanel
    mixpanel.init('0ff4af01f6a3ed3ff6030cafbe6305c6', {
      autocapture: true,
      record_sessions_percent: 100,
      api_host: 'https://api-eu.mixpanel.com',
    });
  }).catch((error) => {
    console.warn('Mixpanel initialization failed (may be blocked by ad-blocker):', error);
  });
} catch (error) {
  console.warn('Mixpanel import failed:', error);
}

export { mixpanel };

