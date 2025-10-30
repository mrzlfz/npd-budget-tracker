# API Documentation - NPD Tracker

## Overview

NPD Tracker uses Convex as the backend database and real-time synchronization layer. This document provides comprehensive API documentation for all available functions.

## Base URL

```
https://<your-convex-deployment>.convex.cloud
```

## Authentication

All API calls require authentication through Clerk. The user context is automatically passed to Convex functions.

## Data Types

### Core Types

```typescript
type Id<"table"> = string; // Convex ID
type OrganizationId = Id<"organizations">;
type UserId = Id<"users">;
type NpdId = Id<"npdDocuments">;
type RkaId = Id<"rkaDocuments">;
```

### Status Enumerations

```typescript
type NpdStatus = "draft" | "diajukan" | "diverifikasi" | "final" | "ditolak";
type RkaStatus = "draft" | "diajukan" | "disetujui" | "ditolak";
type Sp2dStatus = "draft" | "diajukan" | "diverifikasi" | "selesai";
type UserRole = "admin" | "pptk" | "bendahara" | "verifikator" | "viewer";
```

## API Endpoints

### Organizations

#### Get Current Organization

```typescript
query: api.organizations.getCurrent
args: {}
returns: {
  _id: OrganizationId;
  name: string;
  description?: string;
  clerkOrganizationId: string;
  pdfTemplateConfig?: PdfTemplateConfig;
  createdAt: number;
  updatedAt: number;
}
```

#### Get Organization by ID

```typescript
query: api.organizations.getById
args: { id: OrganizationId }
returns: Organization
```

#### Get Organization Users

```typescript
query: api.organizations.getUsers
args: { organizationId: OrganizationId }
returns: User[]
```

#### Get Organization Stats

```typescript
query: api.organizations.getStats
args: { organizationId: OrganizationId; fiscalYear?: number }
returns: {
  totalUsers: number;
  totalNpd: number;
  totalRka: number;
  totalPagu: number;
  totalRealisasi: number;
}
```

### Users

#### Get Current User

```typescript
query: api.users.me
args: {}
returns: {
  _id: UserId;
  clerkUserId: string;
  email: string;
  name?: string;
  organizationId: OrganizationId;
  role: UserRole;
  createdAt: number;
  updatedAt: number;
}
```

#### List Users

```typescript
query: api.users.list
args: { 
  organizationId: OrganizationId;
  role?: UserRole;
  search?: string;
}
returns: User[]
```

### NPD Documents

#### List NPD Documents

```typescript
query: api.npd.list
args: {
  organizationId: OrganizationId;
  tahun?: number;
  status?: NpdStatus;
  createdBy?: UserId;
  search?: string;
}
returns: NpdDocument[]
```

#### Get NPD Summary

```typescript
query: api.npd.getSummary
args: {
  organizationId: OrganizationId;
  tahun?: number;
}
returns: {
  total: number;
  byStatus: Record<NpdStatus, number>;
  totalNilai: number;
  rataRata: number;
}
```

#### Get NPD by ID

```typescript
query: api.npd.getById
args: { id: NpdId }
returns: NpdDocument
```

#### Get NPD with Lines

```typescript
query: api.npd.getNPDWithLines
args: { npdId: NpdId }
returns: NpdDocument & { lines: NpdLine[] }
```

#### Get NPDs for Verification

```typescript
query: api.npd.getNPDsForVerification
args: {
  organizationId: OrganizationId;
  tahun?: number;
  paginationOpts?: PaginationOptions;
}
returns: PaginatedResult<NpdDocument>
```

#### Get NPDs for Approval

```typescript
query: api.npd.getNPDsForApproval
args: {
  organizationId: OrganizationId;
  tahun?: number;
  paginationOpts?: PaginationOptions;
}
returns: PaginatedResult<NpdDocument>
```

#### Create NPD Document

```typescript
mutation: api.npd.create
args: {
  nomor: string;
  tanggal: string; // ISO date string
  tahun: number;
  keperluan: string;
  nilai: number;
  rkaId?: RkaId;
  lines?: Array<{
    uraian: string;
    volume: number;
    satuan: string;
    hargaSatuan: number;
    jumlah: number;
  }>;
  fileIds?: Id<"files">[];
}
returns: NpdId
```

#### Update NPD Document

```typescript
mutation: api.npd.update
args: {
  id: NpdId;
  updates: Partial<NpdDocument>;
}
returns: NpdId
```

#### Submit NPD for Verification

```typescript
mutation: api.npd.submit
args: { npdId: NpdId }
returns: NpdId
```

#### Verify NPD

```typescript
mutation: api.npd.verify
args: {
  npdId: NpdId;
  approved: boolean;
  catatan?: string;
}
returns: NpdId
```

#### Approve NPD

```typescript
mutation: api.npd.approve
args: {
  npdId: NpdId;
  approved: boolean;
  catatan?: string;
}
returns: NpdId
```

### RKA Documents

#### List RKA Documents

```typescript
query: api.rka.list
args: {
  organizationId: OrganizationId;
  tahun?: number;
  status?: RkaStatus;
  search?: string;
}
returns: RkaDocument[]
```

#### Search and Filter RKA

```typescript
query: api.rka.searchAndFilter
args: {
  filters?: {
    searchQuery?: string;
    status?: RkaStatus;
    fiscalYear?: string;
    createdBy?: UserId;
  };
  pagination: {
    page: number;
    limit: number;
  };
}
returns: {
  documents: RkaDocument[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}
```

#### Get Fiscal Years

```typescript
query: api.rka.getFiscalYears
args: {}
returns: string[]
```

#### Get RKA by ID

```typescript
query: api.rka.getById
args: { id: RkaId }
returns: RkaDocument
```

### RKA Accounts

#### List RKA Accounts

```typescript
query: api.rkaAccounts.list
args: {
  organizationId: OrganizationId;
  tahun?: number;
}
returns: RkaAccount[]
```

#### Get RKA Accounts Summary

```typescript
query: api.rkaAccounts.getSummary
args: {
  organizationId: OrganizationId;
  tahun?: number;
}
returns: {
  totalAccounts: number;
  totalPagu: number;
  totalRealisasi: number;
  utilizationRate: number;
}
```

#### Get Accounts by Fiscal Year

```typescript
query: api.rkaAccounts.getByFiscalYear
args: {
  organizationId: OrganizationId;
  tahun: number;
}
returns: RkaAccount[]
```

### SP2D Documents

#### List SP2D Documents

```typescript
query: api.sp2d.list
args: {
  organizationId: OrganizationId;
  tahun?: number;
  status?: Sp2dStatus;
  search?: string;
}
returns: Sp2dDocument[]
```

#### Get SP2D by NPD

```typescript
query: api.sp2d.getByNPD
args: { npdId: NpdId }
returns: Sp2dDocument[]
```

#### Create SP2D

```typescript
mutation: api.sp2d.create
args: {
  npdId: NpdId;
  nomor: string;
  tanggal: string; // ISO date string
  bankName: string;
  accountNumber: string;
  accountName: string;
  nilai: number;
  buktiFileId?: Id<"files">[];
}
returns: Sp2dId
```

### Files

#### Get Files by NPD

```typescript
query: api.files.getByNpd
args: { npdId: NpdId }
returns: File[]
```

#### Get Download URL

```typescript
query: api.files.getDownloadUrl
args: { fileId: Id<"files"> }
returns: { url: string; expiresAt: number }
```

#### Upload File URL

```typescript
mutation: api.files.uploadUrl
args: {
  filename: string;
  fileType: string;
  fileSize: number;
  npdId?: NpdId;
  rkaId?: RkaId;
}
returns: {
  fileId: Id<"files">;
  uploadUrl: string;
}
```

#### Confirm Upload

```typescript
mutation: api.files.confirmUpload
args: { fileId: Id<"files"> }
returns: void
```

### Performance

#### Get Performance by Subkegiatan

```typescript
query: api.performance.getBySubkegiatan
args: {
  organizationId: OrganizationId;
  tahun: number;
  subkegiatanId: string;
}
returns: PerformanceRecord[]
```

#### Get Performance with Details

```typescript
query: api.performance.getWithDetails
args: {
  organizationId: OrganizationId;
  tahun?: number;
  subkegiatanId?: string;
}
returns: Array<PerformanceRecord & {
  subkegiatan: RkaSubkegiatan;
  kegiatan: RkaKegiatan;
  program: RkaProgram;
}>
```

### Notifications

#### Subscribe to Notifications

```typescript
query: api.notifications.subscribe
args: {}
returns: Notification[]
```

#### Get Unread Count

```typescript
query: api.notifications.unreadCount
args: {}
returns: number
```

#### Get User Notifications

```typescript
query: api.notifications.getUserNotifications
args: {
  organizationId: OrganizationId;
  limit?: number;
}
returns: Notification[]
```

### Activity Logs

#### List Activity Logs

```typescript
query: api.activityLogs.list
args: {
  organizationId: OrganizationId;
  limit?: number;
}
returns: ActivityLog[]
```

#### Get by Entity

```typescript
query: api.activityLogs.getByEntity
args: {
  entityType: string;
  entityId: string;
  organizationId: OrganizationId;
}
returns: ActivityLog[]
```

#### Get by User

```typescript
query: api.activityLogs.getByUser
args: {
  userId: UserId;
  organizationId: OrganizationId;
}
returns: ActivityLog[]
```

### Reports

#### Get Realisasi Report

```typescript
query: api.reports.realisasi
args: {
  organizationId: OrganizationId;
  tahun: number;
  bulan?: number;
  format?: 'json' | 'csv';
}
returns: RealisasiReportData
```

#### Get Performance Report

```typescript
query: api.reports.performance
args: {
  organizationId: OrganizationId;
  tahun: number;
  bulan?: number;
}
returns: PerformanceReportData
```

#### Get NPD Summary Report

```typescript
query: api.reports.npdSummary
args: {
  organizationId: OrganizationId;
  tahun?: number;
  status?: NpdStatus;
}
returns: NpdSummaryReport
```

## Error Handling

All API functions can throw errors with the following structure:

```typescript
interface ConvexError {
  message: string;
  data?: any;
  code?: string;
}
```

Common error codes:
- `UNAUTHORIZED`: User lacks permission
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid input data
- `CONFLICT`: Resource conflict

## Real-time Updates

Convex automatically provides real-time updates when data changes. Use the `useQuery` hook to subscribe to real-time data:

```typescript
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

// This will automatically update when data changes
const data = useQuery(api.npd.list, { organizationId: 'org123' });
```

## Pagination

For large datasets, use the pagination options:

```typescript
interface PaginationOptions {
  numItems?: number;
  cursor?: string;
  page?: number;
}

interface PaginatedResult<T> {
  page: number;
  items: T[];
  isDone: boolean;
  continueCursor?: string;
}
```

## Rate Limiting

Convex has built-in rate limiting. Be mindful of:
- Maximum 1000 requests per second per deployment
- Maximum 100ms query execution time
- Maximum 1MB response size

## Best Practices

1. **Use Filters**: Always filter by `organizationId` for multi-tenant data isolation
2. **Batch Operations**: Use pagination for large datasets
3. **Error Handling**: Always wrap API calls in try-catch blocks
4. **Type Safety**: Use TypeScript types from generated API
5. **Real-time**: Leverage Convex's real-time capabilities instead of manual polling

---

*Version 1.0 - Last Updated: October 30, 2024*
