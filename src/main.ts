import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import * as Sentry from '@sentry/angular';
import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.sentryDsn) {
  Sentry.init({
    dsn: environment.sentryDsn,
    environment: environment.sentryEnvironment,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Mask all text and block all media by default to protect user privacy
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Capture 10 % of transactions for performance monitoring
    tracesSampleRate: 0.1,
    // Capture 10 % of sessions for session replay; 100 % on errors
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => {
    Sentry.captureException(err);
    console.error(err);
  });
