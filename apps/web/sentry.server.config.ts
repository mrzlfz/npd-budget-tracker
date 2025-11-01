/**
 * Sentry Server Configuration
 * 
 * This file configures Sentry for the server side (API routes, SSR, etc.).
 * It captures server-side errors and performance metrics.
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

  // Performance Monitoring
  tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev

  // Before sending events, filter out sensitive data
  beforeSend(event, hint) {
    // Don't send events if DSN is not configured
    if (!SENTRY_DSN) {
      return null;
    }

    // Remove sensitive data from event
    if (event.request) {
      delete event.request.cookies;
      
      // Redact authorization headers
      if (event.request.headers) {
        event.request.headers = Object.keys(event.request.headers).reduce((acc, key) => {
          if (key.toLowerCase() === 'authorization' || key.toLowerCase() === 'cookie') {
            acc[key] = '[Redacted]';
          } else {
            acc[key] = event.request.headers![key];
          }
          return acc;
        }, {} as Record<string, string>);
      }
    }

    // Remove user IP address
    if (event.user) {
      delete event.user.ip_address;
    }

    // Redact sensitive data from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        if (breadcrumb.data) {
          // Redact common sensitive fields
          const sensitiveFields = ['password', 'token', 'apiKey', 'secret', 'authorization'];
          sensitiveFields.forEach((field) => {
            if (breadcrumb.data![field]) {
              breadcrumb.data![field] = '[Redacted]';
            }
          });
        }
        return breadcrumb;
      });
    }

    return event;
  },

  // Ignore specific errors
  ignoreErrors: [
    // Database connection errors (handled separately)
    'ECONNREFUSED',
    'ETIMEDOUT',
    // Clerk authentication errors (handled by Clerk)
    'Clerk:',
  ],
});

