export const environment = {
  production: true,
  API_HOST: 'https://api-dev.breedly.us',
  API_URL: 'https://api-dev.breedly.us/api',
  sentryDsn: '',          // ← paste your Sentry DSN here
  sentryEnvironment: 'development',
  // Feature flags
  // Service provider accounts are hidden pre-launch. Must match
  // ENABLE_SERVICE_PROVIDERS in the backend's .env — keep both in sync.
  enableServiceProviders: false,
};
