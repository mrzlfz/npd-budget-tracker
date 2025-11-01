import { v } from "convex/values";
import { query, mutation, internalAction } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { internal } from "./_generated/api";

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

// Get performance logs for subkegiatan
export const getBySubkegiatan = query({
  args: {
    subkegiatanId: v.id("rkaSubkegiatans"),
    periode: v.optional(v.string()),
    tahun: v.optional(v.number()),
  },
  handler: async (ctx, { subkegiatanId, periode, tahun }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Build base query
    let baseQuery = ctx.db.query("performanceLogs")
      .withIndex("by_subkegiatan", q => q.eq("subkegiatanId", subkegiatanId));

    // Apply filters
    if (periode) {
      baseQuery = baseQuery.filter(log => log.periode === periode);
    }

    if (tahun) {
      baseQuery = baseQuery.filter(log => {
        // Extract year from subkegiatan to compare
        const subkegiatan = await ctx.db.get(log.subkegiatanId);
        return subkegiatan && subkegiatan.fiscalYear === tahun;
      });
    }

    const logs = await baseQuery.collect();

    return logs;
  },
});

// Get performance logs with subkegiatan details
export const getWithDetails = query({
  args: {
    subkegiatanId: v.id("rkaSubkegiatans"),
  },
  handler: async (ctx, { subkegiatanId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get subkegiatan details
    const subkegiatan = await ctx.db.get(subkegiatanId);
    if (!subkegiatan || subkegiatan.organizationId !== user.organizationId) {
      throw new Error("Subkegiatan not found or access denied");
    }

    // Get all performance logs for this subkegiatan
    const logs = await ctx.db
      .query("performanceLogs")
      .withIndex("by_subkegiatan", q => q.eq("subkegiatanId", subkegiatanId))
      .collect();

    // Calculate performance summary
    const uniqueIndicators = [...new Set(logs.map(log => log.indikatorNama))];

    const performanceSummary = uniqueIndicators.map(indikator => {
      const indicatorLogs = logs.filter(log => log.indikatorNama === indikator);

      const totalTarget = indicatorLogs.reduce((sum, log) => sum + log.target, 0);
      const totalRealisasi = indicatorLogs.reduce((sum, log) => sum + log.realisasi, 0);
      const avgTarget = totalTarget > 0 ? totalTarget / indicatorLogs.length : 0;
      const avgRealisasi = totalRealisasi > 0 ? totalRealisasi / indicatorLogs.length : 0;
      const latestRealisasi = indicatorLogs.length > 0 ?
        indicatorLogs.reduce((latest, log) =>
          log.realisasi > latest.realisasi ? log : latest
        , indicatorLogs[0]).realisasi : 0;

      return {
        indikatorNama: indikator,
        totalTarget,
        totalRealisasi,
        avgTarget,
        avgRealisasi,
        latestRealisasi,
        persenCapaian: avgTarget > 0 ? (totalRealisasi / totalTarget) * 100 : 0,
        persenCapaianTerakhir: avgTarget > 0 ? (latestRealisasi / avgTarget) * 100 : 0,
        jumlahLogs: indicatorLogs.length,
      };
    });

    return {
      subkegiatan,
      performanceLogs: logs,
      performanceSummary,
    };
  },
});

// Create performance log entry
export const create = mutation({
  args: {
    subkegiatanId: v.id("rkaSubkegiatans"),
    indikatorNama: v.string(),
    target: v.number(),
    realisasi: v.number(),
    satuan: v.string(),
    periode: v.string(),
    buktiURL: v.optional(v.string()),
    keterangan: v.optional(v.string()),
    buktiFile: v.optional(v.any()), // For file uploads
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

    // Check if user has permission to create performance logs
    const canCreatePerformance = await hasPermission(ctx, userId, 'create', 'performance');
    if (!canCreatePerformance) {
      throw new Error("You don't have permission to create performance logs");
    }

    // Validate values
    if (args.realisasi < 0 || args.target < 0) {
      throw new Error("Realisasi and target must be positive numbers");
    }

    if (args.realisasi > args.target * 2) {
      throw new Error("Realisasi cannot exceed 200% of target");
    }

    let buktiURL = args.buktiURL;

    // Handle file upload if provided
    if (args.buktiFile && args.buktiFile.size > 0) {
      // In real implementation, you would upload to file storage
      // For now, just store metadata
      buktiURL = `https://storage.example.com/bukti/${Date.now()}_${args.buktiFile.name}`;

      // Here you would actually upload the file:
      // const storageRef = ctx.storage.store("evidenceFiles");
      // const fileId = await storageRef.put(args.buktiFile.name, args.buktiFile);
      // buktiURL = await storageRef.getUrl(fileId);
    }

    // Create performance log
    const logId = await ctx.db.insert("performanceLogs", {
      subkegiatanId: args.subkegiatanId,
      indikatorNama: args.indikatorNama,
      target: args.target,
      realisasi: args.realisasi,
      satuan: args.satuan,
      periode: args.periode,
      buktiURL,
      buktiType: args.buktiFile ? args.buktiFile.type : "document",
      buktiName: args.buktiFile ? args.buktiFile.name : undefined,
      buktiSize: args.buktiFile ? args.buktiFile.size : undefined,
      keterangan: args.keterangan,
      approvalStatus: "draft",
      organizationId: user.organizationId,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "created",
      entityTable: "performanceLogs",
      entityId: logId,
      actorUserId: userId,
      organizationId: user.organizationId,
      keterangan: `Created performance log for ${args.indikatorNama}: ${args.realisasi}/${args.target} ${args.satuan}`,
      createdAt: Date.now(),
    });

    return logId;
  },
});

// Update performance log entry
export const update = mutation({
  args: {
    logId: v.id("performanceLogs"),
    indikatorNama: v.optional(v.string()),
    target: v.optional(v.number()),
    realisasi: v.optional(v.number()),
    satuan: v.optional(v.string()),
    periode: v.optional(v.string()),
    buktiURL: v.optional(v.string()),
    keterangan: v.optional(v.string()),
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

    const existingLog = await ctx.db.get(args.logId);
    if (!existingLog) {
      throw new Error("Performance log not found");
    }

    // Check if user has permission to update performance logs
    const canUpdatePerformance = await hasPermission(ctx, userId, 'update', 'performance');
    if (!canUpdatePerformance) {
      throw new Error("You don't have permission to update performance logs");
    }

    // Validate update permissions (can only update own logs or admin)
    if (existingLog.createdBy !== userId && user.role !== 'admin') {
      throw new Error("You can only update your own performance logs");
    }

    // Update performance log
    const updated = await ctx.db.patch(args.logId, {
      indikatorNama: args.indikatorNama || existingLog.indikatorNama,
      target: args.target || existingLog.target,
      realisasi: args.realisasi || existingLog.realisasi,
      satuan: args.satuan || existingLog.satuan,
      periode: args.periode || existingLog.periode,
      buktiURL: args.buktiURL || existingLog.buktiURL,
      keterangan: args.keterangan || existingLog.keterangan,
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "updated",
      entityTable: "performanceLogs",
      entityData: {
        before: existingLog,
        after: updated,
      },
      entityId: args.logId,
      actorUserId: userId,
      organizationId: user.organizationId,
      keterangan: `Updated performance log for ${updated.indikatorNama}`,
      createdAt: Date.now(),
    });

    return updated;
  },
});

// Delete performance log entry
export const remove = mutation({
  args: {
    logId: v.id("performanceLogs"),
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

    const existingLog = await ctx.db.get(args.logId);
    if (!existingLog) {
      throw new Error("Performance log not found");
    }

    // Check if user has permission to delete performance logs
    const canDeletePerformance = await hasPermission(ctx, userId, 'delete', 'performance');
    if (!canDeletePerformance) {
      throw new Error("You don't have permission to delete performance logs");
    }

    // Validate delete permissions (can only delete own logs or admin)
    if (existingLog.createdBy !== userId && user.role !== 'admin') {
      throw new Error("You can only delete your own performance logs");
    }

    // Delete performance log
    await ctx.db.delete(args.logId);

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "deleted",
      entityTable: "performanceLogs",
      entityData: {
        before: existingLog,
      },
      entityId: args.logId,
      actorUserId: userId,
      organizationId: user.organizationId,
      keterangan: `Deleted performance log for ${existingLog.indikatorNama}`,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});