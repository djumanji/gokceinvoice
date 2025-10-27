import mixpanel from "mixpanel-browser";

// Initialize Mixpanel
mixpanel.init('0ff4af01f6a3ed3ff6030cafbe6305c6', {
  autocapture: true,
  record_sessions_percent: 100,
  api_host: 'https://api-eu.mixpanel.com',
});

export { mixpanel };

