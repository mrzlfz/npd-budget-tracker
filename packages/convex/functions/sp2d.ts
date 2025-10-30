import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Permission checking helper (reuse from npd.ts)
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

// Get SP2D documents list
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

    // Use provided organizationId or fallback to user's organization
    const orgId = args.organizationId || user.organizationId;

    // Build base query
    let baseQuery = ctx.db.query("sp2dRefs")
      .withIndex("by_organization", q => q.eq("organizationId", orgId));

    // Apply filters
    if (args.status) {
      baseQuery = baseQuery.filter(sp2d =>
        sp2d.noSP2D.includes(args.status)
      );
    }

    if (args.tahun) {
      baseQuery = baseQuery.filter(sp2d => {
        const sp2dYear = new Date(sp2d.tglSP2D).getFullYear();
        return sp2dYear === args.tahun;
      });
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

// Get SP2D by NPD ID
export const getByNPD = query({
  args: {
    npdId: v.id("npdDocuments"),
  },
  handler: async (ctx, { npdId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get SP2D records for this NPD
    const sp2dRecords = await ctx.db
      .query("sp2dRefs")
      .withIndex("by_npd", q => q.eq("npdId", npdId))
      .collect();

    return sp2dRecords;
  },
});

// Create SP2D record
export const create = mutation({
  args: {
    npdId: v.id("npdDocuments"),
    noSPM: v.optional(v.string()),
    noSP2D: v.string(),
    tglSP2D: v.number(),
    nilaiCair: v.number(),
    catatan: v.optional(v.string()),
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

    // Get NPD to validate access
    const npd = await ctx.db.get(args.npdId);
    if (!npd || npd.organizationId !== user.organizationId) {
      throw new Error("NPD not found or access denied");
    }

    // Check if user has permission to create SP2D (bendahara only)
    const canCreateSP2D = await hasPermission(ctx, userId, 'create', 'sp2d');
    if (!canCreateSP2D) {
      throw new Error("You don't have permission to create SP2D records");
    }

    // Check if NPD is finalized (only finalized NPDs can have SP2D)
    if (npd.status !== "final") {
      throw new Error("Only finalized NPDs can have SP2D records");
    }

    // Validate SP2D amount doesn't exceed total NPD amount
    const totalNPDAmount = npdLines.reduce((sum, line) => sum + line.jumlah, 0);
    if (args.nilaiCair > totalNPDAmount) {
      throw new Error(`SP2D amount (${args.nilaiCair}) cannot exceed total NPD amount (${totalNPDAmount})`);
    }

    // Get NPD lines for proportional distribution
    const npdLines = await ctx.db
      .query("npdLines")
      .withIndex("by_npd", (q) => q.eq("npdId", args.npdId))
      .collect();

    // Calculate proportional distribution
    const distributionMap = new Map();

    for (const line of npdLines) {
      const proportion = line.jumlah / totalNPDAmount;
      const distributedAmount = Math.round(args.nilaiCair * proportion * 100) / 100;
      distributionMap.set(line._id, distributedAmount);
    }

    // Create SP2D record FIRST
    const sp2dId = await ctx.db.insert("sp2dRefs", {
      npdId: args.npdId,
      noSPM: args.noSPM,
      noSP2D: args.noSP2D,
      tglSP2D: args.tglSP2D,
      nilaiCair: args.nilaiCair,
      catatan: args.catatan,
      organizationId: user.organizationId,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Now create realization records with the sp2dId
    for (const [npdLineId, distributedAmount] of distributionMap) {
      const line = npdLines.find(l => l._id === npdLineId);
      if (!line) continue;

      // Update realization for each account
      await ctx.db.insert("realizations", {
        accountId: line.accountId,
        npdId: args.npdId,
        sp2dId: sp2dId, // Now available after SP2D creation
        totalCair: distributedAmount,
        catatan: `Distribusi proporsional dari SP2D ${args.noSP2D}`,
        organizationId: user.organizationId,
        createdBy: userId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      // Update account's remaining budget and realization
      const account = await ctx.db.get(line.accountId);
      if (account) {
        await ctx.db.patch(line.accountId, {
          sisaPagu: account.sisaPagu - distributedAmount,
          realisasiTahun: account.realisasiTahun + distributedAmount,
          updatedAt: Date.now(),
        });
      }
    }

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "created",
      entityTable: "sp2dRefs",
      entityId: sp2dId,
      actorUserId: userId,
      organizationId: user.organizationId,
      createdAt: Date.now(),
    });

    return sp2dId;
  },
});

// Distribute SP2D amount to NPD lines (realization calculation)
export const distributeToRealizations = mutation({
  args: {
    sp2dId: v.id("sp2dRefs"),
    distributionMap: v.record(v.id("npdLines"), v.number()),
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

    // Get SP2D record
    const sp2d = await ctx.db.get(args.sp2dId);
    if (!sp2d || sp2d.organizationId !== user.organizationId) {
      throw new Error("SP2D not found or access denied");
    }

    // Check if user has permission to manage realisasi
    const canManageRealisasi = await hasPermission(ctx, userId, 'update', 'realisasi');
    if (!canManageRealisasi) {
      throw new Error("You don't have permission to manage realizations");
    }

    // Get NPD to verify it's finalized
    const npd = await ctx.db.get(sp2d.npdId);
    if (!npd || npd.status !== "final") {
      throw new Error("SP2D must be linked to finalized NPD");
    }

    // Get all NPD lines for this NPD
    const npdLines = await ctx.db
      .query("npdLines")
      .withIndex("by_npd", q => q.eq("npdId", sp2d.npdId))
      .collect();

    // Validate total distribution amount matches SP2D amount
    const totalDistribution = Object.values(args.distributionMap).reduce((sum, amount) => sum + amount, 0);
    if (totalDistribution !== sp2d.nilaiCair) {
      throw new Error(`Total distribution (${totalDistribution}) must equal SP2D amount (${sp2d.nilaiCair})`);
    }

    // Process each distribution
    for (const [npdLineId, amount] of Object.entries(args.distributionMap)) {
      const line = npdLines.find(l => l._id === npdLineId);
      if (!line) {
        throw new Error(`NPD line ${npdLineId} not found`);
      }

      const account = await ctx.db.get(line.accountId);
      if (!account) {
        throw new Error(`Account ${line.accountId} not found`);
      }

      // Check if amount exceeds remaining budget
      if (amount > account.sisaPagu) {
        throw new Error(`Distribution amount (${amount}) exceeds remaining budget for account ${account.kode}. Available: ${account.sisaPagu}`);
      }

      // Update account's remaining budget and realization
      const newSisaPagu = account.sisaPagu - amount;
      const newRealisasiTahun = account.realisasiTahun + amount;

      await ctx.db.patch(line.accountId, {
        sisaPagu: newSisaPagu,
        realisasiTahun: newRealisasiTahun,
        updatedAt: Date.now(),
      });

      // Create or update realization record
      const existingRealization = await ctx.db
        .query("realizations")
        .withIndex("by_account", q => q.eq("accountId", line.accountId))
        .first();

      if (existingRealization) {
        // Update existing realization
        await ctx.db.patch(existingRealization._id, {
          npdId: sp2d.npdId,
          sp2dId: args.sp2dId,
          totalCair: existingRealization.totalCair + amount,
          updatedAt: Date.now(),
        });
      } else {
        // Create new realization
        await ctx.db.insert("realizations", {
          accountId: line.accountId,
          npdId: sp2d.npdId,
          sp2dId: args.sp2dId,
          totalCair: amount,
          organizationId: user.organizationId,
          createdBy: userId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      // Create audit log for realization update
      await ctx.db.insert("auditLogs", {
        action: "realization_updated",
        entityTable: "rkaAccounts",
        entityId: line.accountId,
        actorUserId: userId,
        organizationId: user.organizationId,
        keterangan: `SP2D ${sp2d.noSP2D} distributed: ${formatCurrency(amount)} to account ${account.kode}`,
        createdAt: Date.now(),
      });
    }

    // Create audit log for SP2D distribution
    await ctx.db.insert("auditLogs", {
      action: "distributed",
      entityTable: "sp2dRefs",
      entityId: args.sp2dId,
      actorUserId: userId,
      organizationId: user.organizationId,
      keterangan: `Distributed ${formatCurrency(sp2d.nilaiCair)} to ${Object.keys(args.distributionMap).length} NPD lines`,
      createdAt: Date.now(),
    });

    return { success: true, totalDistributed: totalDistribution };
  },
});