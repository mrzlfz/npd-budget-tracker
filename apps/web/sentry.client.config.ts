/**
 * Sentry Client Configuration
 * 
 * This file configures Sentry for the browser/client side.
 * It captures errors, performance metrics, and user feedback.
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_ENVIRONMENT = process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development';
const SENTRY_RELEASE = process.env.NEXT_PUBLIC_SENTRY_RELEASE || 'npd-tracker@1.0.0';

Sentry.init({
  // Data Source Name - unique identifier for your Sentry project
  dsn: SENTRY_DSN,

  // Environment (development, staging, production)
  environment: SENTRY_ENVIRONMENT,

  // Release version for tracking deployments
  release: SENTRY_RELEASE,

  // Performance Monitoring
  tracesSampleRate: SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev

  // Session Replay
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  // Integrations
  integrations: [
    new Sentry.BrowserTracing({
      // Set custom trace propagation targets
      tracePropagationTargets: [
        'localhost',
        /^https:\/\/[^/]*\.vercel\.app/,
        /^https:\/\/npd-tracker\./,
      ],
    }),
    new Sentry.Replay({
      // Mask all text and input content for privacy
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Before sending events, filter out sensitive data
  beforeSend(event, hint) {
    // Don't send events if DSN is not configured
    if (!SENTRY_DSN) {
      return null;
    }

    // Filter out specific errors
    if (event.exception) {
      const error = hint.originalException;
      
      // Ignore network errors from ad blockers
      if (error && typeof error === 'object' && 'message' in error) {
        const message = String(error.message);
        if (
          message.includes('blocked by client') ||
          message.includes('adblock') ||
          message.includes('Failed to fetch')
        ) {
          return null;
        }
      }
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

  // Ignore specific errors
  ignoreErrors: [
    // Browser extensions
    'top.GLOBALS',
    'chrome-extension://',
    'moz-extension://',
    // Random plugins/extensions
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    // Network errors
    'NetworkError',
    'Network request failed',
    // Clerk authentication errors (handled by Clerk)
    'Clerk:',
  ],

  // Denylist URLs
  denyUrls: [
    // Chrome extensions
    /extensions\//i,
    /^chrome:\/\//i,
    /^moz-extension:\/\//i,
    // Browser internal scripts
    /^file:\/\//i,
  ],
});

