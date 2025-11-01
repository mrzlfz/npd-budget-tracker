# Sentry Setup Guide for NPD Tracker

**Date:** November 1, 2025  
**Status:** ✅ CONFIGURED  
**Version:** @sentry/nextjs v8.x

---

## Overview

Sentry is configured for comprehensive error tracking, performance monitoring, and session replay across the NPD Tracker application. This guide covers setup, configuration, and best practices.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Configuration Files](#configuration-files)
4. [Environment Variables](#environment-variables)
5. [Usage Examples](#usage-examples)
6. [Monitoring Critical Operations](#monitoring-critical-operations)
7. [Performance Monitoring](#performance-monitoring)
8. [Session Replay](#session-replay)
9. [Alerts and Notifications](#alerts-and-notifications)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Sentry account (free tier available at [sentry.io](https://sentry.io))
- Project created in Sentry dashboard
- DSN (Data Source Name) from Sentry project settings

---

## Initial Setup

### 1. Create Sentry Project

1. Go to [sentry.io](https://sentry.io) and sign up/login
2. Click "Create Project"
3. Select **Next.js** as the platform
4. Name your project: `npd-tracker`
5. Copy the **DSN** (Data Source Name)

### 2. Configure Environment Variables

Add the following to your `.env.local` file:

```bash
# Sentry Configuration
SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
SENTRY_ENVIRONMENT=development  # or staging, production
SENTRY_RELEASE=npd-tracker@1.0.0

# Public variables (accessible in browser)
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/your-project-id
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development
NEXT_PUBLIC_SENTRY_RELEASE=npd-tracker@1.0.0
```

### 3. Verify Installation

The `@sentry/nextjs` package is already installed in `apps/web/package.json`.

---

## Configuration Files

### Client Configuration (`sentry.client.config.ts`)

Handles browser-side error tracking:

- **Location:** `apps/web/sentry.client.config.ts`
- **Features:**
  - Error tracking
  - Performance monitoring (10% sample rate in production)
  - Session replay (10% of sessions, 100% on errors)
  - Automatic breadcrumb creation
  - Sensitive data filtering

### Server Configuration (`sentry.server.config.ts`)

Handles server-side error tracking:

- **Location:** `apps/web/sentry.server.config.ts`
- **Features:**
  - API route error tracking
  - SSR error tracking
  - Performance monitoring
  - Sensitive data redaction (cookies, auth headers)

### Edge Configuration (`sentry.edge.config.ts`)

Handles edge runtime error tracking:

- **Location:** `apps/web/sentry.edge.config.ts`
- **Features:**
  - Middleware error tracking
  - Edge function monitoring
  - Lower sample rate (5% in production)

---

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SENTRY_DSN` | Server-side DSN | `https://abc@sentry.io/123` |
| `NEXT_PUBLIC_SENTRY_DSN` | Client-side DSN | `https://abc@sentry.io/123` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SENTRY_ENVIRONMENT` | Environment name | `development` |
| `SENTRY_RELEASE` | Release version | `npd-tracker@1.0.0` |
| `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | Client environment | `development` |
| `NEXT_PUBLIC_SENTRY_RELEASE` | Client release | `npd-tracker@1.0.0` |

---

## Usage Examples

### Basic Logging

```typescript
import { logger } from '@/lib/monitoring/logger';

// Info log
logger.info('User action completed', {
  userId: 'user_123',
  action: 'npd_created',
});

// Warning log
logger.warn('Budget threshold exceeded', {
  budgetId: 'budget_456',
  threshold: 0.8,
  current: 0.85,
});

// Error log
try {
  // Some operation
} catch (error) {
  logger.error('Operation failed', error, {
    operation: 'create_npd',
    userId: 'user_123',
  });
}
```

### Set User Context

```typescript
import { logger } from '@/lib/monitoring/logger';

// Set user context (automatically sent with all errors)
logger.setUser({
  id: 'user_123',
  email: 'user@example.com',
  username: 'john.doe',
  organizationId: 'org_456',
  role: 'pptk',
});

// Clear user context (on logout)
logger.clearUser();
```

### Track Custom Events

```typescript
import { logger } from '@/lib/monitoring/logger';

// Track a custom event
logger.track('npd_exported', {
  format: 'pdf',
  npdId: 'npd_123',
  fileSize: 1024000,
});
```

---

## Monitoring Critical Operations

### NPD Operations

```typescript
import { logNPDOperation } from '@/lib/monitoring/logger';

// NPD created
logNPDOperation.created('npd_123', 'user_456', {
  jenis: 'UP',
  totalNilai: 1000000,
});

// NPD submitted
logNPDOperation.submitted('npd_123', 'user_456');

// NPD verified
logNPDOperation.verified('npd_123', 'user_789');

// NPD rejected
logNPDOperation.rejected('npd_123', 'user_789', 'Budget exceeded');

// NPD finalized
logNPDOperation.finalized('npd_123', 'user_789');

// NPD error
try {
  // NPD operation
} catch (error) {
  logNPDOperation.error('create', 'npd_123', error as Error);
}
```

### SP2D Operations

```typescript
import { logSP2DOperation } from '@/lib/monitoring/logger';

// SP2D created
logSP2DOperation.created('sp2d_123', 'npd_456', 'user_789', 500000);

// SP2D updated
logSP2DOperation.updated('sp2d_123', 'user_789', {
  nilaiCair: 600000,
});

// SP2D deleted
logSP2DOperation.deleted('sp2d_123', 'user_789');

// SP2D error
try {
  // SP2D operation
} catch (error) {
  logSP2DOperation.error('create', 'sp2d_123', error as Error);
}
```

### Authentication Events

```typescript
import { logAuthEvent } from '@/lib/monitoring/logger';

// User login
logAuthEvent.login('user_123', 'org_456');

// User logout
logAuthEvent.logout('user_123');

// Organization switch
logAuthEvent.organizationSwitch('user_123', 'org_456', 'org_789');

// Auth error
try {
  // Auth operation
} catch (error) {
  logAuthEvent.error('login', error as Error);
}
```

### File Operations

```typescript
import { logFileOperation } from '@/lib/monitoring/logger';

// File uploaded
logFileOperation.uploaded('file_123', 'document.pdf', 1024000, 'user_456');

// File downloaded
logFileOperation.downloaded('file_123', 'document.pdf', 'user_456');

// File deleted
logFileOperation.deleted('file_123', 'document.pdf', 'user_456');

// File error
try {
  // File operation
} catch (error) {
  logFileOperation.error('upload', 'document.pdf', error as Error);
}
```

---

## Performance Monitoring

### Automatic Performance Tracking

Sentry automatically tracks:
- Page load times
- API route response times
- Database query durations
- Component render times

### Manual Performance Tracking

```typescript
import { logger } from '@/lib/monitoring/logger';

// Start a transaction
const transaction = logger.startTransaction('npd_creation', 'task');

try {
  // Perform operation
  const npd = await createNPD(data);
  
  transaction.setStatus('ok');
} catch (error) {
  transaction.setStatus('internal_error');
  throw error;
} finally {
  transaction.finish();
}
```

### Log Slow Queries

```typescript
import { logPerformance } from '@/lib/monitoring/logger';

const startTime = Date.now();
const result = await db.query('SELECT * FROM npd WHERE ...');
const duration = Date.now() - startTime;

if (duration > 1000) {
  logPerformance.slowQuery('getNPDList', duration, { filters });
}
```

---

## Session Replay

Session Replay captures user interactions to help debug issues:

- **Sample Rate:** 10% of all sessions
- **Error Rate:** 100% of sessions with errors
- **Privacy:** All text and media are masked by default

### View Replays

1. Go to Sentry dashboard
2. Navigate to **Replays** section
3. Filter by error or user
4. Watch the replay to see what the user experienced

---

## Alerts and Notifications

### Set Up Alerts

1. Go to **Alerts** in Sentry dashboard
2. Click **Create Alert**
3. Choose alert type:
   - **Issues:** Alert on new/recurring errors
   - **Performance:** Alert on slow transactions
   - **Crash Free Rate:** Alert when crash rate drops

### Recommended Alerts

1. **Critical Errors**
   - Condition: New issue with level = `fatal`
   - Action: Email + Slack notification

2. **High Error Rate**
   - Condition: >10 errors in 5 minutes
   - Action: Email notification

3. **Slow API Routes**
   - Condition: API response time >2 seconds
   - Action: Slack notification

4. **Budget Calculation Errors**
   - Condition: Error contains "budget" or "sisaPagu"
   - Action: Email + Slack notification

---

## Best Practices

### 1. Use Structured Logging

```typescript
// Good: Structured data
logger.info('NPD created', {
  npdId: 'npd_123',
  userId: 'user_456',
  type: 'UP',
});

// Bad: Unstructured string
logger.info(`NPD npd_123 created by user_456 with type UP`);
```

### 2. Add Context to Errors

```typescript
// Good: Context provided
try {
  await createNPD(data);
} catch (error) {
  logger.error('Failed to create NPD', error, {
    userId: user.id,
    organizationId: org.id,
    npdType: data.jenis,
  });
}

// Bad: No context
try {
  await createNPD(data);
} catch (error) {
  logger.error('Error', error);
}
```

### 3. Set User Context Early

```typescript
// In your auth provider or layout
useEffect(() => {
  if (user) {
    logger.setUser({
      id: user.id,
      email: user.email,
      organizationId: user.organizationId,
      role: user.role,
    });
  }
}, [user]);
```

### 4. Use Appropriate Log Levels

- **`debug`:** Development-only information
- **`info`:** Normal operations (NPD created, user logged in)
- **`warn`:** Concerning but not breaking (budget threshold exceeded)
- **`error`:** Operation failed but recoverable
- **`fatal`:** Application-breaking error

### 5. Don't Log Sensitive Data

```typescript
// Good: Sensitive data excluded
logger.info('User authenticated', {
  userId: user.id,
  organizationId: user.organizationId,
});

// Bad: Password logged
logger.info('User authenticated', {
  userId: user.id,
  password: user.password, // ❌ NEVER DO THIS
});
```

---

## Troubleshooting

### Events Not Appearing in Sentry

**Check:**
1. DSN is correctly set in environment variables
2. Environment is not `development` (or enable in dev)
3. Error is not in `ignoreErrors` list
4. Network is not blocking Sentry requests

**Solution:**
```bash
# Check environment variables
echo $SENTRY_DSN
echo $NEXT_PUBLIC_SENTRY_DSN

# Test Sentry connection
curl -X POST https://sentry.io/api/YOUR_PROJECT_ID/store/ \
  -H "X-Sentry-Auth: Sentry sentry_key=YOUR_KEY" \
  -d '{"message":"Test"}'
```

### Too Many Events

**Problem:** Hitting Sentry quota limits

**Solution:**
1. Adjust sample rates in config files
2. Add more errors to `ignoreErrors` list
3. Upgrade Sentry plan

### Sensitive Data in Events

**Problem:** Passwords/tokens appearing in Sentry

**Solution:**
1. Update `beforeSend` hook in config files
2. Add sensitive fields to redaction list
3. Review all logging calls

---

## Monitoring Dashboard

### Key Metrics to Monitor

1. **Error Rate**
   - Target: <0.1% of requests
   - Alert: >1% in 5 minutes

2. **Response Time (P95)**
   - Target: <500ms
   - Alert: >1000ms

3. **Crash Free Rate**
   - Target: >99.9%
   - Alert: <99%

4. **Session Duration**
   - Target: >5 minutes average
   - Monitor: Trend over time

### Weekly Review Checklist

- [ ] Review top 10 errors
- [ ] Check performance regressions
- [ ] Review slow transactions
- [ ] Update alert thresholds
- [ ] Clean up resolved issues

---

## Next Steps

1. ✅ Sentry configuration files created
2. ✅ Logger utility implemented
3. ✅ Critical operations logging added
4. ⏳ Set up Sentry project and get DSN
5. ⏳ Add DSN to environment variables
6. ⏳ Deploy to staging and verify events
7. ⏳ Configure alerts and notifications
8. ⏳ Train team on logging best practices

---

## Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Performance Monitoring](https://docs.sentry.io/product/performance/)
- [Sentry Session Replay](https://docs.sentry.io/product/session-replay/)
- [Sentry Alerts](https://docs.sentry.io/product/alerts/)

---

**Last Updated:** November 1, 2025  
**Maintainer:** Development Team  
**Status:** Ready for deployment

