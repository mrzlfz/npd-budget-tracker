# NPD Tracker - Environment Variables Guide

This document lists all environment variables required for the NPD Tracker application.

## Setup Instructions

1. Copy the template below to a new file named `.env.local` in the `apps/web` directory
2. Fill in your actual values (never commit `.env.local` to version control)
3. Ensure all required variables are set before running the application

---

## Environment Variables Template

```bash
# ============================================================================
# CONVEX
# ============================================================================
# Get these from: https://dashboard.convex.dev/
# 1. Create a new project or select existing
# 2. Go to Settings > URL & Deploy Key
CONVEX_DEPLOYMENT=dev:your-deployment-name-here # e.g., dev:happy-animal-123
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud # e.g., https://happy-animal-123.convex.cloud

# ============================================================================
# CLERK AUTHENTICATION
# ============================================================================
# Get these from: https://dashboard.clerk.com/
# 1. Create a new application or select existing
# 2. Go to API Keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Clerk URLs (update with your domain in production)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Clerk Webhook Secret (for syncing users)
# Get from: Clerk Dashboard > Webhooks > Add Endpoint
CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ============================================================================
# RESEND EMAIL SERVICE
# ============================================================================
# Get API key from: https://resend.com/api-keys
# Required for email notifications (NPD submission, approval, etc.)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ============================================================================
# SENTRY ERROR TRACKING & MONITORING
# ============================================================================
# Get DSN from: https://sentry.io/settings/projects/
# 1. Create a new project (select Next.js platform)
# 2. Copy the DSN from project settings
# Required for error tracking, performance monitoring, and session replay

# Server-side Sentry DSN
SENTRY_DSN=https://your-sentry-key@sentry.io/your-project-id

# Client-side Sentry DSN (public, sent to browser)
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-key@sentry.io/your-project-id

# Environment name (development, staging, production)
SENTRY_ENVIRONMENT=development
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development

# Release version (for tracking deployments)
SENTRY_RELEASE=npd-tracker@1.0.0
NEXT_PUBLIC_SENTRY_RELEASE=npd-tracker@1.0.0

# Optional: Auth token for uploading source maps (production only)
# Get from: https://sentry.io/settings/account/api/auth-tokens/
# SENTRY_AUTH_TOKEN=your-auth-token-here

# Email sender configuration
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=NPD Tracker

# ============================================================================
# APPLICATION CONFIGURATION
# ============================================================================
# Base URL of your application (update for production)
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Application name (shown in emails and PDFs)
NEXT_PUBLIC_APP_NAME=NPD Tracker

# Organization branding
NEXT_PUBLIC_DEFAULT_ORG_NAME=Your Organization Name
NEXT_PUBLIC_DEFAULT_ORG_LOGO=/images/logo.png

# ============================================================================
# FILE STORAGE
# ============================================================================
# Maximum file size for uploads (in bytes)
# Default: 10MB = 10 * 1024 * 1024
NEXT_PUBLIC_MAX_FILE_SIZE=10485760

# Maximum total storage per organization (in bytes)
# Default: 1GB = 1 * 1024 * 1024 * 1024
MAX_ORG_STORAGE_QUOTA=1073741824

# Allowed file types (comma-separated MIME types)
ALLOWED_FILE_TYPES=application/pdf,image/jpeg,image/png,image/gif,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet

# ============================================================================
# PDF GENERATION
# ============================================================================
# PDF generation timeout (in milliseconds)
PDF_GENERATION_TIMEOUT=30000

# PDF cache TTL (in seconds)
# Default: 1 hour = 3600
PDF_CACHE_TTL=3600

# Puppeteer configuration
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser # Optional: custom Chrome/Chromium path
PUPPETEER_HEADLESS=true

# ============================================================================
# RATE LIMITING
# ============================================================================
# API rate limit (requests per minute per user)
API_RATE_LIMIT=100

# File download rate limit (downloads per hour per user)
FILE_DOWNLOAD_RATE_LIMIT=100

# Email rate limit (emails per hour per organization)
EMAIL_RATE_LIMIT=100

# ============================================================================
# SENTRY ERROR TRACKING
# ============================================================================
# Get DSN from: https://sentry.io/settings/projects/
# Required for production error monitoring
NEXT_PUBLIC_SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@sentry.io/xxxxxxx
SENTRY_ORG=your-org-name
SENTRY_PROJECT=npd-tracker
SENTRY_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Sentry environment (development, staging, production)
SENTRY_ENVIRONMENT=development

# Enable Sentry in development (set to false to disable)
SENTRY_ENABLED=false

# ============================================================================
# DATABASE & CACHING
# ============================================================================
# Redis URL (optional, for caching)
# Format: redis://username:password@host:port
REDIS_URL=redis://localhost:6379

# Redis cache TTL (in seconds)
REDIS_CACHE_TTL=3600

# ============================================================================
# FEATURE FLAGS
# ============================================================================
# Enable/disable features for testing or gradual rollout
FEATURE_EMAIL_NOTIFICATIONS=true
FEATURE_PDF_GENERATION=true
FEATURE_FILE_UPLOADS=true
FEATURE_CSV_EXPORT=true
FEATURE_EXCEL_EXPORT=true
FEATURE_PERFORMANCE_TRACKING=true
FEATURE_SP2D_EDIT=true
FEATURE_SP2D_DELETE=true

# ============================================================================
# LOGGING & MONITORING
# ============================================================================
# Log level (debug, info, warn, error)
LOG_LEVEL=info

# Enable verbose logging (set to false in production)
VERBOSE_LOGGING=false

# Health check endpoint secret
HEALTH_CHECK_SECRET=your-secret-health-check-token

# ============================================================================
# SECURITY
# ============================================================================
# JWT secret for API authentication (generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Session secret (generate with: openssl rand -base64 32)
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# CSRF token secret (generate with: openssl rand -base64 32)
CSRF_SECRET=your-super-secret-csrf-key-change-this-in-production

# Enable HTTPS in production
FORCE_HTTPS=false

# Content Security Policy (CSP) mode (report-only or enforce)
CSP_MODE=report-only

# ============================================================================
# EXTERNAL SERVICES (OPTIONAL)
# ============================================================================
# Google Analytics tracking ID (optional)
NEXT_PUBLIC_GA_TRACKING_ID=G-XXXXXXXXXX

# Google Maps API key (optional, for location features)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# AWS S3 (optional, for alternative file storage)
AWS_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=npd-tracker-files

# ============================================================================
# DEVELOPMENT ONLY
# ============================================================================
# Enable Next.js debug mode
DEBUG=false

# Disable telemetry
NEXT_TELEMETRY_DISABLED=1

# Enable React strict mode
REACT_STRICT_MODE=true

# ============================================================================
# PRODUCTION ONLY
# ============================================================================
# Vercel deployment URL (auto-populated by Vercel)
# VERCEL_URL=your-app.vercel.app

# Production domain
# PRODUCTION_URL=https://npd-tracker.yourdomain.com

# ============================================================================
# TESTING
# ============================================================================
# Test database URL (for integration tests)
TEST_CONVEX_DEPLOYMENT=dev:test-deployment-name

# Test user credentials (for E2E tests)
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=test-password-123

# Playwright configuration
PLAYWRIGHT_HEADLESS=true
PLAYWRIGHT_SLOWMO=0

# ============================================================================
# BACKUP & MAINTENANCE
# ============================================================================
# Backup schedule (cron format)
BACKUP_SCHEDULE=0 2 * * * # Daily at 2 AM

# Backup retention days
BACKUP_RETENTION_DAYS=30

# Maintenance mode (set to true to enable maintenance page)
MAINTENANCE_MODE=false

# ============================================================================
# LOCALIZATION
# ============================================================================
# Default locale
NEXT_PUBLIC_DEFAULT_LOCALE=id-ID

# Supported locales (comma-separated)
NEXT_PUBLIC_SUPPORTED_LOCALES=id-ID,en-US

# Default timezone
NEXT_PUBLIC_DEFAULT_TIMEZONE=Asia/Jakarta

# Default currency
NEXT_PUBLIC_DEFAULT_CURRENCY=IDR
```

---

## Required Variables

### Minimum for Local Development

These variables are **required** for basic functionality:

- `CONVEX_DEPLOYMENT`
- `NEXT_PUBLIC_CONVEX_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`

### Additional for Email Notifications

- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`

### Required for Production

All of the above, plus:
- `NEXT_PUBLIC_SENTRY_DSN`
- Update all URLs to production domains
- Generate new secrets for `JWT_SECRET`, `SESSION_SECRET`, `CSRF_SECRET`

---

## Optional Variables

- **Redis**: For caching (improves performance)
- **AWS S3**: For alternative file storage
- **Google Analytics**: For usage tracking
- **Google Maps**: For location features

---

## Security Best Practices

1. **Never commit `.env.local` to version control**
   - Add `.env.local` to `.gitignore` (already done)
   - Use `.env.example` as a template only

2. **Use different secrets for each environment**
   - Development, staging, and production should have separate credentials
   - Never reuse production secrets in development

3. **Rotate secrets regularly**
   - Change API keys and secrets periodically
   - Update immediately if compromised

4. **Use strong, randomly generated secrets**
   - Generate with: `openssl rand -base64 32`
   - Minimum 32 characters for JWT/session secrets

5. **Enable HTTPS in production**
   - Set `FORCE_HTTPS=true`
   - Configure SSL certificates

6. **Restrict API key permissions**
   - Use least-privilege principle
   - Create separate keys for different environments

---

## Environment-Specific Configuration

### Local Development

```bash
# Minimal setup for local development
CONVEX_DEPLOYMENT=dev:your-dev-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-dev-deployment.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Staging

```bash
# Staging environment
CONVEX_DEPLOYMENT=staging:your-staging-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-staging-deployment.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
RESEND_API_KEY=re_...
NEXT_PUBLIC_BASE_URL=https://staging.yourdomain.com
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_ENVIRONMENT=staging
```

### Production

```bash
# Production environment
CONVEX_DEPLOYMENT=prod:your-prod-deployment
NEXT_PUBLIC_CONVEX_URL=https://your-prod-deployment.convex.cloud
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
RESEND_API_KEY=re_...
NEXT_PUBLIC_BASE_URL=https://npd-tracker.yourdomain.com
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_ENVIRONMENT=production
SENTRY_ENABLED=true
FORCE_HTTPS=true
```

---

## Vercel Deployment

When deploying to Vercel:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all required variables
4. Set environment-specific values:
   - **Production**: Used for production deployments
   - **Preview**: Used for preview deployments (PRs)
   - **Development**: Used for local development (optional)

### Vercel Auto-Populated Variables

Vercel automatically provides:
- `VERCEL_URL`: Deployment URL
- `VERCEL_ENV`: Environment (production, preview, development)
- `VERCEL_GIT_COMMIT_SHA`: Git commit SHA

---

## Troubleshooting

### Common Issues

**Issue**: "CONVEX_DEPLOYMENT is not defined"
- **Solution**: Ensure `.env.local` exists in `apps/web/` directory
- Check that the variable is spelled correctly

**Issue**: "Clerk authentication failed"
- **Solution**: Verify Clerk keys are correct
- Check that you're using the right environment keys (test vs live)

**Issue**: "Email sending failed"
- **Solution**: Verify Resend API key is valid
- Check that `RESEND_FROM_EMAIL` is verified in Resend dashboard

**Issue**: "PDF generation timeout"
- **Solution**: Increase `PDF_GENERATION_TIMEOUT`
- Check Puppeteer installation and Chrome/Chromium availability

---

## Generating Secrets

Use these commands to generate secure secrets:

```bash
# Generate JWT secret
openssl rand -base64 32

# Generate session secret
openssl rand -base64 32

# Generate CSRF secret
openssl rand -base64 32

# Generate health check secret
openssl rand -hex 16
```

---

## Environment Variable Validation

The application validates environment variables on startup. If required variables are missing, you'll see an error message indicating which variables need to be set.

To manually validate your environment:

```bash
cd apps/web
pnpm run validate-env
```

---

## Further Reading

- [Convex Documentation](https://docs.convex.dev/)
- [Clerk Documentation](https://clerk.com/docs)
- [Resend Documentation](https://resend.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

