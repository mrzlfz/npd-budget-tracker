import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Verification checklist templates for each NPD type
const VERIFICATION_TEMPLATES = {
  UP: {
    title: "Verifikasi NPD - Uang Persediaan",
    items: [
      { id: "surat_permohonan", label: "Surat Permohonan", required: true },
      { id: "rincian_biaya", label: "Rincian Biaya", required: true },
      { id: "bukti_pendukung", label: "Bukti Pendukung", required: true },
      { id: "sisa_pagu", label: "Sisa Pagu Memadai", required: true },
      { id: "kelengkapan_data", label: "Kelengkapan Data", required: true },
    ]
  },
  GU: {
    title: "Verifikasi NPD - Ganti Uang",
    items: [
      { id: "surat_pengantar", label: "Surat Pengantar", required: true },
      { id: "kwitansi_asli", label: "Kwitansi Asli", required: true },
      { id: "bukti_pembelanjaan", label: "Bukti Pembelanjaan", required: true },
      { id: "sisa_pagu", label: "Sisa Pagu Memadai", required: true },
      { id: "perhitungan", label: "Perhitungan", required: true },
    ]
  },
  TU: {
    title: "Verifikasi NPD - Tambahan Uang",
    items: [
      { id: "surat_permohonan", label: "Surat Permohonan", required: true },
      { id: "rincian_biaya", label: "Rincian Biaya", required: true },
      { id: "bukti_pendukung", label: "Bukti Pendukung", required: true },
      { id: "sisa_pagu", label: "Sisa Pagu Memadai", required: true },
      { id: "kebutuhan", label: "Kebutuhan", required: true },
    ]
  },
  LS: {
    title: "Verifikasi NPD - Lanjutan Surat",
    items: [
      { id: "surat_perintah", label: "Surat Perintah", required: true },
      { id: "kwitansi_asli", label: "Kwitansi Asli", required: true },
      { id: "bukti_pelaksanaan", label: "Bukti Pelaksanaan", required: true },
      { id: "sisa_pagu", label: "Sisa Pagu Memadai", required: true },
      { id: "pelaksanaan", label: "Pelaksanaan", required: true },
    ]
  }
} as const;

// Get verification template for NPD type
export const getVerificationTemplate = query({
  args: {
    npdType: v.string(), // "UP", "GU", "TU", "LS"
  },
  handler: async (ctx, args) => {
    return VERIFICATION_TEMPLATES[args.npdType as keyof typeof VERIFICATION_TEMPLATES] || null;
  },
});

// Get existing checklist for NPD
export const getChecklistByNPD = query({
  args: {
    npdId: v.id("npdDocuments"),
  },
  handler: async (ctx, args) => {
    const checklist = await ctx.db
      .query("verificationChecklists")
      .withIndex("by_npd")
      .filter(q => q.eq("npdId", args.npdId))
      .first();

    return checklist;
  },
});

// Create or update verification checklist
export const saveChecklist = mutation({
  args: {
    npdId: v.id("npdDocuments"),
    checklistType: v.string(),
    results: v.array(v.object({
      itemId: v.string(),
      checked: v.boolean(),
      notes: v.optional(v.string()),
      required: v.boolean(),
    })),
    status: v.string(),
    overallNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get NPD to verify ownership and organization
    const npd = await ctx.db.get(args.npdId);
    if (!npd) {
      throw new Error("NPD not found");
    }

    // Get user to check role
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user has verification permissions
    if (user.role !== "bendahara" && user.role !== "verifikator" && user.role !== "admin") {
      throw new Error("Insufficient permissions for verification");
    }

    const now = Date.now();

    // Check if checklist already exists
    const existingChecklist = await ctx.db
      .query("verificationChecklists")
      .withIndex("by_npd")
      .filter(q => q.eq("npdId", args.npdId))
      .first();

    if (existingChecklist) {
      // Update existing checklist
      await ctx.db.patch(existingChecklist._id, {
        results: args.results,
        status: args.status,
        overallNotes: args.overallNotes,
        updatedAt: now,
        ...(args.status === "completed" ? {
          verifiedBy: userId,
          verifiedAt: now,
        } : {}),
      });
    } else {
      // Create new checklist
      await ctx.db.insert("verificationChecklists", {
        npdId: args.npdId,
        checklistType: args.checklistType,
        results: args.results,
        status: args.status,
        overallNotes: args.overallNotes,
        organizationId: npd.organizationId,
        createdAt: now,
        updatedAt: now,
      });
    }

    // If verification is completed, update NPD status
    if (args.status === "completed") {
      await ctx.db.patch(args.npdId, {
        status: "diverifikasi",
        verifiedBy: userId,
        verifiedAt: now,
        updatedAt: now,
      });

      // Create notification
      await ctx.db.insert("notifications", {
        userId: npd.createdBy,
        type: "npd_verified",
        title: "NPD Terverifikasi",
        message: `NPD ${npd.documentNumber} telah berhasil diverifikasi`,
        entityId: args.npdId,
        entityType: "npd",
        isRead: false,
        createdAt: now,
      });
    }

    // Log verification action
    await ctx.db.insert("auditLogs", {
      action: "verified_checklist",
      entityTable: "verificationChecklists",
      entityId: existingChecklist?._id.toString() : "new",
      entityData: {
        npdId: args.npdId,
        checklistType: args.checklistType,
        status: args.status,
        resultCount: args.results.length,
        verifiedBy: userId,
      },
      actorUserId: userId,
      organizationId: npd.organizationId,
      createdAt: now,
    });

    return { success: true };
  },
});

// Update verification status
export const updateVerificationStatus = mutation({
  args: {
    checklistId: v.id("verificationChecklists"),
    status: v.string(),
    overallNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get checklist
    const checklist = await ctx.db.get(args.checklistId);
    if (!checklist) {
      throw new Error("Checklist not found");
    }

    // Get NPD for notifications
    const npd = await ctx.db.get(checklist.npdId);
    if (!npd) {
      throw new Error("NPD not found");
    }

    const now = Date.now();

    // Update checklist status
    await ctx.db.patch(args.checklistId, {
      status: args.status,
      overallNotes: args.overallNotes,
      updatedAt: now,
      ...(args.status === "completed" ? {
        verifiedBy: userId,
        verifiedAt: now,
      } : {}),
    });

    // If verification is completed, update NPD status
    if (args.status === "completed") {
      await ctx.db.patch(checklist.npdId, {
        status: "diverifikasi",
        verifiedBy: userId,
        verifiedAt: now,
        updatedAt: now,
      });

      // Create notification
      await ctx.db.insert("notifications", {
        userId: npd.createdBy,
        type: "npd_verified",
        title: "NPD Terverifikasi",
        message: `NPD ${npd.documentNumber} telah berhasil diverifikasi`,
        entityId: checklist.npdId,
        entityType: "npd",
        isRead: false,
        createdAt: now,
      });
    }

    // Log status update
    await ctx.db.insert("auditLogs", {
      action: "updated_verification_status",
      entityTable: "verificationChecklists",
      entityId: args.checklistId,
      entityData: {
        oldStatus: checklist.status,
        newStatus: args.status,
        updatedBy: userId,
      },
      actorUserId: userId,
      organizationId: checklist.organizationId,
      createdAt: now,
    });

    return { success: true };
  },
});

// Get verification summary for dashboard
export const getVerificationSummary = query({
  args: {
    organizationId: v.id("organizations"),
    fiscalYear: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = new Date();
    const currentYear = args.fiscalYear || now.getFullYear();

    // Get all verification checklists for the organization and year
    const npdsQuery = await ctx.db
      .query("npdDocuments")
      .withIndex("by_organization_fiscal_year")
      .filter(q =>
        q.eq("organizationId", args.organizationId) &&
        q.eq("tahun", currentYear)
      )
      .collect();

    if (npdsQuery.length === 0) {
      return {
        total: 0,
        byStatus: {
          draft: 0,
          in_progress: 0,
          completed: 0,
          rejected: 0,
        },
        byType: {
          UP: 0,
          GU: 0,
          TU: 0,
          LS: 0,
        },
      };
    }

    const npdIds = npdsQuery.map(npd => npd._id);

    // Get checklists for these NPDs
    const checklists = await ctx.db
      .query("verificationChecklists")
      .withIndex("by_npd")
      .filter(q =>
        q.or(...npdIds.map(npdId => q.eq("npdId", npdId)))
      )
      .collect();

    // Calculate summary
    const summary = {
      total: npdsQuery.length,
      byStatus: {
        draft: checklists.filter(c => c.status === "draft").length,
        in_progress: checklists.filter(c => c.status === "in_progress").length,
        completed: checklists.filter(c => c.status === "completed").length,
        rejected: checklists.filter(c => c.status === "rejected").length,
      },
      byType: {
        UP: checklists.filter(c => c.checklistType === "UP").length,
        GU: checklists.filter(c => c.checklistType === "GU").length,
        TU: checklists.filter(c => c.checklistType === "TU").length,
        LS: checklists.filter(c => c.checklistType === "LS").length,
      },
    };

    return summary;
  },
});

// Validate checklist before submission
export const validateChecklist = query({
  args: {
    results: v.array(v.object({
      itemId: v.string(),
      checked: v.boolean(),
      required: v.boolean(),
    })),
    checklistType: v.string(),
  },
  handler: async (ctx, args) => {
    const template = VERIFICATION_TEMPLATES[args.checklistType as keyof typeof VERIFICATION_TEMPLATES];

    if (!template) {
      throw new Error(`Unknown checklist type: ${args.checklistType}`);
    }

    const validationErrors = [];
    let allRequiredPassed = true;

    // Check each item
    for (const result of args.results) {
      const templateItem = template.items.find(item => item.id === result.itemId);

      if (!templateItem) {
        validationErrors.push(`Unknown item: ${result.itemId}`);
        continue;
      }

      // Check if required items are checked
      if (templateItem.required && !result.checked) {
        validationErrors.push(`${templateItem.label} harus dicentang`);
        allRequiredPassed = false;
      }
    }

    // Check if at least one item is checked (prevent empty submission)
    const hasAnyChecked = args.results.some(result => result.checked);
    if (!hasAnyChecked) {
      validationErrors.push("Minimal satu item harus dicentang");
      allRequiredPassed = false;
    }

    return {
      isValid: validationErrors.length === 0 && allRequiredPassed,
      errors: validationErrors,
      template: template,
    };
  },
});