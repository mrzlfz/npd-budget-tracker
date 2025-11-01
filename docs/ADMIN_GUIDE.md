# NPD Tracker - Administrator Guide

**Version:** 1.0  
**Last Updated:** November 2025  
**Target Audience:** System Administrators, Technical Support Staff

---

## Table of Contents

1. [Introduction](#introduction)
2. [System Requirements](#system-requirements)
3. [Initial Setup](#initial-setup)
4. [Organization Management](#organization-management)
5. [User Management](#user-management)
6. [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
7. [RKA Data Management](#rka-data-management)
8. [PDF Template Configuration](#pdf-template-configuration)
9. [Email Notification Settings](#email-notification-settings)
10. [File Storage Management](#file-storage-management)
11. [Audit Logs & Monitoring](#audit-logs--monitoring)
12. [Database Management](#database-management)
13. [Performance Optimization](#performance-optimization)
14. [Security Best Practices](#security-best-practices)
15. [Backup & Recovery](#backup--recovery)
16. [Troubleshooting](#troubleshooting)
17. [API Configuration](#api-configuration)
18. [Scheduled Jobs & Maintenance](#scheduled-jobs--maintenance)

---

## Introduction

### Purpose of This Guide

This guide provides system administrators with comprehensive instructions for configuring, managing, and maintaining the NPD Tracker application. It covers all administrative tasks from initial setup to ongoing maintenance and troubleshooting.

### Key Administrative Responsibilities

- **User & Organization Management**: Creating and managing organizations, users, and roles
- **Data Management**: Importing RKA data, managing file storage, monitoring database health
- **System Configuration**: Configuring PDF templates, email notifications, and system settings
- **Security & Compliance**: Managing access controls, audit logs, and security policies
- **Performance & Monitoring**: Optimizing system performance and monitoring application health
- **Backup & Recovery**: Ensuring data integrity and disaster recovery preparedness

---

## System Requirements

### Production Environment

#### Server Requirements
- **Platform**: Vercel (recommended) or AWS/Docker
- **Node.js**: v18.x or higher
- **Memory**: Minimum 2GB RAM (4GB recommended)
- **Storage**: 20GB minimum (scales with file uploads)
- **Network**: HTTPS required, CDN recommended

#### External Services
- **Convex**: Backend database and real-time sync
- **Clerk**: Authentication and user management
- **Resend**: Email delivery service
- **Sentry** (optional): Error tracking and monitoring

#### Browser Support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android 90+)

### Development Environment

```bash
# Required tools
Node.js v18+ (LTS recommended)
pnpm v8+
Git
VS Code or similar IDE

# Recommended extensions
ESLint
Prettier
TypeScript
Convex
```

---

## Initial Setup

### 1. Environment Configuration

Create a `.env.local` file in the `apps/web` directory:

```bash
# Convex Configuration
CONVEX_DEPLOYMENT=<your-convex-deployment-url>
NEXT_PUBLIC_CONVEX_URL=<your-convex-public-url>

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<your-clerk-publishable-key>
CLERK_SECRET_KEY=<your-clerk-secret-key>
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Email Configuration (Resend)
RESEND_API_KEY=<your-resend-api-key>
RESEND_FROM_EMAIL=noreply@yourdomain.com

# Application Settings
NEXT_PUBLIC_BASE_URL=https://your-domain.com
NODE_ENV=production

# Sentry (Optional)
SENTRY_DSN=<your-sentry-dsn>
SENTRY_AUTH_TOKEN=<your-sentry-auth-token>

# File Upload Limits
MAX_FILE_SIZE=10485760  # 10MB in bytes
MAX_FILES_PER_NPD=10
```

### 2. Convex Setup

```bash
# Install Convex CLI
npm install -g convex

# Login to Convex
npx convex login

# Create production deployment
npx convex deploy --prod

# Push schema and functions
npx convex dev --once
```

### 3. Clerk Setup

1. **Create Clerk Application**:
   - Go to https://clerk.com/
   - Create new application
   - Enable email/password authentication
   - Configure OAuth providers (optional)

2. **Configure Organizations**:
   - Enable Organizations feature in Clerk dashboard
   - Set organization naming: "Organization"
   - Enable organization creation by users (or restrict to admins)

3. **Set Up Webhooks** (for user sync):
   ```
   Endpoint: https://your-domain.com/api/webhooks/clerk
   Events: user.created, user.updated, organization.created
   ```

### 4. Resend Email Setup

1. **Create Resend Account**: https://resend.com/
2. **Add Domain**: Verify your sending domain
3. **Create API Key**: Copy to `.env.local`
4. **Configure DNS**: Add SPF, DKIM, DMARC records

### 5. Initial Deployment

```bash
# Install dependencies
pnpm install

# Build application
pnpm build

# Deploy to Vercel
vercel --prod

# Or deploy to custom server
docker build -t npd-tracker .
docker run -p 3000:3000 npd-tracker
```

---

## Organization Management

### Creating Organizations

Organizations are the top-level entities in NPD Tracker. Each organization represents a government unit (e.g., Dinas Pendidikan, Dinas Kesehatan).

#### Via Clerk Dashboard

1. Navigate to Clerk Dashboard → Organizations
2. Click "Create Organization"
3. Fill in:
   - **Name**: Official organization name
   - **Slug**: URL-friendly identifier (e.g., `dinas-pendidikan`)
4. Assign initial admin user

#### Via Application

1. Login as super admin
2. Navigate to **Settings** → **Organizations**
3. Click **"Add Organization"**
4. Fill in organization details:
   - **Nama**: Official name
   - **Kode**: Unique code (e.g., `DISDIK`)
   - **Alamat**: Physical address
   - **Telepon**: Contact number
   - **Email**: Official email
   - **Logo**: Upload organization logo (PNG/JPG, max 2MB)
5. Click **"Save"**

### Organization Settings

#### Logo Configuration

```typescript
// Logo requirements
Format: PNG, JPG, or SVG
Max size: 2MB
Recommended dimensions: 200x200px (square) or 300x100px (rectangular)
Background: Transparent (PNG) or white
```

**Upload Process**:
1. Navigate to **Settings** → **Organization Profile**
2. Click **"Change Logo"**
3. Select file
4. Crop/resize if needed
5. Save

#### PDF Template Settings

Each organization can customize PDF templates:

```typescript
{
  "headerText": "PEMERINTAH PROVINSI JAWA TIMUR",
  "subHeaderText": "DINAS PENDIDIKAN",
  "footerText": "Jl. Example No. 123, Surabaya",
  "showWatermark": true,
  "watermarkText": "DRAFT",
  "signaturePositions": {
    "pptk": { "x": 50, "y": 700 },
    "bendahara": { "x": 300, "y": 700 },
    "kadis": { "x": 550, "y": 700 }
  }
}
```

**Configuration Steps**:
1. Go to **Settings** → **PDF Templates**
2. Select template type (NPD, SP2D, Report)
3. Edit settings
4. Preview PDF
5. Save changes

#### Budget Year Configuration

```typescript
{
  "fiscalYear": 2025,
  "startDate": "2025-01-01",
  "endDate": "2025-12-31",
  "quarters": [
    { "name": "TW1", "start": "2025-01-01", "end": "2025-03-31" },
    { "name": "TW2", "start": "2025-04-01", "end": "2025-06-30" },
    { "name": "TW3", "start": "2025-07-01", "end": "2025-09-30" },
    { "name": "TW4", "start": "2025-10-01", "end": "2025-12-31" }
  ]
}
```

---

## User Management

### User Roles

NPD Tracker uses a hierarchical role system:

| Role | Description | Permissions |
|------|-------------|-------------|
| **Super Admin** | System administrator | Full system access, all organizations |
| **Admin** | Organization administrator | Full access within organization |
| **Bendahara** | Treasurer | Verify, finalize NPD; create SP2D; approve performance |
| **Verifikator** | Verifier | Verify NPD documents |
| **PPTK** | Budget Manager | Create and submit NPD; view reports |
| **Viewer** | Read-only user | View documents and reports only |

### Adding Users

#### Via Clerk Dashboard

1. Navigate to Clerk Dashboard → Users
2. Click **"Create User"**
3. Fill in user details:
   - Email
   - Name
   - Password (or send invitation)
4. Assign to organization
5. Set role in public metadata:
   ```json
   {
     "role": "pptk",
     "organizationId": "org_xxx"
   }
   ```

#### Via Application

1. Login as Admin
2. Navigate to **Users** → **Add User**
3. Fill in form:
   - **Name**: Full name
   - **Email**: Work email
   - **NIP**: Employee ID (optional)
   - **Role**: Select from dropdown
   - **Phone**: Contact number
4. Click **"Send Invitation"**

User receives email with invitation link to set password.

### Managing User Roles

#### Changing User Role

1. Navigate to **Users** → Select user
2. Click **"Edit"**
3. Change **Role** dropdown
4. Click **"Save"**
5. User's permissions update immediately

#### Role Permission Matrix

```typescript
const PERMISSIONS = {
  superAdmin: ["*"], // All permissions
  admin: [
    "users.create", "users.update", "users.delete",
    "npd.create", "npd.verify", "npd.finalize",
    "sp2d.create", "sp2d.update", "sp2d.delete",
    "rka.import", "reports.view", "settings.update"
  ],
  bendahara: [
    "npd.verify", "npd.finalize",
    "sp2d.create", "sp2d.update",
    "performance.approve", "reports.view"
  ],
  verifikator: [
    "npd.verify", "reports.view"
  ],
  pptk: [
    "npd.create", "npd.update", "npd.submit",
    "performance.create", "reports.view"
  ],
  viewer: [
    "npd.view", "sp2d.view", "reports.view"
  ]
};
```

### Deactivating Users

1. Navigate to **Users** → Select user
2. Click **"Deactivate"**
3. Confirm action
4. User loses access immediately
5. All audit logs preserved

**Reactivation**: Click **"Activate"** to restore access.

### Bulk User Import

Import multiple users via CSV:

```csv
name,email,nip,role,phone
John Doe,john@example.com,199001012020011001,pptk,081234567890
Jane Smith,jane@example.com,199002022020012002,bendahara,081234567891
```

**Import Process**:
1. Navigate to **Users** → **Import**
2. Download CSV template
3. Fill in user data
4. Upload CSV file
5. Review preview
6. Click **"Import Users"**
7. Invitation emails sent automatically

---

## Role-Based Access Control (RBAC)

### Permission System

NPD Tracker uses a granular permission system based on:
- **Resource**: What is being accessed (npd, sp2d, rka, etc.)
- **Action**: What operation (create, read, update, delete, verify, etc.)
- **Scope**: Organization-level or system-level

### Configuring Permissions

Permissions are defined in `packages/convex/functions/permissions.ts`:

```typescript
export const checkPermission = async (
  ctx: QueryCtx | MutationCtx,
  userId: Id<"users">,
  action: string,
  resource: string
): Promise<boolean> => {
  const user = await ctx.db.get(userId);
  if (!user) return false;

  const role = user.role;
  const permissions = ROLE_PERMISSIONS[role] || [];

  return permissions.includes(`${resource}.${action}`) || 
         permissions.includes("*");
};
```

### Custom Permissions

To add custom permissions:

1. **Define Permission**:
   ```typescript
   // In packages/convex/functions/permissions.ts
   export const CUSTOM_PERMISSIONS = {
     "reports.export": ["admin", "bendahara"],
     "budget.override": ["admin"],
   };
   ```

2. **Apply in Mutation**:
   ```typescript
   export const exportReport = mutation({
     handler: async (ctx, args) => {
       const userId = await getAuthUserId(ctx);
       const canExport = await checkPermission(
         ctx, userId, "export", "reports"
       );
       if (!canExport) {
         throw new Error("Permission denied");
       }
       // ... export logic
     }
   });
   ```

3. **Update Frontend**:
   ```typescript
   // In apps/web/src/hooks/usePermissions.ts
   const canExportReports = usePermission("export", "reports");
   ```

### Organization-Level Isolation

All data is isolated by organization:

```typescript
// Automatic organization filtering
export const listNPDs = query({
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    const user = await ctx.db.get(userId);
    
    return await ctx.db
      .query("npdDocuments")
      .withIndex("by_organization", (q) => 
        q.eq("organizationId", user.organizationId)
      )
      .collect();
  }
});
```

**Security Note**: Never bypass organization filtering unless explicitly required for super admin functions.

---

## RKA Data Management

### RKA Structure

RKA (Rencana Kerja Anggaran) follows a hierarchical structure:

```
Organization
└── Program (e.g., "Program Pendidikan Dasar")
    └── Kegiatan (e.g., "Peningkatan Mutu Pendidikan")
        └── Sub Kegiatan (e.g., "Pelatihan Guru")
            └── Account (e.g., "5.1.02.01.01.0051 - Belanja Perjalanan Dinas")
```

### Importing RKA Data

#### CSV Format

```csv
kode_program,nama_program,kode_kegiatan,nama_kegiatan,kode_subkegiatan,nama_subkegiatan,kode_rekening,nama_rekening,pagu
1.01,Program Pendidikan Dasar,1.01.01,Peningkatan Mutu Pendidikan,1.01.01.001,Pelatihan Guru,5.1.02.01.01.0051,Belanja Perjalanan Dinas,50000000
1.01,Program Pendidikan Dasar,1.01.01,Peningkatan Mutu Pendidikan,1.01.01.001,Pelatihan Guru,5.1.02.01.01.0052,Belanja Bahan,30000000
```

**Field Descriptions**:
- `kode_program`: Unique program code
- `nama_program`: Program name
- `kode_kegiatan`: Unique activity code
- `nama_kegiatan`: Activity name
- `kode_subkegiatan`: Unique sub-activity code
- `nama_subkegiatan`: Sub-activity name
- `kode_rekening`: Account code (format: X.X.XX.XX.XX.XXXX)
- `nama_rekening`: Account name
- `pagu`: Budget allocation (in Rupiah, no separators)

#### Import Process

1. **Prepare CSV File**:
   - Use UTF-8 encoding
   - No BOM (Byte Order Mark)
   - Comma-separated
   - Header row required

2. **Import via UI**:
   - Navigate to **RKA** → **Import**
   - Click **"Upload CSV"**
   - Select file
   - Review preview (shows first 10 rows)
   - Click **"Import"**

3. **Validation**:
   - Duplicate codes detected
   - Invalid account codes flagged
   - Missing required fields highlighted
   - Budget amounts validated (must be positive numbers)

4. **Error Handling**:
   - Import stops on first error
   - Error message shows row number and issue
   - Fix CSV and re-import

#### Import via API

```typescript
// POST /api/v1/rka/import
const formData = new FormData();
formData.append('file', csvFile);
formData.append('organizationId', orgId);
formData.append('fiscalYear', '2025');

const response = await fetch('/api/v1/rka/import', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
// { success: true, imported: 150, errors: [] }
```

### Managing RKA Data

#### Editing Budget Allocations

1. Navigate to **RKA** → **Accounts**
2. Search for account by code or name
3. Click **"Edit"**
4. Update **Pagu** (budget allocation)
5. Add **Notes** (reason for change)
6. Click **"Save"**

**Audit Trail**: All changes logged with timestamp, user, old value, new value.

#### Adding New Accounts

1. Navigate to **RKA** → **Accounts** → **Add Account**
2. Select **Program** → **Kegiatan** → **Sub Kegiatan**
3. Fill in:
   - **Kode Rekening**: Account code
   - **Nama Rekening**: Account name
   - **Pagu**: Budget allocation
   - **Jenis Belanja**: Expense type (Pegawai, Barang, Modal)
4. Click **"Save"**

#### Deleting RKA Data

**Warning**: Deleting RKA data affects all related NPDs and realizations.

1. Navigate to **RKA** → **Accounts**
2. Select account(s) to delete
3. Click **"Delete"**
4. Confirm action
5. System checks for dependencies:
   - If NPDs exist: Deletion blocked
   - If no NPDs: Deletion proceeds

**Soft Delete**: Deleted accounts marked as inactive, not permanently removed.

### RKA Validation Rules

```typescript
const RKA_VALIDATION = {
  kodeRekening: {
    pattern: /^\d\.\d\.\d{2}\.\d{2}\.\d{2}\.\d{4}$/,
    example: "5.1.02.01.01.0051"
  },
  pagu: {
    min: 0,
    max: 999999999999, // 1 trillion
    type: "integer"
  },
  hierarchy: {
    program: { required: true },
    kegiatan: { required: true },
    subkegiatan: { required: true }
  }
};
```

---

## PDF Template Configuration

### Template Types

NPD Tracker generates three types of PDFs:
1. **NPD Document**: Official budget request document
2. **SP2D Document**: Fund disbursement record
3. **Quarterly Report**: Performance and realization summary

### NPD Template Configuration

Located in `apps/web/src/lib/services/pdfGenerator.ts`:

```typescript
const NPD_TEMPLATE_CONFIG = {
  header: {
    logoPosition: { x: 50, y: 30 },
    logoSize: { width: 80, height: 80 },
    titlePosition: { x: 150, y: 40 },
    titleFont: "Arial",
    titleSize: 16,
    titleBold: true
  },
  body: {
    marginLeft: 50,
    marginRight: 50,
    marginTop: 150,
    lineHeight: 1.5,
    fontSize: 11
  },
  signatures: {
    pptk: { label: "PPTK", x: 50, y: 700 },
    bendahara: { label: "Bendahara", x: 250, y: 700 },
    kadis: { label: "Kepala Dinas", x: 450, y: 700 }
  },
  watermark: {
    enabled: true,
    text: "DRAFT",
    opacity: 0.1,
    fontSize: 100,
    rotation: -45
  }
};
```

### Customizing Templates

#### 1. Edit Template Configuration

```bash
# Edit template file
nano apps/web/src/lib/services/pdfTemplateConfig.ts
```

```typescript
export const getOrganizationPDFConfig = async (
  organizationId: Id<"organizations">
) => {
  const org = await db.get(organizationId);
  
  return {
    header: {
      text: org.headerText || "PEMERINTAH PROVINSI JAWA TIMUR",
      subText: org.subHeaderText || org.nama,
      logoUrl: org.logoUrl
    },
    footer: {
      text: org.footerText || `${org.alamat} | ${org.telepon}`
    },
    // ... other settings
  };
};
```

#### 2. Update Organization Settings

```typescript
// In Convex mutation
export const updatePDFSettings = mutation({
  args: {
    organizationId: v.id("organizations"),
    settings: v.object({
      headerText: v.optional(v.string()),
      subHeaderText: v.optional(v.string()),
      footerText: v.optional(v.string()),
      showWatermark: v.optional(v.boolean()),
      signatureLayout: v.optional(v.string())
    })
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.organizationId, {
      pdfSettings: args.settings,
      updatedAt: Date.now()
    });
  }
});
```

#### 3. Test PDF Generation

```bash
# Generate test PDF
curl -X POST https://your-domain.com/api/v1/pdf/generate \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "npd",
    "npdId": "test_npd_id",
    "preview": true
  }'
```

### Signature Configuration

#### Digital Signatures

```typescript
const SIGNATURE_CONFIG = {
  enabled: true,
  provider: "digisign", // or "privy", "manual"
  positions: {
    pptk: { page: 1, x: 100, y: 650, width: 150, height: 80 },
    bendahara: { page: 1, x: 300, y: 650, width: 150, height: 80 },
    kadis: { page: 1, x: 500, y: 650, width: 150, height: 80 }
  },
  stampText: "Ditandatangani secara elektronik",
  timestampFormat: "DD MMMM YYYY HH:mm:ss"
};
```

#### Manual Signatures (Image Upload)

1. Navigate to **Settings** → **Signatures**
2. Upload signature image for each role:
   - Format: PNG with transparent background
   - Size: 150x80px recommended
   - Max file size: 500KB
3. Signatures automatically embedded in PDFs

---

## Email Notification Settings

### Email Configuration

Email notifications are sent via Resend API. Configuration in `.env.local`:

```bash
RESEND_API_KEY=re_xxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
RESEND_FROM_NAME=NPD Tracker System
```

### Notification Types

| Event | Recipients | Template |
|-------|-----------|----------|
| NPD Submitted | Verifikator, Bendahara | `NPDSubmitted.tsx` |
| NPD Verified | PPTK (creator) | `NPDVerified.tsx` |
| NPD Rejected | PPTK (creator) | `NPDRejected.tsx` |
| NPD Finalized | All stakeholders | `NPDFinalized.tsx` |
| SP2D Created | Bendahara, PPTK | `SP2DCreated.tsx` |
| Performance Approved | PPTK | `PerformanceApproved.tsx` |
| Budget Alert (>80%) | Admin, Bendahara | `BudgetAlert.tsx` |

### Email Templates

Templates are located in `apps/web/src/lib/email/templates/`:

```typescript
// Example: NPDSubmitted.tsx
import { Html, Head, Body, Container, Text, Button } from '@react-email/components';

export const NPDSubmittedEmail = ({ npdNumber, submittedBy, viewLink }) => (
  <Html>
    <Head />
    <Body style={main}>
      <Container style={container}>
        <Text style={heading}>NPD Baru Diajukan</Text>
        <Text style={paragraph}>
          NPD dengan nomor <strong>{npdNumber}</strong> telah diajukan oleh {submittedBy}.
        </Text>
        <Button href={viewLink} style={button}>
          Lihat NPD
        </Button>
      </Container>
    </Body>
  </Html>
);

const main = { backgroundColor: '#f6f9fc', fontFamily: 'Arial, sans-serif' };
const container = { margin: '0 auto', padding: '20px', maxWidth: '600px' };
// ... more styles
```

### Customizing Email Templates

1. **Edit Template File**:
   ```bash
   nano apps/web/src/lib/email/templates/NPDSubmitted.tsx
   ```

2. **Update Content**:
   - Change text, styling, layout
   - Add organization logo
   - Customize colors to match branding

3. **Preview Template**:
   ```bash
   pnpm email dev
   # Opens preview at http://localhost:3000
   ```

4. **Deploy Changes**:
   ```bash
   pnpm build
   vercel --prod
   ```

### Email Delivery Monitoring

#### Via Resend Dashboard

1. Login to Resend dashboard
2. Navigate to **Logs**
3. View delivery status:
   - **Sent**: Email delivered successfully
   - **Bounced**: Invalid recipient email
   - **Complained**: Recipient marked as spam
   - **Failed**: Delivery error

#### Via Application

1. Navigate to **Settings** → **Email Logs**
2. View recent emails:
   - Timestamp
   - Recipient
   - Template
   - Status
   - Error message (if failed)

### Email Rate Limiting

To prevent abuse, email sending is rate-limited:

```typescript
const EMAIL_RATE_LIMITS = {
  perUser: {
    limit: 50,
    window: 3600 // 1 hour
  },
  perOrganization: {
    limit: 500,
    window: 3600
  },
  global: {
    limit: 5000,
    window: 3600
  }
};
```

**Adjusting Limits**:
```typescript
// In packages/convex/functions/notifications.ts
export const updateRateLimits = mutation({
  args: {
    organizationId: v.id("organizations"),
    limits: v.object({
      hourly: v.number(),
      daily: v.number()
    })
  },
  handler: async (ctx, args) => {
    // Update limits for organization
  }
});
```

### Disabling Notifications

Users can manage their notification preferences:

1. Navigate to **Settings** → **Notifications**
2. Toggle notification types:
   - NPD Submitted
   - NPD Verified
   - SP2D Created
   - Performance Approved
   - Budget Alerts
3. Set frequency:
   - **Immediate**: Real-time emails
   - **Daily Digest**: One email per day (8 AM)
   - **Weekly Digest**: One email per week (Monday 8 AM)
   - **Disabled**: No emails

---

## File Storage Management

### Storage Configuration

Files are stored in Convex File Storage with the following limits:

```typescript
const FILE_STORAGE_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFilesPerNPD: 10,
  allowedTypes: [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ],
  quotaPerOrganization: 1 * 1024 * 1024 * 1024 // 1GB
};
```

### Monitoring Storage Usage

#### Via Dashboard

1. Navigate to **Settings** → **Storage**
2. View metrics:
   - **Total Files**: Number of files uploaded
   - **Total Size**: Storage used (MB/GB)
   - **Quota**: Remaining storage
   - **Top Uploaders**: Users with most uploads

#### Via API

```typescript
// GET /api/v1/storage/usage
const response = await fetch('/api/v1/storage/usage', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const usage = await response.json();
// {
//   totalFiles: 1234,
//   totalSize: 524288000, // bytes
//   quota: 1073741824,
//   percentUsed: 48.8,
//   topUploaders: [...]
// }
```

### Managing File Quotas

#### Per-Organization Quotas

```typescript
export const updateStorageQuota = mutation({
  args: {
    organizationId: v.id("organizations"),
    quotaGB: v.number()
  },
  handler: async (ctx, args) => {
    const quotaBytes = args.quotaGB * 1024 * 1024 * 1024;
    
    await ctx.db.patch(args.organizationId, {
      storageQuota: quotaBytes,
      updatedAt: Date.now()
    });
  }
});
```

**Setting Quota**:
1. Navigate to **Organizations** → Select organization
2. Click **"Edit Storage Quota"**
3. Enter quota in GB (e.g., `5` for 5GB)
4. Click **"Save"**

### File Cleanup

#### Orphaned Files

Files not linked to any NPD are considered orphaned.

**Manual Cleanup**:
1. Navigate to **Settings** → **Storage** → **Cleanup**
2. Click **"Scan for Orphaned Files"**
3. Review list of orphaned files
4. Select files to delete
5. Click **"Delete Selected"**

**Automated Cleanup** (via cron job):
```typescript
// packages/convex/cron.config.ts
export default {
  cleanupOrphanedFiles: {
    schedule: "0 2 * * *", // Daily at 2 AM
    handler: async (ctx) => {
      const orphanedFiles = await ctx.db
        .query("attachments")
        .filter((q) => q.eq(q.field("npdId"), null))
        .collect();
      
      for (const file of orphanedFiles) {
        await ctx.storage.delete(file.url);
        await ctx.db.delete(file._id);
      }
    }
  }
};
```

#### Old Files

Delete files older than specified period:

1. Navigate to **Settings** → **Storage** → **Cleanup**
2. Select **"Delete files older than"**
3. Choose period (e.g., 2 years)
4. Click **"Scan"**
5. Review files
6. Click **"Delete"**

### File Security

#### Virus Scanning

**Integration with ClamAV** (optional):

```typescript
// packages/convex/functions/files.ts
import { scanFile } from '../lib/virusScanner';

export const upload = mutation({
  handler: async (ctx, args) => {
    // ... upload logic
    
    // Scan for viruses
    const scanResult = await scanFile(fileUrl);
    if (!scanResult.clean) {
      await ctx.storage.delete(fileUrl);
      throw new Error("File contains malware");
    }
    
    // ... continue
  }
});
```

#### Access Control

All file downloads are authenticated and logged:

```typescript
export const getDownloadUrl = query({
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const file = await ctx.db.get(args.fileId);
    
    // Check permissions
    const canDownload = await checkPermission(
      ctx, userId, "download", "files"
    );
    if (!canDownload) {
      throw new Error("Access denied");
    }
    
    // Log download
    await ctx.db.insert("auditLogs", {
      action: "file_downloaded",
      entityTable: "attachments",
      entityId: args.fileId,
      actorUserId: userId,
      createdAt: Date.now()
    });
    
    // Generate signed URL (expires in 1 hour)
    return await ctx.storage.getUrl(file.url);
  }
});
```

---

## Audit Logs & Monitoring

### Audit Log System

All critical actions are logged in the `auditLogs` table:

```typescript
interface AuditLog {
  _id: Id<"auditLogs">;
  action: string; // e.g., "npd_created", "sp2d_deleted"
  entityTable: string; // e.g., "npdDocuments", "sp2dRefs"
  entityId: string; // ID of affected entity
  actorUserId: Id<"users">; // Who performed the action
  organizationId: Id<"organizations">;
  entityData?: any; // Additional context
  ipAddress?: string;
  userAgent?: string;
  createdAt: number;
}
```

### Viewing Audit Logs

#### Via UI

1. Navigate to **Settings** → **Audit Logs**
2. Filter by:
   - **Date Range**: Last 7 days, 30 days, custom
   - **Action Type**: NPD created, SP2D deleted, etc.
   - **User**: Specific user
   - **Entity**: Specific NPD or SP2D
3. Export logs to CSV

#### Via API

```typescript
// GET /api/v1/audit-logs
const response = await fetch('/api/v1/audit-logs?' + new URLSearchParams({
  startDate: '2025-01-01',
  endDate: '2025-01-31',
  action: 'npd_finalized',
  userId: 'user_xxx'
}), {
  headers: { 'Authorization': `Bearer ${token}` }
});

const logs = await response.json();
```

### Critical Actions Logged

- **NPD Actions**: Created, submitted, verified, rejected, finalized, deleted
- **SP2D Actions**: Created, updated, deleted, restored
- **User Actions**: Login, logout, role changed, deactivated
- **RKA Actions**: Imported, updated, deleted
- **File Actions**: Uploaded, downloaded, deleted
- **Settings**: Configuration changed

### Audit Log Retention

```typescript
const AUDIT_LOG_RETENTION = {
  critical: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
  standard: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
  routine: 90 * 24 * 60 * 60 * 1000 // 90 days
};
```

**Archiving Old Logs**:
```bash
# Run monthly
pnpm convex run functions/archiveAuditLogs --args '{"olderThan": "2023-01-01"}'
```

### Monitoring Dashboard

#### Key Metrics

1. **System Health**:
   - Uptime percentage
   - Average response time
   - Error rate
   - Active users

2. **Usage Statistics**:
   - NPDs created per day
   - SP2Ds created per day
   - File uploads per day
   - Active organizations

3. **Performance Metrics**:
   - Database query time
   - PDF generation time
   - Email delivery rate
   - Storage usage

#### Setting Up Monitoring

**Sentry Integration**:

```bash
# Install Sentry
pnpm add @sentry/nextjs

# Configure in next.config.js
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig({
  // ... Next.js config
}, {
  silent: true,
  org: "your-org",
  project: "npd-tracker"
});
```

**Custom Monitoring**:

```typescript
// apps/web/src/lib/monitoring.ts
export const trackMetric = async (
  metric: string,
  value: number,
  tags?: Record<string, string>
) => {
  await fetch('/api/v1/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ metric, value, tags, timestamp: Date.now() })
  });
};

// Usage
await trackMetric('npd.created', 1, { organization: 'DISDIK' });
await trackMetric('pdf.generation.time', 1250, { type: 'npd' });
```

---

## Database Management

### Convex Database

NPD Tracker uses Convex as its database. Convex provides:
- Real-time synchronization
- Automatic backups
- ACID transactions
- Built-in indexes

### Database Schema

Key tables:

```typescript
// organizations
// users
// npdDocuments
// npdLines
// sp2dRefs
// realizations
// rkaPrograms
// rkaKegiatans
// rkaSubkegiatans
// rkaAccounts
// attachments
// auditLogs
// performanceLogs
// notifications
```

### Running Migrations

Migrations are handled via Convex schema updates:

```bash
# 1. Update schema in packages/convex/schema.ts
# 2. Push schema changes
npx convex dev --once

# 3. Run data migration (if needed)
npx convex run functions/migrations:migrateNpdFilesToAttachments
```

**Example Migration**:

```typescript
// packages/convex/functions/migrations.ts
export const migrateNpdFilesToAttachments = mutation({
  handler: async (ctx) => {
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
        updatedAt: file.updatedAt
      });
    }
    
    console.log(`Migrated ${npdFiles.length} files`);
  }
});
```

### Database Indexes

Indexes improve query performance:

```typescript
// In schema.ts
npdDocuments: defineTable({
  // ... fields
})
  .index("by_organization", ["organizationId"])
  .index("by_status", ["status"])
  .index("by_created_date", ["createdAt"])
  .index("by_nomor", ["nomorNPD"]),
```

**Adding New Index**:
1. Edit `packages/convex/schema.ts`
2. Add `.index("index_name", ["field1", "field2"])`
3. Push schema: `npx convex dev --once`

### Query Optimization

**Slow Query Detection**:

```typescript
// Enable query logging
export const slowQueryLogger = async (ctx, queryName, duration) => {
  if (duration > 1000) { // > 1 second
    console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
    await ctx.db.insert("slowQueries", {
      queryName,
      duration,
      timestamp: Date.now()
    });
  }
};
```

**Optimization Tips**:
- Use indexes for frequently queried fields
- Limit result sets with `.take(n)`
- Avoid querying large collections without filters
- Use pagination for large datasets

### Data Export

**Export All Data**:

```bash
# Export to JSON
npx convex export --format json --output backup.json

# Export specific table
npx convex export --table npdDocuments --output npd-backup.json
```

**Import Data**:

```bash
npx convex import --file backup.json
```

---

## Performance Optimization

### Frontend Optimization

#### 1. Code Splitting

```typescript
// Use dynamic imports for heavy components
const PDFViewer = dynamic(() => import('@/components/pdf/PDFViewer'), {
  loading: () => <Spinner />,
  ssr: false
});
```

#### 2. Image Optimization

```typescript
// Use Next.js Image component
import Image from 'next/image';

<Image
  src="/logo.png"
  width={200}
  height={100}
  alt="Logo"
  priority // For above-the-fold images
/>
```

#### 3. Caching

```typescript
// Enable SWR caching for Convex queries
import { useQuery } from "convex/react";

const npds = useQuery(api.npd.list, {}, {
  staleTime: 60000, // Cache for 1 minute
  cacheTime: 300000 // Keep in cache for 5 minutes
});
```

### Backend Optimization

#### 1. Database Query Optimization

```typescript
// Bad: Load all NPDs then filter
const allNPDs = await ctx.db.query("npdDocuments").collect();
const filteredNPDs = allNPDs.filter(npd => npd.status === "Final");

// Good: Filter at database level
const finalNPDs = await ctx.db
  .query("npdDocuments")
  .withIndex("by_status", (q) => q.eq("status", "Final"))
  .collect();
```

#### 2. Pagination

```typescript
export const listNPDsPaginated = query({
  args: {
    page: v.number(),
    pageSize: v.number()
  },
  handler: async (ctx, args) => {
    const skip = (args.page - 1) * args.pageSize;
    
    const npds = await ctx.db
      .query("npdDocuments")
      .order("desc")
      .skip(skip)
      .take(args.pageSize)
      .collect();
    
    const total = await ctx.db.query("npdDocuments").count();
    
    return {
      data: npds,
      page: args.page,
      pageSize: args.pageSize,
      total,
      totalPages: Math.ceil(total / args.pageSize)
    };
  }
});
```

#### 3. Caching Expensive Operations

```typescript
// Cache PDF generation
const pdfCache = new Map<string, Buffer>();

export const generateNPDPDF = async (npdId: string) => {
  if (pdfCache.has(npdId)) {
    return pdfCache.get(npdId);
  }
  
  const pdf = await generatePDF(npdId);
  pdfCache.set(npdId, pdf);
  
  // Expire after 1 hour
  setTimeout(() => pdfCache.delete(npdId), 3600000);
  
  return pdf;
};
```

### Monitoring Performance

#### Lighthouse Audit

```bash
# Install Lighthouse
npm install -g lighthouse

# Run audit
lighthouse https://your-domain.com --output html --output-path report.html

# Target scores:
# Performance: >90
# Accessibility: >95
# Best Practices: >95
# SEO: >90
```

#### Core Web Vitals

Monitor in production:

```typescript
// apps/web/src/app/layout.tsx
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

View metrics in Vercel Analytics dashboard.

---

## Security Best Practices

### Authentication Security

#### 1. Password Policy

Enforce strong passwords via Clerk:
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

#### 2. Multi-Factor Authentication (MFA)

Enable MFA for admin users:
1. Clerk Dashboard → User & Authentication → Multi-factor
2. Enable SMS or Authenticator App
3. Require MFA for admin role

#### 3. Session Management

```typescript
const SESSION_CONFIG = {
  maxAge: 7 * 24 * 60 * 60, // 7 days
  inactivityTimeout: 30 * 60, // 30 minutes
  renewalThreshold: 24 * 60 * 60 // Renew if < 1 day left
};
```

### Authorization Security

#### 1. Role-Based Access Control

Always check permissions:

```typescript
export const deleteNPD = mutation({
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    
    // Check permission
    const canDelete = await checkPermission(ctx, userId, "delete", "npd");
    if (!canDelete) {
      throw new Error("Permission denied");
    }
    
    // Proceed with deletion
  }
});
```

#### 2. Organization Isolation

Never allow cross-organization access:

```typescript
export const getNPD = query({
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    const user = await ctx.db.get(userId);
    const npd = await ctx.db.get(args.npdId);
    
    // Verify organization match
    if (npd.organizationId !== user.organizationId) {
      throw new Error("Access denied");
    }
    
    return npd;
  }
});
```

### Data Security

#### 1. Input Validation

Validate all user inputs:

```typescript
import { z } from 'zod';

const CreateNPDSchema = z.object({
  maksud: z.string().min(10).max(500),
  nilaiTotal: z.number().positive().max(999999999999),
  lines: z.array(z.object({
    accountId: z.string(),
    nilaiUsulan: z.number().positive()
  })).min(1).max(50)
});

export const createNPD = mutation({
  handler: async (ctx, args) => {
    // Validate input
    const validated = CreateNPDSchema.parse(args);
    
    // Proceed with creation
  }
});
```

#### 2. SQL Injection Prevention

Convex is safe by design (no raw SQL), but always use parameterized queries:

```typescript
// Safe: Uses Convex query builder
const npd = await ctx.db
  .query("npdDocuments")
  .withIndex("by_nomor", (q) => q.eq("nomorNPD", args.nomor))
  .first();
```

#### 3. XSS Prevention

React escapes by default, but be careful with `dangerouslySetInnerHTML`:

```typescript
// Bad: Allows XSS
<div dangerouslySetInnerHTML={{ __html: userInput }} />

// Good: Use sanitization library
import DOMPurify from 'isomorphic-dompurify';

<div dangerouslySetInnerHTML={{ 
  __html: DOMPurify.sanitize(userInput) 
}} />
```

### Network Security

#### 1. HTTPS Only

Enforce HTTPS in production:

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }
        ]
      }
    ];
  }
};
```

#### 2. CORS Configuration

```typescript
// apps/web/src/middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  response.headers.set('Access-Control-Allow-Origin', 'https://your-domain.com');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  return response;
}
```

#### 3. Rate Limiting

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"), // 10 requests per 10 seconds
});

export const apiHandler = async (req, res) => {
  const identifier = req.headers.get("x-forwarded-for") || "anonymous";
  const { success } = await ratelimit.limit(identifier);
  
  if (!success) {
    return res.status(429).json({ error: "Too many requests" });
  }
  
  // Handle request
};
```

### Security Audits

#### Regular Security Checks

```bash
# 1. Check for vulnerabilities
npm audit

# 2. Fix vulnerabilities
npm audit fix

# 3. Update dependencies
pnpm update

# 4. Run security scan
npx snyk test
```

#### Penetration Testing

Conduct annual penetration testing:
- Test authentication bypass
- Test authorization flaws
- Test injection vulnerabilities
- Test file upload security
- Test session management

---

## Backup & Recovery

### Automated Backups

Convex provides automatic backups:
- **Frequency**: Every 24 hours
- **Retention**: 30 days
- **Location**: Convex cloud storage

### Manual Backups

#### Full Database Backup

```bash
# Export all data
npx convex export --output backup-$(date +%Y%m%d).json

# Compress backup
gzip backup-$(date +%Y%m%d).json

# Upload to S3 (optional)
aws s3 cp backup-$(date +%Y%m%d).json.gz s3://your-bucket/backups/
```

#### Selective Backup

```bash
# Backup specific tables
npx convex export \
  --table npdDocuments \
  --table sp2dRefs \
  --table realizations \
  --output critical-data-backup.json
```

### Backup Schedule

Recommended backup schedule:

| Frequency | Scope | Retention |
|-----------|-------|-----------|
| Hourly | Critical tables (NPD, SP2D) | 7 days |
| Daily | Full database | 30 days |
| Weekly | Full database + files | 90 days |
| Monthly | Full database + files | 1 year |

### Restore Procedures

#### Restore from Convex Snapshot

1. **Access Convex Dashboard**:
   - Navigate to your project
   - Go to **Settings** → **Backups**

2. **Select Snapshot**:
   - Choose date/time of snapshot
   - Click **"Restore"**

3. **Confirm Restoration**:
   - Review changes
   - Click **"Confirm Restore"**
   - Wait for completion (5-30 minutes)

#### Restore from Manual Backup

```bash
# 1. Decompress backup
gunzip backup-20250101.json.gz

# 2. Import to Convex
npx convex import --file backup-20250101.json

# 3. Verify data integrity
npx convex run functions/verifyDataIntegrity
```

### Disaster Recovery Plan

#### Recovery Time Objective (RTO): 4 hours
#### Recovery Point Objective (RPO): 24 hours

**Disaster Scenarios**:

1. **Database Corruption**:
   - Restore from latest Convex snapshot
   - Verify data integrity
   - Notify users of any data loss

2. **Accidental Data Deletion**:
   - Identify deleted records from audit logs
   - Restore specific records from backup
   - Re-run affected calculations

3. **Complete System Failure**:
   - Deploy to backup Vercel account
   - Restore database from backup
   - Update DNS records
   - Notify users of downtime

**Testing Recovery**:
- Conduct quarterly disaster recovery drills
- Document recovery procedures
- Train staff on recovery process

---

## Troubleshooting

### Common Issues

#### 1. Users Cannot Login

**Symptoms**: Login page shows error or redirects to error page.

**Diagnosis**:
```bash
# Check Clerk status
curl https://status.clerk.com/api/v2/status.json

# Check environment variables
echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
echo $CLERK_SECRET_KEY
```

**Solutions**:
- Verify Clerk API keys are correct
- Check Clerk dashboard for service outages
- Verify user exists and is active
- Check browser console for errors

#### 2. PDF Generation Fails

**Symptoms**: PDF download button shows error or generates blank PDF.

**Diagnosis**:
```bash
# Check Puppeteer installation
pnpm list puppeteer

# Test PDF generation
curl -X POST https://your-domain.com/api/v1/pdf/generate \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"type":"npd","npdId":"test_id"}'
```

**Solutions**:
- Reinstall Puppeteer: `pnpm add puppeteer`
- Increase memory limit: `NODE_OPTIONS="--max-old-space-size=4096"`
- Check Vercel function timeout (increase if needed)
- Verify NPD data is complete

#### 3. File Upload Fails

**Symptoms**: File upload progress bar stalls or shows error.

**Diagnosis**:
```bash
# Check file size
ls -lh file.pdf

# Check Convex storage quota
npx convex run functions/checkStorageQuota --args '{"organizationId":"org_xxx"}'
```

**Solutions**:
- Verify file size < 10MB
- Check storage quota not exceeded
- Verify file type is allowed
- Check network connection

#### 4. Email Not Sending

**Symptoms**: Users not receiving notification emails.

**Diagnosis**:
```bash
# Check Resend API status
curl https://api.resend.com/health

# Check email logs
npx convex run functions/getEmailLogs --args '{"limit":10}'
```

**Solutions**:
- Verify Resend API key is correct
- Check email address is valid
- Check spam folder
- Verify domain DNS records (SPF, DKIM)

#### 5. Slow Performance

**Symptoms**: Pages load slowly, queries timeout.

**Diagnosis**:
```bash
# Check Convex query performance
npx convex dashboard

# Run Lighthouse audit
lighthouse https://your-domain.com

# Check server logs
vercel logs
```

**Solutions**:
- Add database indexes for slow queries
- Implement pagination for large datasets
- Enable caching for expensive operations
- Optimize images and assets
- Upgrade Vercel plan if needed

### Debug Mode

Enable debug logging:

```bash
# In .env.local
DEBUG=true
LOG_LEVEL=debug

# Restart application
pnpm dev
```

View detailed logs in browser console and server logs.

### Support Contacts

- **Technical Support**: support@npd-tracker.com
- **Emergency Hotline**: +62-xxx-xxxx-xxxx (24/7)
- **Documentation**: https://docs.npd-tracker.com
- **Community Forum**: https://forum.npd-tracker.com

---

## API Configuration

### REST API Endpoints

NPD Tracker provides REST API endpoints for integration:

#### Authentication

```bash
# Get API token
POST /api/v1/auth/token
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 3600
}
```

#### NPD Endpoints

```bash
# List NPDs
GET /api/v1/npd?page=1&pageSize=20&status=Final
Authorization: Bearer {token}

# Get NPD details
GET /api/v1/npd/{npdId}
Authorization: Bearer {token}

# Create NPD
POST /api/v1/npd
Authorization: Bearer {token}
Content-Type: application/json

{
  "maksud": "Pelatihan Guru",
  "subkegiatanId": "subkegiatan_xxx",
  "lines": [...]
}

# Update NPD
PUT /api/v1/npd/{npdId}
Authorization: Bearer {token}
Content-Type: application/json

# Delete NPD
DELETE /api/v1/npd/{npdId}
Authorization: Bearer {token}
```

#### SP2D Endpoints

```bash
# Create SP2D
POST /api/v1/sp2d
Authorization: Bearer {token}
Content-Type: application/json

{
  "npdId": "npd_xxx",
  "noSP2D": "SP2D-001/2025",
  "tglSP2D": "2025-01-15",
  "nilaiCair": 50000000
}

# List SP2D
GET /api/v1/sp2d?npdId={npdId}
Authorization: Bearer {token}
```

### API Rate Limits

```typescript
const API_RATE_LIMITS = {
  anonymous: {
    limit: 10,
    window: 60 // 10 requests per minute
  },
  authenticated: {
    limit: 100,
    window: 60 // 100 requests per minute
  },
  premium: {
    limit: 1000,
    window: 60 // 1000 requests per minute
  }
};
```

### API Documentation

Full API documentation available at:
- **Swagger UI**: https://your-domain.com/api/docs
- **Postman Collection**: https://your-domain.com/api/postman.json

---

## Scheduled Jobs & Maintenance

### Cron Jobs

Scheduled tasks configured in `packages/convex/cron.config.ts`:

```typescript
export default {
  // Daily cleanup of orphaned files
  cleanupOrphanedFiles: {
    schedule: "0 2 * * *", // 2 AM daily
    handler: async (ctx) => {
      // Cleanup logic
    }
  },
  
  // Weekly budget alert check
  checkBudgetAlerts: {
    schedule: "0 9 * * 1", // 9 AM every Monday
    handler: async (ctx) => {
      // Check for budgets >80% utilized
      // Send alert emails
    }
  },
  
  // Monthly report generation
  generateMonthlyReports: {
    schedule: "0 8 1 * *", // 8 AM on 1st of month
    handler: async (ctx) => {
      // Generate and email monthly reports
    }
  },
  
  // Archive old audit logs
  archiveAuditLogs: {
    schedule: "0 3 1 * *", // 3 AM on 1st of month
    handler: async (ctx) => {
      // Archive logs older than 2 years
    }
  }
};
```

### Maintenance Windows

Schedule maintenance during low-usage periods:

**Recommended Window**: Sunday 2:00 AM - 4:00 AM (local time)

**Maintenance Tasks**:
1. Database optimization
2. Index rebuilding
3. Cache clearing
4. Log archiving
5. Backup verification

**Notification**:
- Email users 48 hours in advance
- Display banner on application 24 hours before
- Send reminder 1 hour before

### System Updates

#### Application Updates

```bash
# 1. Create backup
npx convex export --output pre-update-backup.json

# 2. Pull latest code
git pull origin main

# 3. Install dependencies
pnpm install

# 4. Run migrations
npx convex run functions/migrations:runPendingMigrations

# 5. Build and deploy
pnpm build
vercel --prod

# 6. Verify deployment
curl https://your-domain.com/api/health

# 7. Monitor for errors
vercel logs --follow
```

#### Dependency Updates

```bash
# Check for updates
pnpm outdated

# Update non-breaking changes
pnpm update

# Update major versions (test thoroughly!)
pnpm add package-name@latest

# Run tests
pnpm test

# Deploy
vercel --prod
```

---

## Conclusion

This guide covers the essential administrative tasks for managing NPD Tracker. For additional support or questions, please contact the technical support team.

**Document Version**: 1.0  
**Last Updated**: November 2025  
**Next Review**: February 2026

