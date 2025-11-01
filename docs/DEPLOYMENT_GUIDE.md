# NPD Tracker - Deployment Guide

**Version:** 1.0  
**Last Updated:** November 2025  
**Target Platforms:** Vercel (Recommended), AWS, Docker

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Local Development Setup](#local-development-setup)
4. [Database Migration](#database-migration)
5. [Vercel Deployment (Recommended)](#vercel-deployment-recommended)
6. [AWS Deployment](#aws-deployment)
7. [Docker Deployment](#docker-deployment)
8. [Post-Deployment Checklist](#post-deployment-checklist)
9. [Monitoring & Logging](#monitoring--logging)
10. [Backup & Recovery](#backup--recovery)
11. [Scaling Considerations](#scaling-considerations)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

- **Node.js**: v18.17.0 or higher
- **pnpm**: v8.0.0 or higher
- **Git**: Latest version
- **Convex CLI**: Install globally with `npm install -g convex`

### Required Accounts

1. **Convex Account**
   - Sign up at https://convex.dev
   - Create a new project
   - Note your deployment URL

2. **Clerk Account**
   - Sign up at https://clerk.com
   - Create a new application
   - Note your publishable and secret keys

3. **Resend Account** (for email notifications)
   - Sign up at https://resend.com
   - Create API key
   - Verify your sending domain

4. **Sentry Account** (optional, for error tracking)
   - Sign up at https://sentry.io
   - Create a new project
   - Note your DSN

5. **Vercel Account** (for recommended deployment)
   - Sign up at https://vercel.com
   - Connect your GitHub repository

### System Requirements

**Development Machine:**
- RAM: 8GB minimum, 16GB recommended
- Storage: 10GB free space
- OS: macOS, Linux, or Windows with WSL2

**Production Server (if self-hosting):**
- RAM: 4GB minimum, 8GB recommended
- CPU: 2 cores minimum, 4 cores recommended
- Storage: 20GB minimum
- OS: Ubuntu 22.04 LTS or similar

---

## Environment Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/npd-tracker.git
cd npd-tracker
```

### 2. Install Dependencies

```bash
# Install pnpm globally if not already installed
npm install -g pnpm

# Install project dependencies
pnpm install
```

### 3. Configure Environment Variables

Create `.env.local` files in the appropriate directories:

#### Root `.env.local`

```bash
# Convex
CONVEX_DEPLOYMENT=dev:your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Resend Email
RESEND_API_KEY=re_...

# Sentry (Optional)
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

#### `apps/web/.env.local`

```bash
# Same as root .env.local
# Vercel automatically loads from root, but keep for local dev
```

### 4. Verify Configuration

```bash
# Check environment variables are loaded
pnpm run env:check

# Expected output: All required variables present ✓
```

---

## Local Development Setup

### 1. Start Convex Development Server

```bash
# In a separate terminal
cd packages/convex
npx convex dev
```

This will:
- Start the Convex development server
- Watch for schema changes
- Provide a local dashboard at http://localhost:3210

### 2. Start Next.js Development Server

```bash
# In another terminal
cd apps/web
pnpm dev
```

The application will be available at http://localhost:3000

### 3. Verify Setup

1. Navigate to http://localhost:3000
2. Sign in with Clerk (create test account)
3. Create a test organization
4. Verify dashboard loads without errors

### 4. Run Tests

```bash
# Unit tests
pnpm test

# Integration tests
pnpm test:integration

# E2E tests
pnpm test:e2e

# All tests
pnpm test:all
```

---

## Database Migration

### Initial Schema Deployment

```bash
# Deploy schema to Convex
cd packages/convex
npx convex deploy --prod

# Verify schema is deployed
npx convex dashboard
```

### Running Migrations

If you have existing data that needs migration:

```bash
# Run migration scripts
npx convex run migrations:migrateNpdFilesToAttachments

# Verify migration completed
npx convex run migrations:verifyMigration
```

### Migration Scripts

Create migration scripts in `packages/convex/functions/migrations.ts`:

```typescript
import { mutation } from "./_generated/server";

export const migrateNpdFilesToAttachments = mutation({
  handler: async (ctx) => {
    // Migration logic here
    const npdFiles = await ctx.db.query("npdFiles").collect();
    
    for (const file of npdFiles) {
      await ctx.db.insert("attachments", {
        npdId: file.npdId,
        jenis: file.jenis || "Other",
        namaFile: file.namaFile,
        url: file.url,
        ukuran: file.ukuran,
        tipeMime: file.tipeMime,
        organizationId: file.organizationId,
        uploadedBy: file.uploadedBy,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
      });
    }
    
    return { migrated: npdFiles.length };
  },
});
```

---

## Vercel Deployment (Recommended)

Vercel provides the best experience for Next.js applications with automatic CI/CD, edge functions, and global CDN.

### Step 1: Prepare for Deployment

```bash
# Ensure all tests pass
pnpm test:all

# Build the application locally to verify
pnpm build

# Check for type errors
pnpm type-check

# Run linter
pnpm lint
```

### Step 2: Deploy Convex to Production

```bash
cd packages/convex

# Deploy to production
npx convex deploy --prod

# Note the production URL (e.g., https://your-app.convex.cloud)
```

### Step 3: Configure Clerk for Production

1. Go to https://dashboard.clerk.com
2. Create a new production application (or use existing)
3. Configure domains:
   - Add your Vercel domain (e.g., `npd-tracker.vercel.app`)
   - Add custom domain if you have one
4. Copy production API keys:
   - Publishable Key: `pk_live_...`
   - Secret Key: `sk_live_...`

### Step 4: Deploy to Vercel

#### Option A: Via Vercel Dashboard (Recommended for first deployment)

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd ../.. && pnpm build --filter=web`
   - **Output Directory**: `.next`
   - **Install Command**: `pnpm install`

4. Add Environment Variables:

```bash
# Convex
CONVEX_DEPLOYMENT=prod:your-deployment-name
NEXT_PUBLIC_CONVEX_URL=https://your-app.convex.cloud

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Resend
RESEND_API_KEY=re_...

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_AUTH_TOKEN=...

# Application
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

5. Click **Deploy**

#### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
cd apps/web
vercel --prod

# Follow prompts to configure project
```

### Step 5: Configure Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain (e.g., `npd-tracker.yourdomain.com`)
3. Configure DNS records as instructed by Vercel
4. Wait for SSL certificate to be issued (automatic)
5. Update Clerk allowed domains to include custom domain

### Step 6: Verify Deployment

```bash
# Run smoke tests against production
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app pnpm test:smoke

# Manual verification checklist:
# ✓ Homepage loads
# ✓ Sign in works
# ✓ Dashboard displays data
# ✓ NPD creation works
# ✓ File upload works
# ✓ PDF generation works
# ✓ Email notifications sent
```

---

## AWS Deployment

For organizations requiring self-hosted infrastructure or specific compliance requirements.

### Architecture Overview

```
┌─────────────────┐
│   CloudFront    │ (CDN)
└────────┬────────┘
         │
┌────────▼────────┐
│   S3 Bucket     │ (Static Assets)
└─────────────────┘
         │
┌────────▼────────┐
│   ECS Fargate   │ (Next.js App)
└────────┬────────┘
         │
┌────────▼────────┐
│   Convex Cloud  │ (Database)
└─────────────────┘
```

### Step 1: Prepare Docker Image

Create `Dockerfile` in project root:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/convex/package.json ./packages/convex/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build application
RUN pnpm build --filter=web

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Copy built application
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/node_modules ./node_modules

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "apps/web/.next/standalone/server.js"]
```

### Step 2: Build and Push Docker Image

```bash
# Build image
docker build -t npd-tracker:latest .

# Tag for ECR
docker tag npd-tracker:latest <aws-account-id>.dkr.ecr.<region>.amazonaws.com/npd-tracker:latest

# Login to ECR
aws ecr get-login-password --region <region> | docker login --username AWS --password-stdin <aws-account-id>.dkr.ecr.<region>.amazonaws.com

# Push to ECR
docker push <aws-account-id>.dkr.ecr.<region>.amazonaws.com/npd-tracker:latest
```

### Step 3: Create ECS Task Definition

Create `ecs-task-definition.json`:

```json
{
  "family": "npd-tracker",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "npd-tracker",
      "image": "<aws-account-id>.dkr.ecr.<region>.amazonaws.com/npd-tracker:latest",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "NEXT_PUBLIC_CONVEX_URL",
          "value": "https://your-app.convex.cloud"
        }
      ],
      "secrets": [
        {
          "name": "CLERK_SECRET_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account-id:secret:clerk-secret"
        },
        {
          "name": "RESEND_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:region:account-id:secret:resend-api-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/npd-tracker",
          "awslogs-region": "<region>",
          "awslogs-stream-prefix": "ecs"
        }
      }
    }
  ]
}
```

### Step 4: Create ECS Service

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name npd-tracker-cluster

# Register task definition
aws ecs register-task-definition --cli-input-json file://ecs-task-definition.json

# Create service
aws ecs create-service \
  --cluster npd-tracker-cluster \
  --service-name npd-tracker-service \
  --task-definition npd-tracker \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=npd-tracker,containerPort=3000"
```

### Step 5: Configure Application Load Balancer

1. Create ALB in AWS Console
2. Configure target group (port 3000)
3. Configure health check endpoint: `/api/health`
4. Configure HTTPS listener with SSL certificate
5. Configure routing rules

### Step 6: Configure CloudFront

1. Create CloudFront distribution
2. Set origin to ALB DNS name
3. Configure cache behaviors:
   - `/_next/static/*` - Cache for 1 year
   - `/api/*` - No cache
   - Default - Cache for 1 hour
4. Configure SSL certificate
5. Configure custom domain

---

## Docker Deployment

For local or on-premise deployments.

### Docker Compose Setup

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  npd-tracker:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_CONVEX_URL=${NEXT_PUBLIC_CONVEX_URL}
      - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      - CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
      - RESEND_API_KEY=${RESEND_API_KEY}
      - NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - npd-tracker
    restart: unless-stopped
```

### Nginx Configuration

Create `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream npd-tracker {
        server npd-tracker:3000;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://npd-tracker;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### Deploy with Docker Compose

```bash
# Create .env file with production variables
cp .env.example .env
# Edit .env with production values

# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

## Post-Deployment Checklist

### Immediate Verification (First 30 minutes)

- [ ] **Application Accessibility**
  - [ ] Homepage loads without errors
  - [ ] HTTPS certificate is valid
  - [ ] No console errors in browser

- [ ] **Authentication**
  - [ ] Sign in page loads
  - [ ] Can create new account
  - [ ] Can sign in with existing account
  - [ ] Can sign out
  - [ ] Session persists across page refreshes

- [ ] **Core Functionality**
  - [ ] Dashboard displays data
  - [ ] Can create organization
  - [ ] Can switch organizations
  - [ ] Can create NPD
  - [ ] Can upload files
  - [ ] Can generate PDF
  - [ ] Can create SP2D

- [ ] **Email Notifications**
  - [ ] Test email sent successfully
  - [ ] Email templates render correctly
  - [ ] Links in emails work

- [ ] **Performance**
  - [ ] Page load time < 2 seconds
  - [ ] Time to interactive < 3 seconds
  - [ ] No memory leaks (check over 1 hour)

### First 24 Hours

- [ ] **Monitoring**
  - [ ] Sentry receiving error reports
  - [ ] No critical errors in logs
  - [ ] Error rate < 0.1%
  - [ ] Response time p95 < 500ms

- [ ] **User Testing**
  - [ ] Create test NPD end-to-end
  - [ ] Verify NPD workflow (submit, verify, finalize)
  - [ ] Create test SP2D
  - [ ] Verify realizations calculated correctly
  - [ ] Test file upload/download
  - [ ] Test PDF generation
  - [ ] Test CSV/Excel export

- [ ] **Security**
  - [ ] SSL certificate valid
  - [ ] Security headers present
  - [ ] Rate limiting active
  - [ ] CORS configured correctly
  - [ ] No exposed secrets in logs

### First Week

- [ ] **Backup Verification**
  - [ ] Convex automatic backups running
  - [ ] Test backup restoration
  - [ ] Verify backup retention policy

- [ ] **Performance Optimization**
  - [ ] Run Lighthouse audit (target >90)
  - [ ] Optimize slow queries
  - [ ] Enable caching where appropriate
  - [ ] Optimize images

- [ ] **User Feedback**
  - [ ] Collect user feedback
  - [ ] Address critical issues
  - [ ] Plan iteration 2

---

## Monitoring & Logging

### Sentry Setup

```bash
# Install Sentry
pnpm add @sentry/nextjs

# Initialize Sentry
npx @sentry/wizard@latest -i nextjs
```

Configure `sentry.client.config.ts`:

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request) {
      delete event.request.cookies;
    }
    return event;
  },
});
```

### Health Check Endpoint

Create `apps/web/src/app/api/health/route.ts`:

```typescript
import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check Convex connection
    const convexHealthy = await checkConvexHealth();
    
    // Check Clerk connection
    const clerkHealthy = await checkClerkHealth();
    
    if (convexHealthy && clerkHealthy) {
      return NextResponse.json({
        status: "healthy",
        timestamp: Date.now(),
        services: {
          convex: "up",
          clerk: "up",
        },
      });
    }
    
    return NextResponse.json(
      {
        status: "degraded",
        services: {
          convex: convexHealthy ? "up" : "down",
          clerk: clerkHealthy ? "up" : "down",
        },
      },
      { status: 503 }
    );
  } catch (error) {
    return NextResponse.json(
      { status: "unhealthy", error: error.message },
      { status: 503 }
    );
  }
}
```

### Uptime Monitoring

Configure UptimeRobot or similar:

1. Add monitor for `https://your-app.com/api/health`
2. Set check interval to 5 minutes
3. Configure alerts (email/Slack)
4. Monitor response time

### Log Aggregation

For production deployments, consider:

- **Vercel**: Built-in logs in dashboard
- **AWS**: CloudWatch Logs
- **Docker**: ELK Stack (Elasticsearch, Logstash, Kibana)

---

## Backup & Recovery

### Convex Automatic Backups

Convex automatically backs up your data. To restore:

```bash
# List available backups
npx convex backups list

# Restore from backup
npx convex backups restore <backup-id>
```

### Manual Backup

Create backup script `scripts/backup.ts`:

```typescript
import { api } from "../packages/convex/_generated/api";

export async function backupData() {
  // Export all tables
  const tables = [
    "npdDocuments",
    "npdLines",
    "sp2dRefs",
    "realizations",
    "rkaAccounts",
    // ... other tables
  ];
  
  for (const table of tables) {
    const data = await convex.query(api.backup.exportTable, { table });
    await fs.writeFile(`backups/${table}-${Date.now()}.json`, JSON.stringify(data));
  }
}
```

### Disaster Recovery Plan

1. **Identify Issue**
   - Check Sentry for errors
   - Check logs for anomalies
   - Check health endpoint

2. **Assess Impact**
   - How many users affected?
   - What functionality is broken?
   - Is data corrupted?

3. **Rollback (if needed)**
   ```bash
   # Vercel: Revert to previous deployment
   vercel rollback
   
   # Convex: Restore from backup
   npx convex backups restore <backup-id>
   ```

4. **Communicate**
   - Notify users of issue
   - Provide status updates
   - Announce resolution

5. **Post-Mortem**
   - Document what happened
   - Identify root cause
   - Implement preventive measures

---

## Scaling Considerations

### Horizontal Scaling

**Vercel**: Automatic scaling based on traffic
- No configuration needed
- Scales to zero when idle
- Pay per request

**AWS ECS**: Manual or auto-scaling
```bash
# Update desired count
aws ecs update-service \
  --cluster npd-tracker-cluster \
  --service npd-tracker-service \
  --desired-count 4
```

### Database Optimization

**Convex** automatically scales, but optimize queries:

1. **Add Indexes**
   ```typescript
   // In schema.ts
   npdDocuments: defineTable({
     // ... fields
   })
     .index("by_status", ["status"])
     .index("by_organization", ["organizationId"])
     .index("by_created_at", ["createdAt"])
   ```

2. **Paginate Large Queries**
   ```typescript
   export const listPaginated = query({
     args: { page: v.number(), pageSize: v.number() },
     handler: async (ctx, args) => {
       const skip = (args.page - 1) * args.pageSize;
       const npds = await ctx.db
         .query("npdDocuments")
         .order("desc")
         .take(args.pageSize + skip);
       return npds.slice(skip);
     },
   });
   ```

3. **Cache Expensive Queries**
   ```typescript
   // Use React Query for client-side caching
   const { data } = useQuery({
     queryKey: ["dashboard-stats"],
     queryFn: () => fetchDashboardStats(),
     staleTime: 5 * 60 * 1000, // 5 minutes
   });
   ```

### CDN Configuration

**Vercel**: Automatic edge caching
- Static assets cached at edge
- API routes can be cached with headers

**CloudFront**: Configure cache behaviors
```json
{
  "PathPattern": "/_next/static/*",
  "TargetOriginId": "npd-tracker",
  "ViewerProtocolPolicy": "redirect-to-https",
  "DefaultTTL": 31536000,
  "MaxTTL": 31536000
}
```

### Performance Budgets

Set performance budgets in `next.config.js`:

```javascript
module.exports = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['recharts', 'lucide-react'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
          },
          recharts: {
            name: 'recharts',
            test: /[\\/]node_modules[\\/](recharts)[\\/]/,
            priority: 10,
          },
        },
      };
    }
    return config;
  },
};
```

---

## Troubleshooting

### Common Issues

#### 1. Build Failures

**Error**: `Module not found: Can't resolve 'recharts'`

**Solution**:
```bash
# Clear cache and reinstall
rm -rf node_modules .next
pnpm install
pnpm build
```

#### 2. Convex Connection Issues

**Error**: `Failed to connect to Convex`

**Solution**:
```bash
# Verify Convex URL is correct
echo $NEXT_PUBLIC_CONVEX_URL

# Check Convex deployment status
npx convex dashboard

# Redeploy if needed
npx convex deploy --prod
```

#### 3. Clerk Authentication Errors

**Error**: `Clerk: Invalid publishable key`

**Solution**:
```bash
# Verify keys are correct
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY

# Check allowed domains in Clerk dashboard
# Add your deployment domain to allowed list
```

#### 4. File Upload Failures

**Error**: `File upload failed: 413 Payload Too Large`

**Solution**:
```javascript
// Increase body size limit in next.config.js
module.exports = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};
```

#### 5. PDF Generation Timeout

**Error**: `PDF generation timed out`

**Solution**:
```typescript
// Increase timeout in pdfGenerator.ts
const browser = await puppeteer.launch({
  timeout: 60000, // 60 seconds
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
```

#### 6. Email Delivery Issues

**Error**: `Resend API error: 403 Forbidden`

**Solution**:
```bash
# Verify Resend API key
echo $RESEND_API_KEY

# Check domain verification in Resend dashboard
# Verify SPF and DKIM records
```

### Debug Mode

Enable debug logging:

```bash
# In .env.local
DEBUG=npd-tracker:*
LOG_LEVEL=debug
```

### Performance Debugging

```bash
# Run Lighthouse audit
npx lighthouse https://your-app.com --view

# Analyze bundle size
npx @next/bundle-analyzer
```

### Database Debugging

```bash
# Open Convex dashboard
npx convex dashboard

# Run query in console
npx convex run debug:queryData
```

---

## Security Checklist

- [ ] **Environment Variables**
  - [ ] No secrets committed to Git
  - [ ] All secrets stored in Vercel/AWS Secrets Manager
  - [ ] `.env.example` contains only placeholder values

- [ ] **Authentication**
  - [ ] Clerk properly configured
  - [ ] Session timeout configured (7 days)
  - [ ] Multi-factor authentication enabled (optional)

- [ ] **Authorization**
  - [ ] RBAC properly enforced
  - [ ] All mutations check permissions
  - [ ] Organization isolation verified

- [ ] **API Security**
  - [ ] Rate limiting enabled
  - [ ] CORS properly configured
  - [ ] CSRF protection enabled
  - [ ] Input validation on all endpoints

- [ ] **File Security**
  - [ ] File type validation
  - [ ] File size limits enforced
  - [ ] Virus scanning (if required)
  - [ ] Secure file URLs (signed, expiring)

- [ ] **Headers**
  - [ ] Content-Security-Policy configured
  - [ ] X-Frame-Options: DENY
  - [ ] X-Content-Type-Options: nosniff
  - [ ] Strict-Transport-Security enabled

---

## Support & Resources

### Documentation

- **User Guide**: `docs/USER_GUIDE.md`
- **Admin Guide**: `docs/ADMIN_GUIDE.md`
- **API Documentation**: `docs/API_DOCUMENTATION.md`

### External Resources

- **Next.js**: https://nextjs.org/docs
- **Convex**: https://docs.convex.dev
- **Clerk**: https://clerk.com/docs
- **Vercel**: https://vercel.com/docs

### Getting Help

- **GitHub Issues**: https://github.com/your-org/npd-tracker/issues
- **Email Support**: support@npd-tracker.com
- **Community Forum**: https://forum.npd-tracker.com

---

## Appendix

### A. Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Convex deployment URL | `https://app.convex.cloud` |
| `CONVEX_DEPLOYMENT` | Yes | Convex deployment name | `prod:app-123` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key | `pk_live_...` |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key | `sk_live_...` |
| `RESEND_API_KEY` | Yes | Resend API key | `re_...` |
| `NEXT_PUBLIC_SENTRY_DSN` | No | Sentry DSN | `https://...@sentry.io/...` |
| `NEXT_PUBLIC_APP_URL` | Yes | Application URL | `https://app.com` |
| `NODE_ENV` | Yes | Environment | `production` |

### B. Port Reference

| Service | Port | Description |
|---------|------|-------------|
| Next.js Dev | 3000 | Development server |
| Convex Dev | 3210 | Convex dashboard |
| Nginx | 80/443 | HTTP/HTTPS |

### C. Deployment Checklist

```markdown
## Pre-Deployment
- [ ] All tests passing
- [ ] No linter errors
- [ ] Type check passing
- [ ] Build succeeds locally
- [ ] Environment variables documented
- [ ] Secrets configured in deployment platform

## Deployment
- [ ] Convex deployed to production
- [ ] Clerk configured for production domain
- [ ] Application deployed
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate issued

## Post-Deployment
- [ ] Health check passing
- [ ] Authentication working
- [ ] Core features tested
- [ ] Email notifications working
- [ ] Monitoring configured
- [ ] Backups verified
- [ ] Performance benchmarks met
```

---

**Document Version**: 1.0  
**Last Updated**: November 2025  
**Next Review**: February 2026

