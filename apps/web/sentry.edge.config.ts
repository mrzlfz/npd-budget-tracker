/**
 * Sentry Edge Configuration
 * 
 * This file configures Sentry for Edge Runtime (middleware, edge functions).
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.SENTRY_ENVIRONMENT || 'development';
const SENTRY_RELEASE = process.env.SENTRY_RELEASE || 'npd-tracker@1.0.0';

Sentry.init({
  // Data Source Name - unique identifier for your Sentry project
  dsn: SENTRY_DSN,

  // Environment (development, staging, production)
  environment: SENTRY_ENVIRONMENT,

  // Release version for tracking deployments
  release: SENTRY_RELEASE,

  // Performance Monitoring (lower sample rate for edge)
  tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.05 : 1.0, // 5% in prod, 100% in dev

  // Before sending events, filter out sensitive data
  beforeSend(event) {
    // Don't send events if DSN is not configured
    if (!SENTRY_DSN) {
      return null;
    }

    // Remove sensitive data from event
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers;
    }

    // Remove user IP address
    if (event.user) {
      delete event.user.ip_address;
    }

    return event;
  },
});

