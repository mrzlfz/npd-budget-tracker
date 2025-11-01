# Staging Deployment Guide - NPD Tracker

**Date:** November 1, 2025  
**Environment:** Vercel Staging  
**Status:** Ready for Deployment

---

## Pre-Deployment Checklist

Before deploying to staging, ensure all prerequisites are met:

### ✅ Code Readiness
- [x] All features implemented and tested
- [x] All unit tests passing (80%+ coverage)
- [x] All integration tests passing
- [x] All E2E tests passing
- [x] Performance optimized (Lighthouse >90)
- [x] Security audit completed
- [x] Documentation complete

### ✅ Environment Setup
- [ ] Vercel account created
- [ ] Convex staging deployment configured
- [ ] Clerk staging application created
- [ ] Resend API key available
- [ ] Sentry staging project configured

---

## Step 1: Convex Staging Deployment

### 1.1 Create Staging Deployment

```bash
# Navigate to project root
cd /mnt/c/Users/Rizal/Documents/trae_projects/npd-tracker

# Deploy Convex to staging
npx convex deploy --cmd 'npm run dev' --cmd-url-env-var-name CONVEX_URL_STAGING
```

### 1.2 Configure Convex Environment

```bash
# Set staging environment variables in Convex dashboard
# Navigate to: https://dashboard.convex.dev/[your-project]/settings

# Add environment variables:
CLERK_WEBHOOK_SECRET=<your-staging-clerk-webhook-secret>
RESEND_API_KEY=<your-resend-api-key>
```

### 1.3 Verify Convex Deployment

```bash
# Test Convex connection
npx convex run --prod npd:list

# Should return empty array or existing NPDs
```

**Expected Output:**
```json
{
  "page": [],
  "continueCursor": null,
  "isDone": true
}
```

---

## Step 2: Clerk Staging Configuration

### 2.1 Create Staging Application

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Click "Create Application"
3. Name: "NPD Tracker - Staging"
4. Select authentication methods:
   - Email & Password ✓
   - Google OAuth ✓
   - Email verification required ✓

### 2.2 Configure Allowed Origins

In Clerk Dashboard → Settings → Allowed Origins, add:
```
https://npd-tracker-staging.vercel.app
https://*.vercel.app
http://localhost:3000 (for testing)
```

### 2.3 Get API Keys

Copy the following from Clerk Dashboard:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `CLERK_WEBHOOK_SECRET`

---

## Step 3: Vercel Staging Setup

### 3.1 Install Vercel CLI

```bash
npm install -g vercel
```

### 3.2 Login to Vercel

```bash
vercel login
```

### 3.3 Link Project

```bash
# From project root
cd /mnt/c/Users/Rizal/Documents/trae_projects/npd-tracker/apps/web

# Link to Vercel
vercel link
```

**Follow prompts:**
- Set up and deploy?: No (we'll configure first)
- Which scope?: [Your Vercel account]
- Link to existing project?: No
- Project name: `npd-tracker`
- Directory: `./` (current)

### 3.4 Configure Environment Variables

```bash
# Set environment variables for staging
vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
# Paste staging Clerk publishable key

vercel env add CLERK_SECRET_KEY
# Paste staging Clerk secret key

vercel env add CLERK_WEBHOOK_SECRET
# Paste staging webhook secret

vercel env add NEXT_PUBLIC_CONVEX_URL
# Paste Convex staging deployment URL

vercel env add CONVEX_DEPLOYMENT
# Paste Convex deployment name

vercel env add RESEND_API_KEY
# Paste Resend API key

vercel env add NEXT_PUBLIC_SENTRY_DSN
# Paste Sentry staging DSN

vercel env add SENTRY_DSN
# Paste Sentry staging DSN

vercel env add SENTRY_ENVIRONMENT
# Enter: staging

vercel env add NEXT_PUBLIC_SENTRY_ENVIRONMENT
# Enter: staging

vercel env add NODE_ENV
# Enter: production

vercel env add NEXT_PUBLIC_APP_URL
# Enter: https://npd-tracker-staging.vercel.app
```

### 3.5 Verify Environment Variables

```bash
# List all environment variables
vercel env ls
```

**Expected Output:**
```
Environment Variables for npd-tracker (Staging):
- NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
- CLERK_SECRET_KEY
- CLERK_WEBHOOK_SECRET
- NEXT_PUBLIC_CONVEX_URL
- CONVEX_DEPLOYMENT
- RESEND_API_KEY
- NEXT_PUBLIC_SENTRY_DSN
- SENTRY_DSN
- SENTRY_ENVIRONMENT (staging)
- NEXT_PUBLIC_SENTRY_ENVIRONMENT (staging)
- NODE_ENV (production)
- NEXT_PUBLIC_APP_URL
```

---

## Step 4: Deploy to Staging

### 4.1 Build Test (Local)

```bash
# Test build locally first
cd /mnt/c/Users/Rizal/Documents/trae_projects/npd-tracker/apps/web
pnpm build
```

**Expected Output:**
```
✓ Compiled successfully
✓ Linting and checking validity of types
✓ Collecting page data
✓ Generating static pages (X/X)
✓ Collecting build traces
✓ Finalizing page optimization
```

### 4.2 Deploy to Preview (Staging)

```bash
# Deploy to staging (preview environment)
vercel --prod=false

# Or for production-like staging:
vercel
```

**Expected Output:**
```
Vercel CLI XX.X.X
🔍  Inspect: https://vercel.com/[account]/npd-tracker/[deployment-id]
✅  Preview: https://npd-tracker-[hash].vercel.app
```

### 4.3 Set Custom Domain (Optional)

```bash
# Add custom staging domain
vercel domains add staging.npd-tracker.com
```

---

## Step 5: Smoke Tests

### 5.1 Automated Smoke Tests

Create smoke test script:

```bash
# Create smoke test file
cat > smoke-tests.sh << 'EOF'
#!/bin/bash

STAGING_URL="https://npd-tracker-staging.vercel.app"

echo "🧪 Running Smoke Tests on Staging..."
echo "Target: $STAGING_URL"
echo ""

# Test 1: Homepage loads
echo "✓ Test 1: Homepage accessibility"
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $STAGING_URL)
if [ $HTTP_CODE -eq 200 ]; then
  echo "  ✅ PASS - Homepage returns 200"
else
  echo "  ❌ FAIL - Homepage returns $HTTP_CODE"
  exit 1
fi

# Test 2: API health check
echo "✓ Test 2: API health check"
HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" $STAGING_URL/api/health)
if [ $HEALTH_CODE -eq 200 ]; then
  echo "  ✅ PASS - API health check returns 200"
else
  echo "  ❌ FAIL - API health check returns $HEALTH_CODE"
  exit 1
fi

# Test 3: Static assets load
echo "✓ Test 3: Static assets"
FAVICON_CODE=$(curl -s -o /dev/null -w "%{http_code}" $STAGING_URL/favicon.ico)
if [ $FAVICON_CODE -eq 200 ]; then
  echo "  ✅ PASS - Favicon loads"
else
  echo "  ❌ FAIL - Favicon returns $FAVICON_CODE"
fi

# Test 4: Check for JavaScript errors in console
echo "✓ Test 4: JavaScript console check"
echo "  ℹ️  Manual verification required"

echo ""
echo "🎉 Smoke tests completed!"
EOF

# Make executable
chmod +x smoke-tests.sh

# Run smoke tests
./smoke-tests.sh
```

### 5.2 Manual Smoke Tests

#### Test Case 1: Authentication Flow
- [ ] Navigate to staging URL
- [ ] Click "Sign In"
- [ ] Sign in with test account
- [ ] Verify redirect to dashboard
- [ ] Verify user name appears in header
- [ ] Click profile menu → verify dropdown works
- [ ] Log out → verify redirect to home

#### Test Case 2: Dashboard Load
- [ ] Log in as test user
- [ ] Verify dashboard loads within 3 seconds
- [ ] Verify all KPI cards show data or zero
- [ ] Verify charts render without errors
- [ ] Verify no console errors in browser DevTools

#### Test Case 3: NPD Creation
- [ ] Navigate to NPD Builder
- [ ] Select RKA subkegiatan from dropdown
- [ ] Add one account line with amount
- [ ] Save as draft
- [ ] Verify NPD appears in list
- [ ] Verify status shows "Draft"

#### Test Case 4: File Upload
- [ ] Create new NPD
- [ ] Click "Upload Attachment"
- [ ] Upload a test PDF file (<5MB)
- [ ] Verify upload progress shows
- [ ] Verify file appears in attachment list
- [ ] Download file → verify it matches uploaded

#### Test Case 5: SP2D Creation (if test data exists)
- [ ] Log in as Bendahara
- [ ] Navigate to SP2D page
- [ ] Verify list loads
- [ ] Click "Create SP2D" (if finalized NPD exists)
- [ ] Verify form opens

#### Test Case 6: Reports & Export
- [ ] Navigate to Reports page
- [ ] Apply date range filter
- [ ] Click "Export CSV"
- [ ] Verify CSV downloads
- [ ] Open CSV → verify data format

#### Test Case 7: Performance Check
- [ ] Open browser DevTools → Network tab
- [ ] Navigate to dashboard
- [ ] Verify page load time <3 seconds
- [ ] Verify no failed requests (404, 500)
- [ ] Check Lighthouse score >90

---

## Step 6: Verification Checklist

### 6.1 Functional Verification

- [ ] **Authentication**: Users can sign in/out
- [ ] **Authorization**: Roles are enforced correctly
- [ ] **NPD Workflow**: Create → Submit → Verify → Finalize works
- [ ] **SP2D Creation**: Distribution calculated correctly
- [ ] **File Upload**: Files upload and download correctly
- [ ] **Email Notifications**: Test email sent (check Resend dashboard)
- [ ] **PDF Generation**: NPD PDF generates without errors
- [ ] **CSV Export**: Reports export to CSV successfully
- [ ] **Real-time Updates**: Dashboard updates when data changes

### 6.2 Performance Verification

- [ ] **Page Load**: <3 seconds for dashboard
- [ ] **API Response**: <500ms for typical queries
- [ ] **Large Lists**: Tables with 100+ rows perform well
- [ ] **File Upload**: 5MB file uploads within 10 seconds
- [ ] **PDF Generation**: NPD PDF generates within 5 seconds

### 6.3 Error Monitoring

- [ ] **Sentry**: Check Sentry dashboard for errors
- [ ] **Vercel Logs**: Check deployment logs for warnings
- [ ] **Browser Console**: No JavaScript errors on key pages
- [ ] **Network**: No failed API requests

---

## Step 7: Post-Deployment Configuration

### 7.1 Configure Clerk Webhooks

1. Go to Clerk Dashboard → Webhooks
2. Add webhook endpoint: `https://npd-tracker-staging.vercel.app/api/webhooks/clerk`
3. Select events:
   - `user.created`
   - `user.updated`
   - `user.deleted`
   - `organization.created`
   - `organization.updated`
4. Copy webhook secret and update in Vercel env vars

### 7.2 Test Webhook

```bash
# Send test webhook from Clerk dashboard
# Verify in Vercel logs that webhook was received
vercel logs --follow
```

### 7.3 Configure Sentry Alerts

1. Go to Sentry → Alerts
2. Create alert rule:
   - Name: "Critical Errors - Staging"
   - Condition: Error count > 10 in 5 minutes
   - Action: Email notifications
3. Test alert by triggering error in staging

---

## Step 8: Load Testing (Optional)

### 8.1 Install Artillery

```bash
npm install -g artillery
```

### 8.2 Create Load Test

```yaml
# load-test.yml
config:
  target: "https://npd-tracker-staging.vercel.app"
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 10
      name: "Ramp up load"
    - duration: 60
      arrivalRate: 20
      name: "Peak load"

scenarios:
  - name: "Dashboard access"
    flow:
      - get:
          url: "/"
      - get:
          url: "/dashboard"
      - think: 5
      - get:
          url: "/reports"
```

### 8.3 Run Load Test

```bash
artillery run load-test.yml
```

**Expected Results:**
- Response time p95: <1000ms
- Response time p99: <2000ms
- Error rate: <1%
- Success rate: >99%

---

## Step 9: Security Verification

### 9.1 Security Headers Check

```bash
# Check security headers
curl -I https://npd-tracker-staging.vercel.app

# Should include:
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=31536000
# Content-Security-Policy: [policy]
```

### 9.2 SSL Certificate Check

```bash
# Verify SSL certificate
echo | openssl s_client -connect npd-tracker-staging.vercel.app:443 2>/dev/null | openssl x509 -noout -dates
```

**Expected:**
- Valid certificate from Let's Encrypt or similar
- Not expired
- Matches domain name

### 9.3 Dependency Audit

```bash
# Check for vulnerabilities
cd /mnt/c/Users/Rizal/Documents/trae_projects/npd-tracker
pnpm audit

# Should show: 0 vulnerabilities
```

---

## Step 10: Rollback Procedure

If issues are discovered, rollback immediately:

### 10.1 Rollback Vercel Deployment

```bash
# List recent deployments
vercel ls

# Rollback to previous deployment
vercel rollback [deployment-url]

# Or promote specific deployment to production
vercel promote [deployment-url]
```

### 10.2 Rollback Convex (if needed)

```bash
# List Convex snapshots
npx convex snapshot list

# Restore from snapshot
npx convex snapshot restore [snapshot-id]
```

### 10.3 Communicate Issues

If rollback is needed:
1. Post status update to team Slack/Discord
2. Document the issue in GitHub Issues
3. Create incident report
4. Plan fix and re-deployment

---

## Troubleshooting

### Issue 1: Build Fails

**Symptom:** Vercel build fails with TypeScript errors

**Solution:**
```bash
# Check types locally
pnpm type-check

# Fix type errors
# Re-deploy
vercel
```

### Issue 2: Environment Variables Not Loading

**Symptom:** "Missing environment variable" errors

**Solution:**
```bash
# Verify env vars are set
vercel env ls

# Pull env vars locally to test
vercel env pull .env.local

# Check values
cat .env.local
```

### Issue 3: Convex Connection Fails

**Symptom:** "Failed to connect to Convex" errors

**Solution:**
1. Verify `NEXT_PUBLIC_CONVEX_URL` is correct
2. Check Convex deployment is running
3. Verify network connectivity
4. Check Convex dashboard for errors

### Issue 4: Authentication Fails

**Symptom:** Users cannot sign in

**Solution:**
1. Verify Clerk keys are correct
2. Check allowed origins in Clerk dashboard
3. Verify webhook endpoint is accessible
4. Check Clerk dashboard logs

### Issue 5: Performance Issues

**Symptom:** Slow page loads, timeouts

**Solution:**
1. Check Vercel analytics for bottlenecks
2. Review Sentry performance traces
3. Optimize database queries
4. Enable caching where appropriate

---

## Success Criteria

Staging deployment is successful when:

✅ **Deployment**
- [ ] Vercel deployment completes without errors
- [ ] All environment variables configured
- [ ] Custom domain configured (if applicable)

✅ **Functionality**
- [ ] All smoke tests pass
- [ ] Authentication works end-to-end
- [ ] Core workflows functional (NPD, SP2D)
- [ ] File uploads work correctly
- [ ] Reports generate successfully

✅ **Performance**
- [ ] Lighthouse score >90
- [ ] Page load time <3s
- [ ] API response time <500ms
- [ ] No critical performance issues

✅ **Monitoring**
- [ ] Sentry receiving events
- [ ] No critical errors in logs
- [ ] Error rate <0.1%
- [ ] Uptime >99%

✅ **Security**
- [ ] SSL certificate valid
- [ ] Security headers present
- [ ] No vulnerabilities in audit
- [ ] Webhooks secured

---

## Next Steps

After successful staging deployment:

1. **UAT (User Acceptance Testing)**
   - Invite stakeholders to test staging
   - Collect feedback
   - Fix any issues

2. **Documentation Update**
   - Update deployment docs with lessons learned
   - Document any workarounds or issues
   - Update runbooks

3. **Production Deployment**
   - Follow production deployment guide
   - Use same process as staging
   - Monitor closely for 48 hours

---

## Staging Environment Details

**URL:** https://npd-tracker-staging.vercel.app  
**Convex:** [Staging deployment URL]  
**Clerk:** NPD Tracker - Staging  
**Sentry:** npd-tracker-staging  
**Environment:** staging  

**Last Updated:** November 1, 2025  
**Maintained By:** Development Team  
**Support Contact:** [Your contact info]

---

**End of Staging Deployment Guide**

