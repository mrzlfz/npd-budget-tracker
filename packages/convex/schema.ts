import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Define the schema for our NPD Tracker application
export default defineSchema({
  // Organizations for multi-tenancy
  organizations: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    clerkOrganizationId: v.string(),
    // PDF Template Configuration
    pdfTemplateConfig: v.optional(v.object({
      logoUrl: v.optional(v.string()),
      kopSurat: v.optional(v.string()),
      footerText: v.optional(v.string()),
      signatures: v.optional(v.array(v.object({
        name: v.string(),
        title: v.string(),
        position: v.optional(v.string()),
      }))),
      customStyles: v.optional(v.object({
        headerColor: v.optional(v.string()),
        headerFont: v.optional(v.string()),
        bodyFont: v.optional(v.string()),
        watermark: v.optional(v.string()),
      })),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_organization_id", ["clerkOrganizationId"])
    .index("by_created_at", ["createdAt"]),

  // Users and their organization memberships
  users: defineTable({
    clerkUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    organizationId: v.id("organizations"),
    role: v.string(), // "admin", "pptk", "bendahara", "verifikator", "viewer"
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_user_id", ["clerkUserId"])
    .index("by_organization", ["organizationId"]),

  // RKA Programs (Top level - Program)
  rkaPrograms: defineTable({
    kode: v.string(), // e.g., "1.01.01.01"
    nama: v.string(),
    uraian: v.optional(v.string()),
    organizationId: v.id("organizations"),
    fiscalYear: v.number(),
    totalPagu: v.number(),
    status: v.string(), // "active", "inactive"
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_organization_fiscal_year", ["organizationId", "fiscalYear"])
    .index("by_kode", ["kode"]),

  // RKA Activities (Kegiatan - child of Programs)
  rkaKegiatans: defineTable({
    programId: v.id("rkaPrograms"),
    kode: v.string(), // e.g., "1.01.01.01.01"
    nama: v.string(),
    uraian: v.optional(v.string()),
    organizationId: v.id("organizations"),
    fiscalYear: v.number(),
    totalPagu: v.number(),
    status: v.string(), // "active", "inactive"
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_program", ["programId"])
    .index("by_organization", ["organizationId"])
    .index("by_organization_fiscal_year", ["organizationId", "fiscalYear"])
    .index("by_kode", ["kode"]),

  // RKA Sub Kegiatans (Sub Kegiatan - child of Kegiatans)
  rkaSubkegiatans: defineTable({
    kegiatanId: v.id("rkaKegiatans"),
    programId: v.id("rkaPrograms"), // Denormalized for performance
    kode: v.string(), // e.g., "1.01.01.01.01.01"
    nama: v.string(),
    uraian: v.optional(v.string()),
    organizationId: v.id("organizations"),
    fiscalYear: v.number(),
    totalPagu: v.number(),
    status: v.string(), // "active", "inactive"
    // Indikator kinerja
    indikatorOutput: v.optional(v.string()),
    targetOutput: v.optional(v.number()),
    satuanOutput: v.optional(v.string()),
    indikatorHasil: v.optional(v.string()),
    targetHasil: v.optional(v.number()),
    satuanHasil: v.optional(v.string()),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_kegiatan", ["kegiatanId"])
    .index("by_program", ["programId"])
    .index("by_organization", ["organizationId"])
    .index("by_organization_fiscal_year", ["organizationId", "fiscalYear"])
    .index("by_kode", ["kode"]),

  // RKA Accounts (Akun Belanja 5.xx - child of Sub Kegiatans)
  rkaAccounts: defineTable({
    subkegiatanId: v.id("rkaSubkegiatans"),
    kegiatanId: v.id("rkaKegiatans"), // Denormalized for performance
    programId: v.id("rkaPrograms"), // Denormalized for performance
    kode: v.string(), // e.g., "5.1.01.01.01.001"
    uraian: v.string(),
    satuan: v.optional(v.string()),
    volume: v.optional(v.number()),
    hargaSatuan: v.optional(v.number()),
    paguTahun: v.number(), // Total budget allocation for year
    realisasiTahun: v.number(), // Total realized amount for year
    sisaPagu: v.number(), // Calculated: paguTahun - realisasiTahun
    status: v.string(), // "active", "inactive"
    organizationId: v.id("organizations"),
    fiscalYear: v.number(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_subkegiatan", ["subkegiatanId"])
    .index("by_kegiatan", ["kegiatanId"])
    .index("by_program", ["programId"])
    .index("by_organization", ["organizationId"])
    .index("by_organization_fiscal_year", ["organizationId", "fiscalYear"])
    .index("by_kode", ["kode"])
    .index("by_status", ["status"]),

  // NPD (Nota Pencairan Dana) documents
  npdDocuments: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    documentNumber: v.string(),
    jenis: v.string(), // "UP", "GU", "TU", "LS"
    subkegiatanId: v.id("rkaSubkegiatans"), // Link to specific sub kegiatan
    status: v.string(), // "draft", "diajukan", "diverifikasi", "final"
    organizationId: v.id("organizations"),
    createdBy: v.id("users"),
    verifiedBy: v.optional(v.id("users")),
    verifiedAt: v.optional(v.number()),
    finalizedBy: v.optional(v.id("users")),
    finalizedAt: v.optional(v.number()),
    catatan: v.optional(v.string()),
    tahun: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    // Document locking fields
    isLocked: v.boolean(),
    lockedBy: v.optional(v.id("users")),
    lockedAt: v.optional(v.number()),
    lockReason: v.optional(v.string()),
    lockExpiresAt: v.optional(v.number()),
  })
    .index("by_organization", ["organizationId"])
    .index("by_subkegiatan", ["subkegiatanId"])
    .index("by_status", ["status"])
    .index("by_organization_status", ["organizationId", "status"])
    .index("by_organization_tahun", ["organizationId", "tahun"])
    .index("by_organization_nomor", ["organizationId", "documentNumber"])
    .index("by_created_by", ["createdBy"]),

  // NPD Lines - Detail accounts included in an NPD
  npdLines: defineTable({
    npdId: v.id("npdDocuments"),
    accountId: v.id("rkaAccounts"),
    uraian: v.string(),
    jumlah: v.number(), // Amount requested for this line
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_npd", ["npdId"])
    .index("by_account", ["accountId"]),

  // Attachments - File attachments for NPD documents
  attachments: defineTable({
    npdId: v.id("npdDocuments"),
    jenis: v.string(), // Type of attachment: "RAB", "BAST", "Kontrak", "Kwitansi", etc.
    url: v.string(), // File URL
    namaFile: v.string(), // Original filename
    ukuran: v.number(), // File size in bytes
    tipeMime: v.string(), // MIME type
    checksum: v.optional(v.string()), // File integrity checksum
    keterangan: v.optional(v.string()),
    organizationId: v.id("organizations"),
    uploadedBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_npd", ["npdId"])
    .index("by_organization", ["organizationId"])
    .index("by_jenis", ["jenis"]),

  // NPD Files - File attachments for NPD documents (more detailed than attachments)
  npdFiles: defineTable({
    npdId: v.id("npdDocuments"),
    filename: v.string(),
    fileType: v.string(), // MIME type
    fileSize: v.number(), // File size in bytes
    fileUrl: v.string(), // URL or path to file
    status: v.string(), // "uploading", "uploaded", "error"
    uploadedBy: v.id("users"),
    organizationId: v.id("organizations"),
    uploadedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_npd", ["npdId"])
    .index("by_organization", ["organizationId"])
    .index("by_status", ["status"]),

  // Activity logs for audit trail
  auditLogs: defineTable({
    action: v.string(), // "created", "updated", "submitted", "verified", "finalized", etc.
    entityTable: v.string(), // Table name: "rkaPrograms", "rkaKegiatans", "rkaSubkegiatans", "rkaAccounts", "npdDocuments", etc.
    entityId: v.string(), // ID as string to handle different table types
    entityData: v.optional(v.any()), // Before/after state for audit
    actorUserId: v.id("users"),
    organizationId: v.id("organizations"),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    keterangan: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_actor", ["actorUserId"])
    .index("by_entity", ["entityTable", "entityId"])
    .index("by_created_at", ["createdAt"]),

  // SP2D References - Payment warrant information
  sp2dRefs: defineTable({
    npdId: v.id("npdDocuments"),
    noSPM: v.optional(v.string()),
    noSP2D: v.string(), // SP2D number (required)
    tglSP2D: v.number(), // SP2D date timestamp
    nilaiCair: v.number(), // Amount actually disbursed
    catatan: v.optional(v.string()), // Notes for SP2D
    organizationId: v.id("organizations"),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_npd", ["npdId"])
    .index("by_organization", ["organizationId"])
    .index("by_sp2d_number", ["noSP2D"]),

  // Realizations - Track budget realization per account (enhanced)
  realizations: defineTable({
    accountId: v.id("rkaAccounts"),
    npdId: v.optional(v.id("npdDocuments")), // Link to NPD
    sp2dId: v.optional(v.id("sp2dRefs")), // Link to SP2D
    totalCair: v.number(), // Total amount realized for this account
    catatan: v.optional(v.string()),
    periode: v.string(), // Period (TW1, TW2, etc.)
    organizationId: v.id("organizations"),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_account", ["accountId"])
    .index("by_npd", ["npdId"])
    .index("by_sp2d", ["sp2dId"])
    .index("by_periode", ["periode"]),

  // Performance Logs - Enhanced performance tracking
  performanceLogs: defineTable({
    subkegiatanId: v.id("rkaSubkegiatans"),
    indikatorNama: v.string(),
    target: v.number(),
    realisasi: v.number(),
    satuan: v.string(),
    periode: v.string(), // e.g., "TW1", "TW2", "Bulan 1", etc.
    buktiURL: v.optional(v.string()), // URL to evidence file
    buktiType: v.optional(v.string()), // Type of evidence: "document", "image", "video"
    buktiName: v.optional(v.string()), // Original filename
    buktiSize: v.optional(v.number()), // File size in bytes
    keterangan: v.optional(v.string()), // Additional notes
    approvalStatus: v.string(), // "draft", "submitted", "approved"
    approvedBy: v.optional(v.id("users")), // User who approved
    approvedAt: v.optional(v.number()), // Approval timestamp
    organizationId: v.id("organizations"),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_subkegiatan", ["subkegiatanId"])
    .index("by_periode", ["periode"])
    .index("by_approval_status", ["approvalStatus"])
    .index("by_indikator", ["indikatorNama"]),

  // Notifications - In-app and email notifications
  verificationChecklists: defineTable({
    npdId: v.id("npdDocuments"),
    checklistType: v.string(), // "UP", "GU", "TU", "LS"
    results: v.array(v.object({
      itemId: v.string(),
      checked: v.boolean(),
      notes: v.optional(v.string()),
      required: v.boolean(),
    })),
    status: v.string(), // "draft", "in_progress", "completed", "rejected"
    verifiedBy: v.optional(v.id("users")),
    verifiedAt: v.optional(v.number()),
    overallNotes: v.optional(v.string()),
    organizationId: v.id("organizations"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_npd", ["npdId"])
    .index("by_organization", ["organizationId"])
    .index("by_status", ["status"])
    .index("by_type", ["checklistType"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(), // "npd_submitted", "npd_verified", "npd_rejected", "sp2d_created", etc.
    title: v.string(),
    message: v.string(),
    entityId: v.optional(v.id("npdDocuments")), // Reference to related entity
    entityType: v.optional(v.string()), // "npd", "sp2d", "rka", "user"
    isRead: v.boolean(), // For notification read status
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_entity", ["entityId", "entityType"])
    .index("by_created_at", ["createdAt"]),

  // Import progress tracking
  importProgress: defineTable({
    organizationId: v.id("organizations"),
    importType: v.string(), // "rka", "npd", "sp2d", etc.
    totalRows: v.number(),
    status: v.string(), // "started", "processing", "completed", "failed"
    currentRow: v.number(),
    errors: v.array(v.object({
      row: v.number(),
      field: v.string(),
      message: v.string(),
    })),
    metadata: v.optional(v.any()), // Additional data like filename, user info
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_organization", ["organizationId"])
    .index("by_import_type", ["importType"])
    .index("by_status", ["status"])
    .index("by_created_at", ["createdAt"]),
});

// Types for our entities
export type Organization = {
  _id: any;
  name: string;
  description?: string;
  clerkOrganizationId: string;
  pdfTemplateConfig?: {
    logoUrl?: string;
    kopSurat?: string;
    footerText?: string;
    signatures?: Array<{
      name: string;
      title: string;
      position?: string;
    }>;
    customStyles?: {
      headerColor?: string;
      headerFont?: string;
      bodyFont?: string;
      watermark?: string;
    };
  };
  createdAt: number;
  updatedAt: number;
};

export type User = {
  _id: any;
  clerkUserId: string;
  email: string;
  name?: string;
  organizationId: any;
  role: string;
  createdAt: number;
  updatedAt: number;
};

export type RKAProgram = {
  _id: any;
  kode: string;
  nama: string;
  uraian?: string;
  organizationId: any;
  fiscalYear: number;
  totalPagu: number;
  status: string;
  createdBy: any;
  createdAt: number;
  updatedAt: number;
};

export type RKAKegiatan = {
  _id: any;
  programId: any;
  kode: string;
  nama: string;
  uraian?: string;
  organizationId: any;
  fiscalYear: number;
  totalPagu: number;
  status: string;
  createdBy: any;
  createdAt: number;
  updatedAt: number;
};

export type RKASubkegiatan = {
  _id: any;
  kegiatanId: any;
  programId: any;
  kode: string;
  nama: string;
  uraian?: string;
  organizationId: any;
  fiscalYear: number;
  totalPagu: number;
  status: string;
  indikatorOutput?: string;
  targetOutput?: number;
  satuanOutput?: string;
  indikatorHasil?: string;
  targetHasil?: number;
  satuanHasil?: string;
  createdBy: any;
  createdAt: number;
  updatedAt: number;
};

export type RKAAccount = {
  _id: any;
  subkegiatanId: any;
  kegiatanId: any; // Denormalized for performance
  programId: any; // Denormalized for performance
  kode: string;
  uraian: string;
  satuan?: string;
  volume?: number;
  hargaSatuan?: number;
  paguTahun: number; // Total budget allocation for year
  realisasiTahun: number; // Total realized amount for year
  sisaPagu: number; // Calculated: paguTahun - realisasiTahun
  status: string; // "active", "inactive"
  organizationId: any;
  fiscalYear: number;
  createdBy: any;
  createdAt: number;
  updatedAt: number;
};

export type NPDDocument = {
  _id: any;
  title: string;
  description?: string;
  documentNumber: string;
  jenis: string; // "UP", "GU", "TU", "LS"
  subkegiatanId: any;
  status: string; // "draft", "diajukan", "diverifikasi", "final"
  organizationId: any;
  createdBy: any;
  verifiedBy?: any;
  verifiedAt?: number;
  finalizedBy?: any;
  finalizedAt?: number;
  catatan?: string;
  tahun: number;
  createdAt: number;
  updatedAt: number;
};

export type NPDLine = {
  _id: any;
  npdId: any;
  accountId: any;
  uraian: string;
  jumlah: number; // Amount requested for this line
  createdAt: number;
  updatedAt: number;
};

export type Attachment = {
  _id: any;
  npdId: any;
  jenis: string;
  url: string;
  namaFile: string;
  ukuran: number;
  tipeMime: string;
  checksum?: string;
  keterangan?: string;
  organizationId: any;
  uploadedBy: any;
  createdAt: number;
  updatedAt: number;
};

export type NPDFile = {
  _id: any;
  npdId: any;
  filename: string;
  fileType: string; // MIME type
  fileSize: number; // File size in bytes
  fileUrl: string; // URL or path to file
  status: string; // "uploading", "uploaded", "error"
  uploadedBy: any;
  organizationId: any;
  uploadedAt?: number;
  createdAt: number;
};

export type AuditLog = {
  _id: any;
  action: string;
  entityTable: string;
  entityId: string;
  entityData?: any;
  actorUserId: any;
  organizationId: any;
  ipAddress?: string;
  userAgent?: string;
  keterangan?: string;
  createdAt: number;
};

export type SP2DRef = {
  _id: any;
  npdId: any;
  noSPM?: string;
  noSP2D: string; // SP2D number (required)
  tglSP2D: number; // SP2D date timestamp
  nilaiCair: number; // Amount actually disbursed
  catatan?: string; // Notes for SP2D
  organizationId: any;
  createdBy: any;
  createdAt: number;
  updatedAt: number;
};

export type Realization = {
  _id: any;
  accountId: any;
  npdId?: any;
  sp2dId?: any;
  totalCair: number; // Total amount realized for this account
  catatan?: string;
  periode: string; // Period (TW1, TW2, etc.)
  organizationId: any;
  createdBy: any;
  createdAt: number;
  updatedAt: number;
};

export type PerformanceLog = {
  _id: any;
  subkegiatanId: any;
  indikatorNama: string;
  target: number;
  realisasi: number;
  satuan: string;
  periode: string; // e.g., "TW1", "TW2", "Bulan 1", etc.
  buktiURL?: string; // URL to evidence file
  buktiType?: string; // Type of evidence: "document", "image", "video"
  buktiName?: string; // Original filename
  buktiSize?: number; // File size in bytes
  keterangan?: string; // Additional notes
  approvalStatus: string; // "draft", "submitted", "approved"
  approvedBy?: any; // User who approved
  approvedAt?: number; // Approval timestamp
  organizationId: any;
  createdBy: any;
  createdAt: number;
  updatedAt: number;
};