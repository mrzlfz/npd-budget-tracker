import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Permission checking helper functions
async function hasPermission(ctx: any, userId: any, action: string, resource: string): Promise<boolean> {
  const user = await ctx.db.get(userId);
  if (!user) return false;

  const userRole = user.role as any;

  // Admin has all permissions
  if (userRole === 'admin') return true;

  // Define permission matrix
  const permissions = {
    'pptk': {
      'create': ['npd', 'rka', 'performance'],
      'read': ['npd', 'rka', 'sp2d', 'realisasi', 'performance', 'reports'],
      'update': ['npd', 'rka', 'performance', 'profile'],
      'submit': ['npd'],
    },
    'bendahara': {
      'create': ['npd', 'sp2d', 'realisasi'],
      'read': ['npd', 'rka', 'sp2d', 'realisasi', 'performance', 'reports'],
      'update': ['npd', 'sp2d', 'realisasi', 'profile'],
      'verify': ['npd'],
      'approve': ['npd'],
    },
    'verifikator': {
      'read': ['npd', 'rka', 'sp2d', 'realisasi', 'performance', 'reports'],
      'update': ['profile'],
      'verify': ['npd'],
      'approve': ['npd'],
    },
    'viewer': {
      'read': ['npd', 'rka', 'sp2d', 'realisasi', 'performance', 'reports'],
      'update': ['profile'],
    }
  };

  const rolePermissions = permissions[userRole] || {};
  const resourcePermissions = rolePermissions[action] || [];

  return resourcePermissions.includes(resource) || resourcePermissions.includes('*');
}

// Get NPD documents for the current user's organization
export const list = query({
  args: {
    paginationOpts: v.optional(
      v.object({
        numItems: v.number(),
        cursor: v.optional(v.string()),
      })
    ),
    status: v.optional(v.string()),
    tahun: v.optional(v.number()),
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Build the base query
    let baseQuery = ctx.db.query("npdDocuments").withIndex("by_organization", q =>
      q.eq("organizationId", user.organizationId)
    );

    // Apply filters
    if (args.status) {
      baseQuery = baseQuery.withIndex("by_status", q => q.eq("status", args.status));
    }
    if (args.tahun) {
      baseQuery = baseQuery.withIndex("by_organization_tahun", q =>
        q.eq("organizationId", user.organizationId).eq("tahun", args.tahun)
      );
    }

    // Apply pagination if provided
    if (args.paginationOpts) {
      const result = await baseQuery
        .paginate(args.paginationOpts)
        .take(args.paginationOpts.numItems || 20);

      if (args.paginationOpts.cursor) {
        return result.cursorPagination(args.paginationOpts.cursor);
      } else {
        return result.offsetPagination(args.paginationOpts.numItems * (args.paginationOpts.page || 0));
      }
    } else {
      // Default pagination
      const result = await baseQuery.take(20);
      return result;
    }
  },
});

// Get a single NPD document by ID
export const getById = query({
  args: {
    npdId: v.id("npdDocuments"),
  },
  handler: async (ctx, { npdId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const npd = await ctx.db.get(npdId);
    if (!npd) {
      throw new Error("NPD not found");
    }

    // Check if user has access to this NPD (same organization)
    const user = await ctx.db.get(userId);
    if (npd.organizationId !== user.organizationId) {
      throw new Error("Access denied");
    }

    return npd;
  },
});

// Get NPD summary statistics
export const getSummary = query({
  args: {
    organizationId: v.id("organizations"),
    tahun: v.optional(v.number()),
  },
  handler: async (ctx, { organizationId, tahun }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user || user.organizationId !== organizationId) {
      throw new Error("Access denied");
    }

    // Get NPDs with different statuses
    const [draftNPDs, diajukanNPDs, diverifikasiNPDs, finalNPDs] = await Promise.all([
      ctx.db
        .query("npdDocuments")
        .withIndex("by_organization_status", q => q.eq("organizationId", organizationId).eq("status", "draft"))
        .collect(),
      ctx.db
        .query("npdDocuments")
        .withIndex("by_organization_status", q => q.eq("organizationId", organizationId).eq("status", "diajukan"))
        .collect(),
      ctx.db
        .query("npdDocuments")
        .withIndex("by_organization_status", q => q.eq("organizationId", organizationId).eq("status", "diverifikasi"))
        .collect(),
      ctx.db
        .query("npdDocuments")
        .withIndex("by_organization_status", q => q.eq("organizationId", organizationId).eq("status", "final"))
        .collect(),
    ]);

    const totalNPDs = draftNPDs.length + diajukanNPDs.length + diverifikasiNPDs.length + finalNPDs.length;
    const totalNilai = await ctx.db
      .query("npdDocuments")
      .withIndex("by_organization", q => q.eq("organizationId", organizationId))
      .collect()
      .then(npds => npds.reduce((sum, npd) => {
        // Get total amount from this NPD
        const total = await ctx.db
          .query("npdLines")
          .withIndex("by_npd", q => q.eq("npdId", npd._id))
          .collect()
          .then(lines => lines.reduce((sum, line) => sum + line.jumlah, 0));

        return sum + total;
      }, 0));

    return {
      total: totalNPDs,
      byStatus: {
        draft: draftNPDs.length,
        diajukan: diajukanNPDs.length,
        diverifikasi: diverifikasiNPDs.length,
        final: finalNPDs.length,
      },
      totalNilai,
      rataRata: totalNPDs > 0 ? totalNilai / totalNPDs : 0,
    };
  },
});

// Create a new NPD document
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    jenis: v.string(), // "UP", "GU", "TU", "LS"
    subkegiatanId: v.id("rkaSubkegiatans"),
    catatan: v.optional(v.string()),
    tahun: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get subkegiatan to validate access
    const subkegiatan = await ctx.db.get(args.subkegiatanId);
    if (!subkegiatan || subkegiatan.organizationId !== user.organizationId) {
      throw new Error("Subkegiatan not found or access denied");
    }

    // Validate NPD data before creation
    if (args.lines && args.lines.length > 0) {
      const validationResult = await ctx.db.query(api.validations.validateNPD, {
        organizationId: user.organizationId,
        npdData: {
          jenis: args.jenis,
          lines: args.lines,
        }
      });

      if (!validationResult.isValid) {
        throw new Error(`Validasi gagal: ${validationResult.errors.join(', ')}`);
      }
    }

    // Generate document number (organization-specific and year-specific)
    const currentYear = new Date().getFullYear();
    const docNum = await generateDocumentNumber(ctx, user.organizationId, args.tahun || currentYear);

    // Create NPD document
    const npdId = await ctx.db.insert("npdDocuments", {
      title: args.title,
      description: args.description,
      documentNumber: docNum,
      jenis: args.jenis,
      subkegiatanId: args.subkegiatanId,
      status: "draft",
      organizationId: user.organizationId,
      createdBy: userId,
      catatan: args.catatan,
      tahun: args.tahun || currentYear,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "created",
      entityTable: "npdDocuments",
      entityId: npdId,
      actorUserId: userId,
      organizationId: user.organizationId,
      createdAt: Date.now(),
    });

    return npdId;
  },
});

// Update NPD document
export const update = mutation({
  args: {
    npdId: v.id("npdDocuments"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    catatan: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db.get(args.npdId);
    if (!existing) {
      throw new Error("NPD not found");
    }

    // Check if user has access
    const user = await ctx.db.get(userId);
    if (!user || existing.organizationId !== user.organizationId) {
      throw new Error("Access denied");
    }

    // Check if NPD can be updated (not finalized)
    if (existing.status === "final") {
      throw new Error("Cannot update finalized NPD");
    }

    const updated = await ctx.db.patch(args.npdId, {
      title: args.title,
      description: args.description,
      catatan: args.catatan,
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "updated",
      entityTable: "npdDocuments",
      entityId: args.npdId,
      actorUserId: userId,
      organizationId: user.organizationId,
      createdAt: Date.now(),
    });

    return updated;
  },
});

// Submit NPD for verification
export const submit = mutation({
  args: {
    npdId: v.id("npdDocuments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db.get(args.npdId);
    if (!existing) {
      throw new Error("NPD not found");
    }

    // Check if user has access
    const user = await ctx.db.get(userId);
    if (!user || existing.organizationId !== user.organizationId) {
      throw new Error("Access denied");
    }

    // Check if user has permission to submit NPD
    const canSubmit = await hasPermission(ctx, userId, 'submit', 'npd');
    if (!canSubmit) {
      throw new Error("You don't have permission to submit NPDs");
    }

    // Check if NPD can be submitted (must be draft and have lines)
    if (existing.status !== "draft") {
      throw new Error("Only draft NPDs can be submitted");
    }

    // Check if NPD has at least one line
    const linesCount = await ctx.db
      .query("npdLines")
      .withIndex("by_npd", q => q.eq("npdId", args.npdId))
      .collect()
      .then(lines => lines.length);

    if (linesCount === 0) {
      throw new Error("NPD must have at least one line item");
    }

    // Update status to submitted
    const updated = await ctx.db.patch(args.npdId, {
      status: "diajukan",
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "submitted",
      entityTable: "npdDocuments",
      entityId: args.npdId,
      actorUserId: userId,
      organizationId: user.organizationId,
      createdAt: Date.now(),
    });

    return updated;
  },
});

// Verify NPD (for verifikator/bendahara)
export const verify = mutation({
  args: {
    npdId: v.id("npdDocuments"),
    catatanVerifikasi: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db.get(args.npdId);
    if (!existing) {
      throw new Error("NPD not found");
    }

    // Check if user has access
    const user = await ctx.db.get(userId);
    if (!user || existing.organizationId !== user.organizationId) {
      throw new Error("Access denied");
    }

    // Check if user has permission to verify NPD
    const canVerify = await hasPermission(ctx, userId, 'verify', 'npd');
    if (!canVerify) {
      throw new Error("You don't have permission to verify NPDs");
    }

    // Check if NPD can be verified (must be submitted)
    if (existing.status !== "diajukan") {
      throw new Error("Only submitted NPDs can be verified");
    }

    // Update status to verified
    const updated = await ctx.db.patch(args.npdId, {
      status: "diverifikasi",
      verifiedBy: userId,
      verifiedAt: Date.now(),
      catatan: args.catatanVerifikasi,
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "verified",
      entityTable: "npdDocuments",
      entityId: args.npdId,
      actorUserId: userId,
      organizationId: user.organizationId,
      createdAt: Date.now(),
    });

    return updated;
  },
});

// Finalize NPD (lock from further changes)
export const finalize = mutation({
  args: {
    npdId: v.id("npdDocuments"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db.get(args.npdId);
    if (!existing) {
      throw new Error("NPD not found");
    }

    // Check if user has access
    const user = await ctx.db.get(userId);
    if (!user || existing.organizationId !== user.organizationId) {
      throw new Error("Access denied");
    }

    // Check if user has permission to approve/finalize NPD
    const canApprove = await hasPermission(ctx, userId, 'approve', 'npd');
    if (!canApprove) {
      throw new Error("You don't have permission to finalize NPDs");
    }

    // Check if NPD can be finalized (must be verified)
    if (existing.status !== "diverifikasi") {
      throw new Error("Only verified NPDs can be finalized");
    }

    // Update status to final
    const updated = await ctx.db.patch(args.npdId, {
      status: "final",
      finalizedBy: userId,
      finalizedAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "finalized",
      entityTable: "npdDocuments",
      entityId: args.npdId,
      actorUserId: userId,
      organizationId: user.organizationId,
      createdAt: Date.now(),
    });

    return updated;
  },
});

// Helper function to generate document numbers
async function generateDocumentNumber(ctx: any, organizationId: any, tahun: number): Promise<string> {
  const currentYear = new Date().getFullYear();
  const year = tahun || currentYear;

  // Get existing NPDs for this organization and year to determine next number
  const existingNPDs = await ctx.db
    .query("npdDocuments")
    .withIndex("by_organization_tahun", q => q.eq("organizationId", organizationId).eq("tahun", year))
    .collect()
    .then(npds => npds.map(npd => npd.documentNumber));

  existingNPDs.sort((a, b) => {
    const numA = parseInt(a.split('-')[1] || '0');
    const numB = parseInt(b.split('-')[1] || '0');
    return numB - numA;
  });

  const lastNumber = existingNPDs.length > 0
    ? Math.max(...existingNPDs.map(npd => parseInt(npd.documentNumber.split('-')[1] || '0')))
    : 0;

  const nextNumber = lastNumber + 1;

  // Format: NPD-[YEAR]-[SEQ]
  return `NPD-${year}-${nextNumber.toString().padStart(3, '0')}`;
}

// Add line item to NPD
export const addLine = mutation({
  args: {
    npdId: v.id("npdDocuments"),
    accountId: v.id("rkaAccounts"),
    uraian: v.string(),
    jumlah: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Validate inputs
    const npd = await ctx.db.get(args.npdId);
    const account = await ctx.db.get(args.accountId);

    if (!npd || !account) {
      throw new Error("NPD or Account not found");
    }

    // Check if user has access
    const user = await ctx.db.get(userId);
    if (!user || npd.organizationId !== user.organizationId || account.organizationId !== user.organizationId) {
      throw new Error("Access denied");
    }

    // Check if NPD can be modified (not finalized)
    if (npd.status === "final") {
      throw new Error("Cannot add lines to finalized NPD");
    }

    // Get current lines to check total against remaining budget
    const currentLines = await ctx.db
      .query("npdLines")
      .withIndex("by_npd", q => q.eq("npdId", args.npdId))
      .collect()
      .then(lines => lines.reduce((sum, line) => sum + line.jumlah, 0));

    // Check if adding this line exceeds available budget
    if (currentLines + args.jumlah > account.sisaPagu) {
      throw new Error(`Insufficient budget. Available: ${account.sisaPagu}, Requested: ${currentLines + args.jumlah}`);
    }

    // Add the line
    const lineId = await ctx.db.insert("npdLines", {
      npdId: args.npdId,
      accountId: args.accountId,
      uraian: args.uraian,
      jumlah: args.jumlah,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update account's remaining budget
    const newSisaPagu = account.sisaPagu - args.jumlah;
    await ctx.db.patch(args.accountId, {
      sisaPagu: newSisaPagu,
      realisasiTahun: account.realisasiTahun + args.jumlah,
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "line_added",
      entityTable: "npdLines",
      entityId: lineId,
      actorUserId: userId,
      organizationId: user.organizationId,
      createdAt: Date.now(),
    });

    return lineId;
  },
});

// Update line item
export const updateLine = mutation({
  args: {
    lineId: v.id("npdLines"),
    uraian: v.optional(v.string()),
    jumlah: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existingLine = await ctx.db.get(args.lineId);
    if (!existingLine) {
      throw new Error("Line not found");
    }

    // Get the NPD and account to validate
    const npd = await ctx.db.get(existingLine.npdId);
    const account = await ctx.db.get(existingLine.accountId);

    if (!npd || !account) {
      throw new Error("NPD or Account not found");
    }

    // Check if user has access
    const user = await ctx.db.get(userId);
    if (!user || npd.organizationId !== user.organizationId || account.organizationId !== user.organizationId) {
      throw new Error("Access denied");
    }

    // Check if NPD can be modified (not finalized)
    if (npd.status === "final") {
      throw new Error("Cannot modify lines in finalized NPD");
    }

    // Calculate the difference in amount
    const amountDiff = args.jumlah - existingLine.jumlah;
    const currentSisa = account.sisaPagu + existingLine.jumlah;

    // Validate budget constraints
    if (amountDiff > currentSisa) {
      throw new Error(`Insufficient budget. Available: ${currentSisa}, Requested additional: ${amountDiff}`);
    }

    // Update the line
    const updated = await ctx.db.patch(args.lineId, {
      uraian: args.uraian,
      jumlah: args.jumlah,
      updatedAt: Date.now(),
    });

    // Update account's remaining budget
    const newSisaPagu = account.sisaPagu - amountDiff;
    await ctx.db.patch(existingLine.accountId, {
      sisaPagu: newSisaPagu,
      realisasiTahun: account.realisasiTahun + amountDiff,
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "line_updated",
      entityTable: "npdLines",
      entityId: args.lineId,
      actorUserId: userId,
      organizationId: user.organizationId,
      createdAt: Date.now(),
    });

    return updated;
  },
});

// Remove line item
export const removeLine = mutation({
  args: {
    lineId: v.id("npdLines"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existingLine = await ctx.db.get(args.lineId);
    if (!existingLine) {
      throw new Error("Line not found");
    }

    // Get the NPD and account to validate
    const npd = await ctx.db.get(existingLine.npdId);
    const account = await ctx.db.get(existingLine.accountId);

    if (!npd || !account) {
      throw new Error("NPD or Account not found");
    }

    // Check if user has access
    const user = await ctx.db.get(userId);
    if (!user || npd.organizationId !== user.organizationId || account.organizationId !== user.organizationId) {
      throw new Error("Access denied");
    }

    // Check if NPD can be modified (not finalized)
    if (npd.status === "final") {
      throw new Error("Cannot modify lines in finalized NPD");
    }

    // Calculate the amount to restore
    const amountToRestore = existingLine.jumlah;

    // Update the line (delete)
    await ctx.db.delete(args.lineId);

    // Update account's remaining budget
    const newSisaPagu = account.sisaPagu + amountToRestore;
    await ctx.db.patch(existingLine.accountId, {
      sisaPagu: newSisaPagu,
      realisasiTahun: account.realisasiTahun - amountToRestore,
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "line_removed",
      entityTable: "npdLines",
      entityId: existingLine._id,
      actorUserId: userId,
      organizationId: user.organizationId,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Reject NPD (revert from submitted/verified back to draft)
export const reject = mutation({
  args: {
    npdId: v.id("npdDocuments"),
    catatanPenolakan: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const existing = await ctx.db.get(args.npdId);
    if (!existing) {
      throw new Error("NPD not found");
    }

    // Check if user has access
    const user = await ctx.db.get(userId);
    if (!user || existing.organizationId !== user.organizationId) {
      throw new Error("Access denied");
    }

    // Check if user has permission to reject NPD
    const canReject = await hasPermission(ctx, userId, 'verify', 'npd');
    if (!canReject) {
      throw new Error("You don't have permission to reject NPDs");
    }

    // Check if NPD can be rejected (must be submitted or verified)
    if (existing.status !== "diajukan" && existing.status !== "diverifikasi") {
      throw new Error("Only submitted or verified NPDs can be rejected");
    }

    // Update status back to draft and add rejection note
    const updated = await ctx.db.patch(args.npdId, {
      status: "draft",
      catatan: `DITOLAK: ${args.catatanPenolakan}\n\nCatatan asli:\n${existing.catatan || ''}`,
      verifiedBy: undefined, // Clear verification
      verifiedAt: undefined,
      finalizedBy: undefined, // Clear finalization
      finalizedAt: undefined,
      updatedAt: Date.now(),
    });

    // Create audit log for rejection
    await ctx.db.insert("auditLogs", {
      action: "rejected",
      entityTable: "npdDocuments",
      entityId: args.npdId,
      actorUserId: userId,
      organizationId: user.organizationId,
      keterangan: args.catatanPenolakan,
      createdAt: Date.now(),
    });

    return updated;
  },
});

// Get NPD with lines for detailed view
export const getNPDWithLines = query({
  args: {
    npdId: v.id("npdDocuments"),
  },
  handler: async (ctx, { npdId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const npd = await ctx.db.get(npdId);
    if (!npd) {
      throw new Error("NPD not found");
    }

    // Check if user has access to this NPD (same organization)
    const user = await ctx.db.get(userId);
    if (!user || npd.organizationId !== user.organizationId) {
      throw new Error("Access denied");
    }

    // Get all line items for this NPD
    const lines = await ctx.db
      .query("npdLines")
      .withIndex("by_npd", q => q.eq("npdId", npdId))
      .collect();

    // Get account details for each line
    const linesWithAccounts = await Promise.all(
      lines.map(async (line) => {
        const account = await ctx.db.get(line.accountId);
        return {
          ...line,
          account: account ? {
            kode: account.kode,
            uraian: account.uraian,
            paguTahun: account.paguTahun,
            realisasiTahun: account.realisasiTahun,
            sisaPagu: account.sisaPagu,
          } : null,
        };
      })
    );

    // Get subkegiatan details
    const subkegiatan = await ctx.db.get(npd.subkegiatanId);

    // Get file attachments
    const attachments = await ctx.db
      .query("attachments")
      .withIndex("by_npd", q => q.eq("npdId", npdId))
      .collect();

    return {
      ...npd,
      lines: linesWithAccounts,
      subkegiatan: subkegiatan ? {
        kode: subkegiatan.kode,
        nama: subkegiatan.nama,
        uraian: subkegiatan.uraian,
      } : null,
      attachments,
      createdByUser: await ctx.db.get(npd.createdBy),
      verifiedByUser: npd.verifiedBy ? await ctx.db.get(npd.verifiedBy) : null,
      finalizedByUser: npd.finalizedBy ? await ctx.db.get(npd.finalizedBy) : null,
    };
  },
});

// Get NPDs for verification (for verifikator/bendahara)
export const getNPDsForVerification = query({
  args: {
    paginationOpts: v.optional(
      v.object({
        numItems: v.number(),
        cursor: v.optional(v.string()),
      })
    ),
    tahun: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user has permission to verify NPDs
    const canVerify = await hasPermission(ctx, userId, 'verify', 'npd');
    if (!canVerify) {
      throw new Error("You don't have permission to view NPDs for verification");
    }

    // Build base query for submitted NPDs
    let baseQuery = ctx.db.query("npdDocuments").withIndex("by_organization_status", q =>
      q.eq("organizationId", user.organizationId).eq("status", "diajukan")
    );

    // Apply year filter if provided
    if (args.tahun) {
      baseQuery = baseQuery.filter(npd => npd.tahun === args.tahun);
    }

    // Apply pagination if provided
    if (args.paginationOpts) {
      const result = await baseQuery
        .paginate(args.paginationOpts)
        .take(args.paginationOpts.numItems || 20);

      if (args.paginationOpts.cursor) {
        return result.cursorPagination(args.paginationOpts.cursor);
      } else {
        return result.offsetPagination(args.paginationOpts.numItems * (args.paginationOpts.page || 0));
      }
    } else {
      // Default pagination
      const result = await baseQuery.take(20);
      return result;
    }
  },
});

// Get NPDs for approval (for bendahara)
export const getNPDsForApproval = query({
  args: {
    paginationOpts: v.optional(
      v.object({
        numItems: v.number(),
        cursor: v.optional(v.string()),
      })
    ),
    tahun: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if user has permission to approve NPDs
    const canApprove = await hasPermission(ctx, userId, 'approve', 'npd');
    if (!canApprove) {
      throw new Error("You don't have permission to view NPDs for approval");
    }

    // Build base query for verified NPDs
    let baseQuery = ctx.db.query("npdDocuments").withIndex("by_organization_status", q =>
      q.eq("organizationId", user.organizationId).eq("status", "diverifikasi")
    );

    // Apply year filter if provided
    if (args.tahun) {
      baseQuery = baseQuery.filter(npd => npd.tahun === args.tahun);
    }

    // Apply pagination if provided
    if (args.paginationOpts) {
      const result = await baseQuery
        .paginate(args.paginationOpts)
        .take(args.paginationOpts.numItems || 20);

      if (args.paginationOpts.cursor) {
        return result.cursorPagination(args.paginationOpts.cursor);
      } else {
        return result.offsetPagination(args.paginationOpts.numItems * (args.paginationOpts.page || 0));
      }
    } else {
      // Default pagination
      const result = await baseQuery.take(20);
      return result;
    }
  },
});