// Production (breedly.us). Used by the `prod` build configuration, which
// Jenkinsfile.prod passes to the Docker build (NG_CONFIG=prod).
// environment.ts stays the dev-server (api-dev) config used by the `production` configuration.
export const environment = {
  production: true,
  API_HOST: 'https://api.breedly.us',
  API_URL: 'https://api.breedly.us/api',
  sentryDsn: '',
  sentryEnvironment: 'production',
  // Feature flags: must match ENABLE_* in the backend's delivery/docker-compose.prod.yml.
  enableServiceProviders: false,
  enableWaitlist: false,
  enableBilling: false,
};
