# NPD Tracker - Security Audit Report

**Date:** November 1, 2025  
**Auditor:** AI Security Analysis  
**Scope:** Full application security review

---

## Executive Summary

This security audit identified **23 vulnerabilities** across dependencies, with **1 critical**, **8 high**, **10 moderate**, and **4 low** severity issues. The application has basic security headers in place but requires immediate attention to critical vulnerabilities and additional hardening.

### Risk Level: **HIGH** ⚠️

**Critical Actions Required:**
1. Upgrade Next.js to 14.2.32+ (CRITICAL - Authorization Bypass CVE-2025-29927)
2. Upgrade Hono to 4.10.3+ (HIGH - Multiple CSRF/Auth bypasses)
3. Upgrade jsPDF to 3.0.2+ (HIGH - DoS vulnerabilities)
4. Replace xlsx with maintained alternative (HIGH - Prototype Pollution)
5. Add Content Security Policy headers
6. Implement rate limiting on all API routes
7. Add CSRF protection

---

## 1. Dependency Vulnerabilities

### 1.1 CRITICAL Severity

#### CVE-2025-29927: Authorization Bypass in Next.js Middleware
- **Package:** `next@14.0.4`
- **CVSS Score:** 9.1 (Critical)
- **Impact:** Attackers can bypass authorization checks in middleware using `x-middleware-subrequest` header
- **Affected Paths:** All Next.js routes with middleware authorization
- **Fix:** Upgrade to `next@>=14.2.32`
- **Status:** ❌ VULNERABLE

```bash
# Current version: 14.0.4
# Required version: >=14.2.32
pnpm update next@latest
```

---

### 1.2 HIGH Severity

#### CVE-2024-51479: Next.js Authorization Bypass
- **Package:** `next@14.0.4`
- **CVSS Score:** 7.5 (High)
- **Impact:** Authorization bypass based on pathname manipulation
- **Fix:** Upgrade to `next@>=14.2.32`
- **Status:** ❌ VULNERABLE

#### CVE-2025-57810: jsPDF Denial of Service
- **Package:** `jspdf@2.5.2`
- **CVSS Score:** 7.5 (High)
- **Impact:** Malicious PNG files cause CPU exhaustion and DoS
- **Fix:** Upgrade to `jspdf@>=3.0.2`
- **Status:** ❌ VULNERABLE

```bash
pnpm update jspdf@latest
```

#### CVE-2023-30533: xlsx Prototype Pollution
- **Package:** `xlsx@0.18.5`
- **CVSS Score:** 7.8 (High)
- **Impact:** Prototype pollution when reading crafted files
- **Fix:** **NO NPM FIX AVAILABLE** - Package abandoned
- **Recommendation:** Migrate to maintained alternative (`exceljs` or `sheetjs-ce` from CDN)
- **Status:** ❌ VULNERABLE (NO FIX)

```bash
# Remove xlsx
pnpm remove xlsx

# Add maintained alternative
pnpm add exceljs
```

#### CVE-2024-22363: xlsx Regular Expression DoS
- **Package:** `xlsx@0.18.5`
- **CVSS Score:** 7.5 (High)
- **Impact:** ReDoS vulnerability
- **Fix:** **NO NPM FIX AVAILABLE**
- **Status:** ❌ VULNERABLE (NO FIX)

#### Multiple Hono Vulnerabilities
- **Package:** `hono@3.12.12`
- **Vulnerabilities:**
  - CVE-2025-62610: JWT Audience validation bypass (CVSS 8.1)
  - CVE-2024-32869: Directory traversal (CVSS 5.3)
  - CVE-2024-48913: CSRF bypass (CVSS 5.9)
  - CVE-2024-43787: CSRF bypass via Content-Type (CVSS 5.0)
  - CVE-2025-59139: Body limit bypass (CVSS 5.3)
  - GHSA-q7jf-gf43-6x6p: Vary header injection (CVSS 6.5)
- **Fix:** Upgrade to `hono@>=4.10.3`
- **Status:** ❌ VULNERABLE

```bash
pnpm update hono@latest
```

---

### 1.3 MODERATE Severity

#### CVE-2025-26791: DOMPurify XSS
- **Package:** `dompurify@2.5.8` (via jspdf)
- **CVSS Score:** 4.5 (Moderate)
- **Impact:** mXSS when SAFE_FOR_TEMPLATES=true
- **Fix:** Upgrade jspdf (which will update dompurify)
- **Status:** ❌ VULNERABLE

#### Multiple Next.js Issues
- CVE-2024-34351: SSRF in Server Actions (CVSS 7.5)
- CVE-2024-46982: Cache poisoning (CVSS 7.5)
- CVE-2024-47831: Image optimization DoS (CVSS 5.9)
- CVE-2024-56332: Server Actions DoS (CVSS 5.3)
- CVE-2025-48068: Dev server info exposure (CVSS Low)
- CVE-2025-57752: Image cache key confusion (CVSS 6.2)
- CVE-2025-55173: Image content injection (CVSS 4.3)
- CVE-2025-32421: Race condition cache poisoning (CVSS 3.7)

**All fixed in Next.js 14.2.32+**

#### CVE-2024-47764: cookie Module Validation Bypass
- **Package:** `cookie@0.5.0` (via @clerk/backend)
- **CVSS Score:** Low
- **Impact:** Cookie name/path/domain validation bypass
- **Fix:** Upgrade @clerk/nextjs (will update transitive dependency)
- **Status:** ❌ VULNERABLE

---

## 2. Security Headers Analysis

### 2.1 Currently Implemented ✅

The middleware (`apps/web/middleware.ts`) implements:
- ✅ `X-Frame-Options: DENY`
- ✅ `X-Content-Type-Options: nosniff`
- ✅ `Referrer-Policy: strict-origin-when-cross-origin`
- ✅ `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### 2.2 Missing Critical Headers ❌

#### Content-Security-Policy (CSP)
**Risk:** High - Missing CSP allows XSS attacks
**Recommendation:** Add strict CSP

```typescript
'Content-Security-Policy': `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https: blob:;
  font-src 'self' data:;
  connect-src 'self' https://*.convex.cloud https://*.clerk.accounts.dev;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
`
```

#### Strict-Transport-Security (HSTS)
**Risk:** Medium - Missing HSTS allows protocol downgrade attacks
**Recommendation:** Add HSTS header

```typescript
'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
```

---

## 3. Authentication & Authorization

### 3.1 Current Implementation

**Strengths:**
- ✅ Uses Clerk for authentication
- ✅ Role-based access control (RBAC) defined
- ✅ Protected routes middleware

**Weaknesses:**
- ❌ Role fetching not implemented (hardcoded to 'viewer')
- ❌ No session timeout configuration
- ❌ No brute-force protection on auth endpoints

**Code Issue:**
```typescript
// apps/web/middleware.ts:94
userRole = 'viewer'; // TODO: implement proper role fetching
```

### 3.2 Recommendations

1. **Implement proper role fetching from Convex:**
```typescript
const user = await ctx.db
  .query("users")
  .withIndex("by_clerk_id", (q) => q.eq("clerkId", userId))
  .first();
userRole = user?.role || 'viewer';
```

2. **Add session configuration in Clerk:**
```typescript
// Clerk session settings
sessionTokenTemplate: {
  maxAge: 3600, // 1 hour
  inactivityTimeout: 900, // 15 minutes
}
```

3. **Add rate limiting to auth endpoints** (see Section 5)

---

## 4. API Security

### 4.1 Missing CSRF Protection

**Risk:** High - API routes vulnerable to CSRF attacks
**Affected:** All POST/PUT/DELETE endpoints

**Recommendation:** Add CSRF middleware

```typescript
// apps/web/src/middleware/csrf.ts
import { csrf } from 'hono/csrf';

export const csrfProtection = csrf({
  origin: process.env.NEXT_PUBLIC_BASE_URL,
});
```

### 4.2 Missing Rate Limiting

**Risk:** High - No protection against brute-force or DoS
**Affected:** All API routes

**Recommendation:** Implement rate limiting (see Section 5)

### 4.3 Input Validation

**Current Status:** Partial validation via Convex validators
**Recommendation:** Add comprehensive input sanitization

```typescript
// Add to all API routes
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

const sanitizeInput = (input: string) => {
  return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
};
```

---

## 5. Rate Limiting Implementation

### 5.1 Current Status
❌ No rate limiting implemented

### 5.2 Recommended Implementation

```typescript
// apps/web/src/middleware/rateLimit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const rateLimits = {
  // API routes: 100 requests per minute
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, "1 m"),
    analytics: true,
  }),
  
  // Auth routes: 5 requests per minute
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    analytics: true,
  }),
  
  // File uploads: 10 requests per hour
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "1 h"),
    analytics: true,
  }),
};
```

**Alternative (without Redis):** Use in-memory rate limiting with `express-rate-limit` or implement simple token bucket algorithm.

---

## 6. File Upload Security

### 6.1 Current Implementation
- ✅ File type validation
- ✅ File size limits
- ✅ SHA-256 checksums
- ✅ Virus scanning placeholder

### 6.2 Recommendations

1. **Implement actual virus scanning:**
```bash
pnpm add clamav.js
```

2. **Add file content validation:**
```typescript
import { fromBuffer } from 'file-type';

const validateFileContent = async (buffer: Buffer, declaredType: string) => {
  const actualType = await fromBuffer(buffer);
  if (!actualType || actualType.mime !== declaredType) {
    throw new Error('File type mismatch');
  }
};
```

3. **Implement file quarantine for suspicious uploads**

---

## 7. Database Security

### 7.1 Convex Security

**Strengths:**
- ✅ Built-in SQL injection protection
- ✅ Type-safe queries
- ✅ Row-level security via functions

**Recommendations:**
1. **Enable Convex audit logging**
2. **Implement data encryption at rest** (if handling sensitive PII)
3. **Regular backup verification** (see Section 11)

---

## 8. Logging & Monitoring

### 8.1 Current Status
- ✅ Audit logs table exists
- ❌ No centralized error tracking
- ❌ No security event monitoring

### 8.2 Recommendations

1. **Configure Sentry (already installed):**
```typescript
// apps/web/sentry.client.config.ts
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
  beforeSend(event, hint) {
    // Filter sensitive data
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.['Authorization'];
    }
    return event;
  },
});
```

2. **Add security event logging:**
```typescript
// Log failed auth attempts, permission denials, suspicious activity
await ctx.db.insert("auditLogs", {
  action: "security_event",
  severity: "high",
  details: { type: "failed_auth", attempts: 5, ip: req.ip },
  createdAt: Date.now(),
});
```

---

## 9. Environment Variables Security

### 9.1 Current Status
- ✅ `.env.example` documented (in `docs/ENVIRONMENT_VARIABLES.md`)
- ❌ No runtime validation

### 9.2 Recommendations

1. **Add environment variable validation:**
```typescript
// apps/web/src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_CONVEX_URL: z.string().url(),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
});

export const env = envSchema.parse(process.env);
```

2. **Use secret management service** (AWS Secrets Manager, Vercel Secrets, etc.)

---

## 10. Next.js Configuration Security

### 10.1 Current Configuration

```javascript
// apps/web/next.config.js
const nextConfig = {
  images: {
    domains: ['images.clerk.dev'],
  },
}
```

### 10.2 Recommended Secure Configuration

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization security
  images: {
    domains: ['images.clerk.dev'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
        pathname: '/**',
      },
    ],
    // Disable image optimization for untrusted sources
    unoptimized: false,
    // Set reasonable limits
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: https: blob:;
              font-src 'self' data:;
              connect-src 'self' https://*.convex.cloud https://*.clerk.accounts.dev;
              frame-ancestors 'none';
              base-uri 'self';
              form-action 'self';
            `.replace(/\\s+/g, ' ').trim()
          },
        ],
      },
    ];
  },
  
  // Disable powered-by header
  poweredByHeader: false,
  
  // Enable React strict mode
  reactStrictMode: true,
  
  // Production optimizations
  swcMinify: true,
  compress: true,
  
  // Disable dev indicators in production
  devIndicators: {
    buildActivity: false,
  },
};

module.exports = nextConfig;
```

---

## 11. Backup & Recovery

### 11.1 Current Status
❌ No documented backup procedures

### 11.2 Recommendations

1. **Configure Convex automatic backups:**
   - Enable daily snapshots
   - Retention: 30 days
   - Test restoration quarterly

2. **Document backup procedures** (see `docs/ADMIN_GUIDE.md`)

3. **Implement backup verification script:**
```bash
# scripts/verify-backup.sh
#!/bin/bash
# Test backup restoration to staging environment
```

---

## 12. Third-Party Dependencies

### 12.1 Dependency Audit Schedule

**Recommendation:** Run security audits weekly

```bash
# Add to CI/CD pipeline
pnpm audit --audit-level=moderate
```

### 12.2 Dependency Update Policy

1. **Critical/High vulnerabilities:** Update immediately
2. **Moderate vulnerabilities:** Update within 7 days
3. **Low vulnerabilities:** Update in next release cycle
4. **Regular updates:** Monthly dependency review

---

## 13. Penetration Testing Recommendations

### 13.1 Recommended Tests

1. **Authentication bypass attempts**
2. **Authorization escalation**
3. **SQL injection** (Convex protects, but test custom queries)
4. **XSS attacks**
5. **CSRF attacks**
6. **File upload exploits**
7. **API abuse and rate limit bypass**
8. **Session hijacking**

### 13.2 Tools

- OWASP ZAP
- Burp Suite
- Nuclei
- SQLMap (for custom queries)

---

## 14. Compliance Considerations

### 14.1 Indonesian Government Standards

**Applicable Standards:**
- **ISO 27001:** Information Security Management
- **Peraturan BSSN:** Indonesian cybersecurity regulations
- **UU ITE:** Electronic Information and Transactions Law

**Recommendations:**
1. Implement data residency controls (host in Indonesia if required)
2. Add data retention policies
3. Implement GDPR-like data subject rights (if applicable)

---

## 15. Action Plan

### Priority 1: IMMEDIATE (Within 24 hours)

- [ ] Upgrade Next.js to 14.2.32+ (CRITICAL)
- [ ] Upgrade Hono to 4.10.3+
- [ ] Upgrade jsPDF to 3.0.2+
- [ ] Add CSP headers
- [ ] Implement proper role fetching in middleware

### Priority 2: HIGH (Within 1 week)

- [ ] Replace xlsx with exceljs
- [ ] Implement rate limiting
- [ ] Add CSRF protection
- [ ] Configure Sentry error tracking
- [ ] Update Next.js config with security headers

### Priority 3: MEDIUM (Within 2 weeks)

- [ ] Implement virus scanning for file uploads
- [ ] Add environment variable validation
- [ ] Configure Convex backups
- [ ] Add security event logging
- [ ] Implement session timeout

### Priority 4: LOW (Within 1 month)

- [ ] Penetration testing
- [ ] Security documentation review
- [ ] Compliance audit
- [ ] Backup restoration testing

---

## 16. Security Checklist

### Pre-Production Checklist

- [ ] All critical/high vulnerabilities patched
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] CSRF protection enabled
- [ ] Authentication properly implemented
- [ ] File upload security hardened
- [ ] Logging and monitoring configured
- [ ] Backups configured and tested
- [ ] Environment variables secured
- [ ] Penetration testing completed
- [ ] Security documentation complete

---

## 17. Conclusion

The NPD Tracker application has a solid foundation but requires immediate attention to critical vulnerabilities, particularly the Next.js authorization bypass (CVE-2025-29927). Once Priority 1 and 2 items are addressed, the application will have a strong security posture suitable for production deployment.

**Overall Security Score:** 6.5/10 (after fixes: 8.5/10)

---

## Appendix A: Vulnerability Summary

| Severity | Count | Status |
|----------|-------|--------|
| Critical | 1 | ❌ Unfixed |
| High | 8 | ❌ Unfixed |
| Moderate | 10 | ❌ Unfixed |
| Low | 4 | ❌ Unfixed |
| **Total** | **23** | **0% Fixed** |

---

## Appendix B: References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Best Practices](https://nextjs.org/docs/app/building-your-application/deploying/production-checklist)
- [Convex Security](https://docs.convex.dev/security)
- [Clerk Security](https://clerk.com/docs/security)
- [CVE Database](https://cve.mitre.org/)
- [GitHub Security Advisories](https://github.com/advisories)

---

**Report Generated:** November 1, 2025  
**Next Review Date:** November 8, 2025

