# NPD Tracker - API Documentation

**Version:** 1.0  
**Last Updated:** November 2025  
**Base URL:** `https://your-domain.com`

---

## Table of Contents

1. [Introduction](#introduction)
2. [Authentication](#authentication)
3. [Convex API](#convex-api)
4. [REST API Endpoints](#rest-api-endpoints)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)
7. [Webhooks](#webhooks)
8. [Data Models](#data-models)
9. [Code Examples](#code-examples)

---

## Introduction

NPD Tracker provides two types of APIs:

1. **Convex API**: Real-time queries and mutations for frontend integration
2. **REST API**: HTTP endpoints for external integrations and file operations

### API Principles

- **RESTful Design**: Standard HTTP methods (GET, POST, PUT, DELETE)
- **JSON Format**: All requests and responses use JSON
- **Authentication**: JWT tokens via Clerk
- **Real-time**: Convex provides automatic real-time updates
- **Versioning**: API versioned at `/api/v1/`

---

## Authentication

### Clerk Authentication

NPD Tracker uses Clerk for authentication. All API requests require a valid JWT token.

#### Getting an Auth Token

```typescript
// Frontend (React)
import { useAuth } from "@clerk/nextjs";

function MyComponent() {
  const { getToken } = useAuth();
  
  const callAPI = async () => {
    const token = await getToken();
    const response = await fetch('/api/v1/npd', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  };
}
```

#### Token Format

```
Authorization: Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Token Expiration

- **Access Token**: Expires after 1 hour
- **Refresh Token**: Automatically handled by Clerk
- **Session**: Expires after 7 days of inactivity

---

## Convex API

### Overview

Convex provides type-safe, real-time queries and mutations. All Convex functions are located in `packages/convex/functions/`.

### Using Convex API

```typescript
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Query (read data)
const npds = useQuery(api.npd.list, { status: "Final" });

// Mutation (write data)
const createNPD = useMutation(api.npd.create);
await createNPD({ maksud: "...", subkegiatanId: "..." });
```

### NPD Endpoints

#### `npd.list`

List NPDs with optional filters.

**Type:** Query  
**Permission:** Read NPD

```typescript
// Request
api.npd.list({
  status?: "Draft" | "Diajukan" | "Diverifikasi" | "Final" | "Ditolak",
  subkegiatanId?: Id<"rkaSubkegiatans">,
  fiscalYear?: number
})

// Response
Array<{
  _id: Id<"npdDocuments">,
  nomorNPD: string,
  tanggalNPD: number,
  maksud: string,
  status: string,
  nilaiTotal: number,
  // ... other fields
}>
```

#### `npd.get`

Get single NPD by ID.

**Type:** Query  
**Permission:** Read NPD

```typescript
// Request
api.npd.get({ id: Id<"npdDocuments"> })

// Response
{
  _id: Id<"npdDocuments">,
  nomorNPD: string,
  tanggalNPD: number,
  maksud: string,
  jenisNPD: "UP" | "GU" | "TU" | "LS",
  status: string,
  nilaiTotal: number,
  subkegiatanId: Id<"rkaSubkegiatans">,
  organizationId: Id<"organizations">,
  createdBy: Id<"users">,
  createdAt: number,
  updatedAt: number
}
```

#### `npd.getNPDWithLines`

Get NPD with all line items.

**Type:** Query  
**Permission:** Read NPD

```typescript
// Request
api.npd.getNPDWithLines({ npdId: Id<"npdDocuments"> })

// Response
{
  npd: { /* NPD object */ },
  lines: Array<{
    _id: Id<"npdLines">,
    accountId: Id<"rkaAccounts">,
    kodeRekening: string,
    namaRekening: string,
    nilaiUsulan: number,
    nilaiDisetujui: number
  }>,
  subkegiatan: { /* subkegiatan object */ },
  organization: { /* organization object */ }
}
```

#### `npd.create`

Create new NPD.

**Type:** Mutation  
**Permission:** Create NPD

```typescript
// Request
api.npd.create({
  maksud: string,
  subkegiatanId: Id<"rkaSubkegiatans">,
  jenisNPD: "UP" | "GU" | "TU" | "LS",
  lines: Array<{
    accountId: Id<"rkaAccounts">,
    nilaiUsulan: number
  }>
})

// Response
Id<"npdDocuments"> // ID of created NPD
```

#### `npd.update`

Update existing NPD (Draft only).

**Type:** Mutation  
**Permission:** Update NPD

```typescript
// Request
api.npd.update({
  npdId: Id<"npdDocuments">,
  maksud?: string,
  lines?: Array<{
    accountId: Id<"rkaAccounts">,
    nilaiUsulan: number
  }>
})

// Response
Id<"npdDocuments"> // ID of updated NPD
```

#### `npd.submit`

Submit NPD for verification.

**Type:** Mutation  
**Permission:** Submit NPD

```typescript
// Request
api.npd.submit({ npdId: Id<"npdDocuments"> })

// Response
{ success: true }
```

#### `npd.verify`

Verify NPD (Verifikator/Bendahara only).

**Type:** Mutation  
**Permission:** Verify NPD

```typescript
// Request
api.npd.verify({
  npdId: Id<"npdDocuments">,
  checklistData: {
    kelengkapanDokumen: boolean,
    kesesuaianAnggaran: boolean,
    validasiRekening: boolean,
    // ... other checklist items
  },
  catatanVerifikasi?: string
})

// Response
{ success: true }
```

#### `npd.finalize`

Finalize NPD (Bendahara only).

**Type:** Mutation  
**Permission:** Finalize NPD

```typescript
// Request
api.npd.finalize({
  npdId: Id<"npdDocuments">,
  nomorSPD?: string,
  tanggalSPD?: number
})

// Response
{ success: true }
```

#### `npd.reject`

Reject NPD with reason.

**Type:** Mutation  
**Permission:** Verify NPD

```typescript
// Request
api.npd.reject({
  npdId: Id<"npdDocuments">,
  alasanPenolakan: string
})

// Response
{ success: true }
```

---

### SP2D Endpoints

#### `sp2d.list`

List SP2D records.

**Type:** Query  
**Permission:** Read SP2D

```typescript
// Request
api.sp2d.list({
  npdId?: Id<"npdDocuments">,
  startDate?: number,
  endDate?: number
})

// Response
Array<{
  _id: Id<"sp2dRefs">,
  npdId: Id<"npdDocuments">,
  noSPM: string,
  noSP2D: string,
  tglSP2D: number,
  nilaiCair: number,
  catatan?: string,
  deletedAt?: number
}>
```

#### `sp2d.get`

Get single SP2D by ID.

**Type:** Query  
**Permission:** Read SP2D

```typescript
// Request
api.sp2d.get({ id: Id<"sp2dRefs"> })

// Response
{
  _id: Id<"sp2dRefs">,
  npdId: Id<"npdDocuments">,
  noSPM: string,
  noSP2D: string,
  tglSP2D: number,
  nilaiCair: number,
  catatan?: string,
  organizationId: Id<"organizations">,
  createdBy: Id<"users">,
  createdAt: number,
  updatedAt: number
}
```

#### `sp2d.getWithDistribution`

Get SP2D with realization distribution.

**Type:** Query  
**Permission:** Read SP2D

```typescript
// Request
api.sp2d.getWithDistribution({ sp2dId: Id<"sp2dRefs"> })

// Response
{
  sp2d: { /* SP2D object */ },
  npd: { /* NPD object */ },
  realizations: Array<{
    _id: Id<"realizations">,
    accountId: Id<"rkaAccounts">,
    kodeRekening: string,
    namaRekening: string,
    nilaiRealisasi: number,
    persentase: number
  }>
}
```

#### `sp2d.create`

Create new SP2D and distribute to realizations.

**Type:** Mutation  
**Permission:** Create SP2D

```typescript
// Request
api.sp2d.create({
  npdId: Id<"npdDocuments">,
  noSPM?: string,
  noSP2D: string,
  tglSP2D: number, // timestamp
  nilaiCair: number,
  catatan?: string
})

// Response
Id<"sp2dRefs"> // ID of created SP2D
```

#### `sp2d.update`

Update existing SP2D and recalculate realizations.

**Type:** Mutation  
**Permission:** Update SP2D

```typescript
// Request
api.sp2d.update({
  sp2dId: Id<"sp2dRefs">,
  noSPM?: string,
  noSP2D?: string,
  tglSP2D?: number,
  nilaiCair?: number,
  catatan?: string
})

// Response
{ success: true }
```

#### `sp2d.softDelete`

Soft delete SP2D and revert realizations.

**Type:** Mutation  
**Permission:** Delete SP2D

```typescript
// Request
api.sp2d.softDelete({ sp2dId: Id<"sp2dRefs"> })

// Response
{ success: true }
```

#### `sp2d.restore`

Restore soft-deleted SP2D.

**Type:** Mutation  
**Permission:** Delete SP2D

```typescript
// Request
api.sp2d.restore({ sp2dId: Id<"sp2dRefs"> })

// Response
{ success: true }
```

---

### RKA Endpoints

#### `rka.getPrograms`

Get all RKA programs.

**Type:** Query  
**Permission:** Read RKA

```typescript
// Request
api.rka.getPrograms({ fiscalYear?: number })

// Response
Array<{
  _id: Id<"rkaPrograms">,
  kodeProgram: string,
  namaProgram: string,
  totalPagu: number,
  totalRealisasi: number,
  persentaseRealisasi: number
}>
```

#### `rka.getKegiatans`

Get activities for a program.

**Type:** Query  
**Permission:** Read RKA

```typescript
// Request
api.rka.getKegiatans({ programId: Id<"rkaPrograms"> })

// Response
Array<{
  _id: Id<"rkaKegiatans">,
  kodeKegiatan: string,
  namaKegiatan: string,
  totalPagu: number,
  totalRealisasi: number
}>
```

#### `rka.getSubkegiatans`

Get sub-activities for an activity.

**Type:** Query  
**Permission:** Read RKA

```typescript
// Request
api.rka.getSubkegiatans({ kegiatanId: Id<"rkaKegiatans"> })

// Response
Array<{
  _id: Id<"rkaSubkegiatans">,
  kodeSubkegiatan: string,
  namaSubkegiatan: string,
  totalPagu: number,
  totalRealisasi: number
}>
```

#### `rka.getAccounts`

Get accounts for a sub-activity.

**Type:** Query  
**Permission:** Read RKA

```typescript
// Request
api.rka.getAccounts({ subkegiatanId: Id<"rkaSubkegiatans"> })

// Response
Array<{
  _id: Id<"rkaAccounts">,
  kodeRekening: string,
  namaRekening: string,
  pagu: number,
  realisasiTahun: number,
  sisaPagu: number,
  persentaseRealisasi: number
}>
```

#### `rka.importCSV`

Import RKA data from CSV.

**Type:** Mutation  
**Permission:** Import RKA

```typescript
// Request
api.rka.importCSV({
  csvData: string, // CSV content
  fiscalYear: number
})

// Response
{
  success: true,
  imported: {
    programs: number,
    kegiatans: number,
    subkegiatans: number,
    accounts: number
  },
  errors: Array<string>
}
```

---

### Performance Endpoints

#### `performance.list`

List performance logs.

**Type:** Query  
**Permission:** Read Performance

```typescript
// Request
api.performance.list({
  subkegiatanId?: Id<"rkaSubkegiatans">,
  status?: "pending" | "approved" | "rejected",
  periode?: string
})

// Response
Array<{
  _id: Id<"performanceLogs">,
  indikatorNama: string,
  target: number,
  realisasi: number,
  persentaseCapaian: number,
  satuan: string,
  periode: string,
  status: string
}>
```

#### `performance.create`

Create performance log.

**Type:** Mutation  
**Permission:** Create Performance

```typescript
// Request
api.performance.create({
  subkegiatanId: Id<"rkaSubkegiatans">,
  indikatorNama: string,
  target: number,
  realisasi: number,
  satuan: string,
  periode: string,
  buktiURL?: string,
  keterangan?: string
})

// Response
Id<"performanceLogs">
```

#### `performance.approve`

Approve performance log.

**Type:** Mutation  
**Permission:** Approve Performance

```typescript
// Request
api.performance.approve({
  performanceLogId: Id<"performanceLogs">,
  approvalNotes?: string
})

// Response
{ success: true }
```

#### `performance.reject`

Reject performance log.

**Type:** Mutation  
**Permission:** Approve Performance

```typescript
// Request
api.performance.reject({
  performanceLogId: Id<"performanceLogs">,
  rejectionReason: string
})

// Response
{ success: true }
```

#### `performance.getTrends`

Get performance trends over time.

**Type:** Query  
**Permission:** Read Performance

```typescript
// Request
api.performance.getTrends({
  subkegiatanId: Id<"rkaSubkegiatans">,
  startDate: number,
  endDate: number
})

// Response
Array<{
  periode: string,
  averageCapaian: number,
  totalIndicators: number,
  approvedIndicators: number
}>
```

---

### File Endpoints

#### `files.upload`

Upload file to Convex storage.

**Type:** Mutation  
**Permission:** Upload File

```typescript
// Request
api.files.upload({
  npdId: Id<"npdDocuments">,
  jenis: "RAB" | "BAST" | "Kontrak" | "Kwitansi" | "Other",
  namaFile: string,
  tipeMime: string,
  ukuran: number
})

// Response
{
  storageId: string, // Upload URL
  attachmentId: Id<"attachments">
}
```

#### `files.confirmUpload`

Confirm file upload and calculate checksum.

**Type:** Mutation  
**Permission:** Upload File

```typescript
// Request
api.files.confirmUpload({
  attachmentId: Id<"attachments">,
  storageId: string
})

// Response
{ success: true }
```

#### `files.getByNpd`

Get all files for an NPD.

**Type:** Query  
**Permission:** Read File

```typescript
// Request
api.files.getByNpd({ npdId: Id<"npdDocuments"> })

// Response
Array<{
  _id: Id<"attachments">,
  jenis: string,
  namaFile: string,
  url: string,
  ukuran: number,
  tipeMime: string,
  checksum: string,
  uploadedAt: number
}>
```

#### `files.getDownloadUrl`

Get signed download URL for file.

**Type:** Query  
**Permission:** Download File

```typescript
// Request
api.files.getDownloadUrl({ attachmentId: Id<"attachments"> })

// Response
{
  url: string, // Signed URL (expires in 1 hour)
  checksum: string,
  expiresAt: number
}
```

#### `files.remove`

Delete file (soft delete).

**Type:** Mutation  
**Permission:** Delete File

```typescript
// Request
api.files.remove({ attachmentId: Id<"attachments"> })

// Response
{ success: true }
```

---

### User & Organization Endpoints

#### `users.list`

List users in organization.

**Type:** Query  
**Permission:** Read User

```typescript
// Request
api.users.list({ role?: string })

// Response
Array<{
  _id: Id<"users">,
  clerkUserId: string,
  name: string,
  email: string,
  role: string,
  nip?: string,
  phone?: string,
  isActive: boolean
}>
```

#### `users.get`

Get user by ID.

**Type:** Query  
**Permission:** Read User

```typescript
// Request
api.users.get({ id: Id<"users"> })

// Response
{
  _id: Id<"users">,
  clerkUserId: string,
  name: string,
  email: string,
  role: string,
  organizationId: Id<"organizations">,
  // ... other fields
}
```

#### `organizations.get`

Get organization by ID.

**Type:** Query  
**Permission:** Read Organization

```typescript
// Request
api.organizations.get({ id: Id<"organizations"> })

// Response
{
  _id: Id<"organizations">,
  nama: string,
  kode: string,
  alamat: string,
  telepon: string,
  email: string,
  logoUrl?: string
}
```

---

### Audit Log Endpoints

#### `auditLogs.list`

List audit logs with filters.

**Type:** Query  
**Permission:** Read Audit Log

```typescript
// Request
api.auditLogs.list({
  action?: string,
  entityTable?: string,
  actorUserId?: Id<"users">,
  startDate?: number,
  endDate?: number,
  limit?: number
})

// Response
Array<{
  _id: Id<"auditLogs">,
  action: string,
  entityTable: string,
  entityId: string,
  actorUserId: Id<"users">,
  entityData?: any,
  createdAt: number
}>
```

#### `auditLogs.getByEntity`

Get audit logs for specific entity.

**Type:** Query  
**Permission:** Read Audit Log

```typescript
// Request
api.auditLogs.getByEntity({
  entityTable: string,
  entityId: string
})

// Response
Array<{
  _id: Id<"auditLogs">,
  action: string,
  actorUserId: Id<"users">,
  actorName: string,
  entityData?: any,
  createdAt: number
}>
```

---

## REST API Endpoints

### PDF Generation

#### Generate NPD PDF

**Endpoint:** `POST /api/v1/pdf/npd`  
**Permission:** Read NPD

```bash
curl -X POST https://your-domain.com/api/v1/pdf/npd \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "npdId": "npd_123456"
  }'
```

**Response:**

```json
{
  "success": true,
  "pdfUrl": "https://storage.convex.com/...",
  "filename": "NPD_001_2025.pdf",
  "size": 245678
}
```

#### Generate SP2D PDF

**Endpoint:** `POST /api/v1/pdf/sp2d`  
**Permission:** Read SP2D

```bash
curl -X POST https://your-domain.com/api/v1/pdf/sp2d \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sp2dId": "sp2d_123456"
  }'
```

**Response:**

```json
{
  "success": true,
  "pdfUrl": "https://storage.convex.com/...",
  "filename": "SP2D_001_2025.pdf",
  "size": 189234
}
```

#### Generate Quarterly Report PDF

**Endpoint:** `POST /api/v1/pdf/quarterly-report`  
**Permission:** Read Report

```bash
curl -X POST https://your-domain.com/api/v1/pdf/quarterly-report \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "quarter": "TW1",
    "fiscalYear": 2025
  }'
```

**Response:**

```json
{
  "success": true,
  "pdfUrl": "https://storage.convex.com/...",
  "filename": "Quarterly_Report_TW1_2025.pdf",
  "size": 512345
}
```

---

### Export Endpoints

#### Export NPD List to CSV

**Endpoint:** `GET /api/v1/export/npd/csv`  
**Permission:** Read NPD

```bash
curl -X GET "https://your-domain.com/api/v1/export/npd/csv?status=Final&fiscalYear=2025" \
  -H "Authorization: Bearer $TOKEN" \
  -o npd_export.csv
```

**Response:** CSV file download

#### Export NPD List to Excel

**Endpoint:** `GET /api/v1/export/npd/excel`  
**Permission:** Read NPD

```bash
curl -X GET "https://your-domain.com/api/v1/export/npd/excel?status=Final&fiscalYear=2025" \
  -H "Authorization: Bearer $TOKEN" \
  -o npd_export.xlsx
```

**Response:** Excel file download

#### Export SP2D History to CSV

**Endpoint:** `GET /api/v1/export/sp2d/csv`  
**Permission:** Read SP2D

```bash
curl -X GET "https://your-domain.com/api/v1/export/sp2d/csv?startDate=2025-01-01&endDate=2025-12-31" \
  -H "Authorization: Bearer $TOKEN" \
  -o sp2d_export.csv
```

**Response:** CSV file download

#### Export RKA to Excel

**Endpoint:** `GET /api/v1/export/rka/excel`  
**Permission:** Read RKA

```bash
curl -X GET "https://your-domain.com/api/v1/export/rka/excel?fiscalYear=2025" \
  -H "Authorization: Bearer $TOKEN" \
  -o rka_export.xlsx
```

**Response:** Excel file download with multiple sheets

---

### Email Endpoints

#### Send Email Notification

**Endpoint:** `POST /api/v1/email/send`  
**Permission:** Admin only

```bash
curl -X POST https://your-domain.com/api/v1/email/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["user@example.com"],
    "subject": "NPD Submitted",
    "template": "NPDSubmitted",
    "props": {
      "npdNumber": "NPD-001/2025",
      "submittedBy": "John Doe"
    }
  }'
```

**Response:**

```json
{
  "success": true,
  "messageId": "msg_123456",
  "recipients": ["user@example.com"]
}
```

---

### Health Check

#### Check API Health

**Endpoint:** `GET /api/health`  
**Permission:** Public

```bash
curl -X GET https://your-domain.com/api/health
```

**Response:**

```json
{
  "status": "healthy",
  "version": "1.0.0",
  "timestamp": 1730419200000,
  "services": {
    "database": "connected",
    "storage": "connected",
    "email": "connected"
  }
}
```

---

## Error Handling

### Error Response Format

All errors follow a consistent format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    }
  }
}
```

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request succeeded |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource already exists or conflict |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Common Error Codes

#### Authentication Errors

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

```json
{
  "error": {
    "code": "INVALID_TOKEN",
    "message": "Invalid or expired authentication token"
  }
}
```

#### Permission Errors

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You don't have permission to perform this action"
  }
}
```

#### Validation Errors

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "nilaiUsulan": "Amount exceeds available budget",
      "maksud": "Purpose is required"
    }
  }
}
```

#### Resource Errors

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "NPD not found",
    "details": {
      "npdId": "npd_123456"
    }
  }
}
```

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "NPD number already exists",
    "details": {
      "nomorNPD": "NPD-001/2025"
    }
  }
}
```

#### Business Logic Errors

```json
{
  "error": {
    "code": "INVALID_STATUS",
    "message": "Cannot submit NPD in current status",
    "details": {
      "currentStatus": "Final",
      "requiredStatus": "Draft"
    }
  }
}
```

```json
{
  "error": {
    "code": "BUDGET_EXCEEDED",
    "message": "SP2D amount exceeds NPD total",
    "details": {
      "sp2dAmount": 100000000,
      "npdTotal": 75000000
    }
  }
}
```

---

## Rate Limiting

### Rate Limit Headers

All API responses include rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1730419800
```

### Rate Limits by Endpoint

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| Queries (Read) | 1000 requests | 1 hour |
| Mutations (Write) | 100 requests | 1 hour |
| File Upload | 50 uploads | 1 hour |
| File Download | 200 downloads | 1 hour |
| PDF Generation | 50 requests | 1 hour |
| Email Sending | 100 emails | 1 hour |

### Rate Limit Exceeded Response

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "limit": 100,
      "window": "1 hour",
      "retryAfter": 3600
    }
  }
}
```

**HTTP Status:** 429 Too Many Requests

---

## Webhooks

### Clerk Webhooks

NPD Tracker receives webhooks from Clerk for user and organization events.

#### Webhook Endpoint

```
POST /api/webhooks/clerk
```

#### Webhook Events

| Event | Description |
|-------|-------------|
| `user.created` | New user registered |
| `user.updated` | User profile updated |
| `user.deleted` | User account deleted |
| `organization.created` | New organization created |
| `organization.updated` | Organization details updated |
| `organization.deleted` | Organization deleted |

#### Webhook Payload Example

```json
{
  "type": "user.created",
  "data": {
    "id": "user_123456",
    "email_addresses": [
      {
        "email_address": "user@example.com"
      }
    ],
    "first_name": "John",
    "last_name": "Doe",
    "public_metadata": {
      "role": "pptk"
    }
  }
}
```

#### Webhook Verification

Webhooks are verified using Clerk's webhook signature:

```typescript
import { Webhook } from "svix";

const webhook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);
const payload = webhook.verify(body, headers);
```

---

## Data Models

### NPD Document

```typescript
interface NPDDocument {
  _id: Id<"npdDocuments">;
  nomorNPD: string; // e.g., "NPD-001/2025"
  tanggalNPD: number; // timestamp
  maksud: string; // Purpose/description
  jenisNPD: "UP" | "GU" | "TU" | "LS"; // Type
  status: "Draft" | "Diajukan" | "Diverifikasi" | "Final" | "Ditolak";
  nilaiTotal: number; // Total amount
  subkegiatanId: Id<"rkaSubkegiatans">;
  organizationId: Id<"organizations">;
  createdBy: Id<"users">;
  createdAt: number;
  updatedAt: number;
  
  // Optional fields
  nomorSPD?: string;
  tanggalSPD?: number;
  alasanPenolakan?: string;
  catatanVerifikasi?: string;
}
```

### NPD Line

```typescript
interface NPDLine {
  _id: Id<"npdLines">;
  npdId: Id<"npdDocuments">;
  accountId: Id<"rkaAccounts">;
  nilaiUsulan: number; // Proposed amount
  nilaiDisetujui: number; // Approved amount
  keterangan?: string; // Notes
  organizationId: Id<"organizations">;
  createdAt: number;
  updatedAt: number;
}
```

### SP2D Reference

```typescript
interface SP2DRef {
  _id: Id<"sp2dRefs">;
  npdId: Id<"npdDocuments">;
  noSPM?: string; // SPM number
  noSP2D: string; // SP2D number (required)
  tglSP2D: number; // SP2D date timestamp
  nilaiCair: number; // Disbursed amount
  catatan?: string; // Notes
  deletedAt?: number; // Soft delete timestamp
  deletedBy?: Id<"users">; // User who deleted
  organizationId: Id<"organizations">;
  createdBy: Id<"users">;
  createdAt: number;
  updatedAt: number;
}
```

### Realization

```typescript
interface Realization {
  _id: Id<"realizations">;
  sp2dId: Id<"sp2dRefs">;
  npdId: Id<"npdDocuments">;
  accountId: Id<"rkaAccounts">;
  nilaiRealisasi: number; // Realization amount
  tanggalRealisasi: number; // Realization date
  organizationId: Id<"organizations">;
  createdAt: number;
  updatedAt: number;
}
```

### RKA Account

```typescript
interface RKAAccount {
  _id: Id<"rkaAccounts">;
  subkegiatanId: Id<"rkaSubkegiatans">;
  kodeRekening: string; // e.g., "5.1.02.01.01.0051"
  namaRekening: string; // Account name
  pagu: number; // Budget allocation
  realisasiTahun: number; // Year-to-date realization
  sisaPagu: number; // Remaining budget
  persentaseRealisasi: number; // Realization percentage
  jenisBelanja: "Pegawai" | "Barang" | "Modal";
  organizationId: Id<"organizations">;
  tahunAnggaran: number; // Fiscal year
  createdAt: number;
  updatedAt: number;
}
```

### Performance Log

```typescript
interface PerformanceLog {
  _id: Id<"performanceLogs">;
  subkegiatanId: Id<"rkaSubkegiatans">;
  indicatorId?: Id<"indicators">;
  indikatorNama: string; // Indicator name
  target: number; // Target value
  realisasi: number; // Actual value
  persentaseCapaian?: number; // Achievement percentage (0-100)
  satuan: string; // Unit of measurement
  periode: string | number; // e.g., "TW1", "TW2"
  buktiURL?: string; // Evidence file URL
  buktiType?: string; // "document", "image", "video"
  keterangan?: string; // Notes
  status: "pending" | "approved" | "rejected";
  approvedBy?: Id<"users">;
  approvedAt?: number;
  approvalNotes?: string;
  rejectedBy?: Id<"users">;
  rejectedAt?: number;
  rejectionReason?: string;
  organizationId: Id<"organizations">;
  createdBy: Id<"users">;
  createdAt: number;
  updatedAt: number;
}
```

### Attachment

```typescript
interface Attachment {
  _id: Id<"attachments">;
  npdId: Id<"npdDocuments">;
  jenis: string; // "RAB", "BAST", "Kontrak", "Kwitansi", "Other"
  namaFile: string; // Original filename
  url: string; // Convex storage ID
  ukuran: number; // File size in bytes
  tipeMime: string; // MIME type
  checksum?: string; // SHA-256 checksum
  status: string; // "uploading", "uploaded", "error"
  keterangan?: string; // Notes
  organizationId: Id<"organizations">;
  uploadedBy: Id<"users">;
  uploadedAt?: number;
  createdAt: number;
  updatedAt: number;
}
```

---

## Code Examples

### JavaScript/TypeScript

#### Create NPD with Lines

```typescript
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function CreateNPDExample() {
  const createNPD = useMutation(api.npd.create);
  
  const handleSubmit = async () => {
    try {
      const npdId = await createNPD({
        maksud: "Pengadaan Alat Tulis Kantor",
        subkegiatanId: "subkegiatan_123" as Id<"rkaSubkegiatans">,
        jenisNPD: "LS",
        lines: [
          {
            accountId: "account_456" as Id<"rkaAccounts">,
            nilaiUsulan: 5000000
          },
          {
            accountId: "account_789" as Id<"rkaAccounts">,
            nilaiUsulan: 3000000
          }
        ]
      });
      
      console.log("NPD created:", npdId);
    } catch (error) {
      console.error("Error creating NPD:", error);
    }
  };
  
  return <button onClick={handleSubmit}>Create NPD</button>;
}
```

#### Query NPD List with Filters

```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

function NPDListExample() {
  const npds = useQuery(api.npd.list, {
    status: "Final",
    fiscalYear: 2025
  });
  
  if (npds === undefined) return <div>Loading...</div>;
  
  return (
    <ul>
      {npds.map(npd => (
        <li key={npd._id}>
          {npd.nomorNPD} - {npd.maksud} - Rp {npd.nilaiTotal.toLocaleString()}
        </li>
      ))}
    </ul>
  );
}
```

#### Create SP2D

```typescript
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function CreateSP2DExample() {
  const createSP2D = useMutation(api.sp2d.create);
  
  const handleSubmit = async () => {
    try {
      const sp2dId = await createSP2D({
        npdId: "npd_123" as Id<"npdDocuments">,
        noSPM: "SPM-001/2025",
        noSP2D: "SP2D-001/2025",
        tglSP2D: Date.now(),
        nilaiCair: 50000000,
        catatan: "Pencairan tahap 1"
      });
      
      console.log("SP2D created:", sp2dId);
    } catch (error) {
      console.error("Error creating SP2D:", error);
    }
  };
  
  return <button onClick={handleSubmit}>Create SP2D</button>;
}
```

#### Upload File

```typescript
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

function FileUploadExample() {
  const uploadFile = useMutation(api.files.upload);
  const confirmUpload = useMutation(api.files.confirmUpload);
  
  const handleFileUpload = async (file: File) => {
    try {
      // Step 1: Initiate upload
      const { storageId, attachmentId } = await uploadFile({
        npdId: "npd_123" as Id<"npdDocuments">,
        jenis: "RAB",
        namaFile: file.name,
        tipeMime: file.type,
        ukuran: file.size
      });
      
      // Step 2: Upload file to Convex storage
      const uploadUrl = await fetch(storageId);
      await fetch(uploadUrl, {
        method: "POST",
        body: file
      });
      
      // Step 3: Confirm upload
      await confirmUpload({ attachmentId, storageId });
      
      console.log("File uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };
  
  return (
    <input
      type="file"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
      }}
    />
  );
}
```

---

### Python

#### Authenticate and Call API

```python
import requests

# Get auth token (implement your own auth flow)
token = "your_jwt_token"

# Call API
response = requests.get(
    "https://your-domain.com/api/v1/npd",
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    },
    params={
        "status": "Final",
        "fiscalYear": 2025
    }
)

if response.status_code == 200:
    npds = response.json()
    for npd in npds:
        print(f"{npd['nomorNPD']} - {npd['maksud']}")
else:
    print(f"Error: {response.status_code} - {response.text}")
```

#### Generate PDF

```python
import requests

token = "your_jwt_token"

response = requests.post(
    "https://your-domain.com/api/v1/pdf/npd",
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    },
    json={
        "npdId": "npd_123456"
    }
)

if response.status_code == 200:
    result = response.json()
    pdf_url = result["pdfUrl"]
    print(f"PDF generated: {pdf_url}")
    
    # Download PDF
    pdf_response = requests.get(pdf_url)
    with open("npd.pdf", "wb") as f:
        f.write(pdf_response.content)
else:
    print(f"Error: {response.status_code} - {response.text}")
```

---

### cURL

#### List NPDs

```bash
curl -X GET "https://your-domain.com/api/v1/npd?status=Final&fiscalYear=2025" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

#### Create NPD

```bash
curl -X POST https://your-domain.com/api/v1/npd \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "maksud": "Pengadaan Alat Tulis Kantor",
    "subkegiatanId": "subkegiatan_123",
    "jenisNPD": "LS",
    "lines": [
      {
        "accountId": "account_456",
        "nilaiUsulan": 5000000
      }
    ]
  }'
```

#### Submit NPD

```bash
curl -X POST https://your-domain.com/api/v1/npd/submit \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "npdId": "npd_123456"
  }'
```

#### Create SP2D

```bash
curl -X POST https://your-domain.com/api/v1/sp2d \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "npdId": "npd_123456",
    "noSPM": "SPM-001/2025",
    "noSP2D": "SP2D-001/2025",
    "tglSP2D": 1730419200000,
    "nilaiCair": 50000000
  }'
```

---

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
try {
  const result = await mutation(args);
  // Handle success
} catch (error) {
  if (error.message.includes("Permission denied")) {
    // Handle permission error
  } else if (error.message.includes("Not found")) {
    // Handle not found error
  } else {
    // Handle general error
  }
}
```

### 2. Rate Limiting

Implement exponential backoff for rate limit errors:

```typescript
async function callAPIWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.code === "RATE_LIMIT_EXCEEDED" && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}
```

### 3. Pagination

For large datasets, use pagination:

```typescript
const fetchAllNPDs = async () => {
  let allNPDs = [];
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const result = await api.npd.listPaginated({
      page,
      pageSize: 100
    });
    
    allNPDs = [...allNPDs, ...result.data];
    hasMore = result.page < result.totalPages;
    page++;
  }
  
  return allNPDs;
};
```

### 4. Real-time Updates

Leverage Convex's real-time capabilities:

```typescript
// Component automatically re-renders when data changes
const npds = useQuery(api.npd.list, { status: "Final" });

// No need for manual polling or websocket setup
```

### 5. Optimistic Updates

Improve UX with optimistic updates:

```typescript
const updateNPD = useMutation(api.npd.update);

const handleUpdate = async (npdId, updates) => {
  // Optimistically update UI
  setLocalNPD({ ...localNPD, ...updates });
  
  try {
    await updateNPD({ npdId, ...updates });
  } catch (error) {
    // Revert on error
    setLocalNPD(originalNPD);
    showError(error.message);
  }
};
```

---

## Support

For API support and questions:

- **Documentation**: https://docs.npd-tracker.com
- **Email**: api-support@npd-tracker.com
- **Community Forum**: https://forum.npd-tracker.com
- **GitHub Issues**: https://github.com/your-org/npd-tracker/issues

---

**Document Version**: 1.0  
**Last Updated**: November 2025  
**Next Review**: February 2026

