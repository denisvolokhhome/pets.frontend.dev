export const environment = {
  production: false,
  API_HOST: 'http://breedly.com:8000',
  API_URL: 'http://breedly.com:8000/api',
  sentryDsn: '',          // ← paste your Sentry DSN here
  sentryEnvironment: 'local',
  // Feature flags
  // Service provider accounts are hidden pre-launch. Must match
  // ENABLE_SERVICE_PROVIDERS in the backend's .env — keep both in sync.
  // Flip to true locally if you need to develop/test the service-provider flow.
  enableServiceProviders: false,
};
