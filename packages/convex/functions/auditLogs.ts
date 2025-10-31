import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { paginationOptsValidator } from "convex/server";

// Query to get audit logs with filtering and pagination
export const getAuditLogs = query({
  args: {
    organizationId: v.id("organizations"),
    filters: v.optional(v.object({
      action: v.optional(v.string()),
      entityTable: v.optional(v.string()),
      actorUserId: v.optional(v.id("users")),
      dateFrom: v.optional(v.number()),
      dateTo: v.optional(v.number()),
      search: v.optional(v.string()),
    })),
    paginationOpts: v.optional(paginationOptsValidator),
  },
  handler: async (ctx, { organizationId, filters, paginationOpts }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Check if user has permission to view audit logs
    const user = await ctx.db.get(userId);
    if (!user || (user.role !== "admin" && user.role !== "verifikator")) {
      throw new Error("Insufficient permissions");
    }

    // Build the query
    let query = ctx.db
      .query("auditLogs")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .order("desc");

    // Apply filters
    if (filters?.action) {
      query = query.filter((q) => q.eq(q.field("action"), filters.action));
    }
    if (filters?.entityTable) {
      query = query.filter((q) => q.eq(q.field("entityTable"), filters.entityTable));
    }
    if (filters?.actorUserId) {
      query = query.filter((q) => q.eq(q.field("actorUserId"), filters.actorUserId));
    }
    if (filters?.dateFrom) {
      query = query.filter((q) => q.gte(q.field("createdAt"), filters.dateFrom));
    }
    if (filters?.dateTo) {
      query = query.filter((q) => q.lte(q.field("createdAt"), filters.dateTo));
    }
    if (filters?.search) {
      query = query.filter((q) =>
        q.or(
          q.contains(q.field("entityData"), filters.search),
          q.contains(q.field("keterangan"), filters.search)
        )
      );
    }

    // Apply pagination
    if (paginationOpts) {
      return await query.paginate(paginationOpts);
    } else {
      const logs = await query.collect();
      return { page: logs, isDone: true, continueCursor: null };
    }
  },
});

// Query to get audit log by ID
export const getAuditLogById = query({
  args: {
    organizationId: v.id("organizations"),
    auditLogId: v.id("auditLogs"),
  },
  handler: async (ctx, { organizationId, auditLogId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Check permissions
    const user = await ctx.db.get(userId);
    if (!user || (user.role !== "admin" && user.role !== "verifikator")) {
      throw new Error("Insufficient permissions");
    }

    const auditLog = await ctx.db.get(auditLogId);
    if (!auditLog || auditLog.organizationId !== organizationId) {
      throw new Error("Audit log not found");
    }

    return auditLog;
  },
});

// Query to get audit log statistics
export const getAuditLogStats = query({
  args: {
    organizationId: v.id("organizations"),
    dateFrom: v.optional(v.number()),
    dateTo: v.optional(v.number()),
  },
  handler: async (ctx, { organizationId, dateFrom, dateTo }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Check permissions
    const user = await ctx.db.get(userId);
    if (!user || (user.role !== "admin" && user.role !== "verifikator")) {
      throw new Error("Insufficient permissions");
    }

    let query = ctx.db
      .query("auditLogs")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId));

    if (dateFrom) {
      query = query.filter((q) => q.gte(q.field("createdAt"), dateFrom));
    }
    if (dateTo) {
      query = query.filter((q) => q.lte(q.field("createdAt"), dateTo));
    }

    const logs = await query.collect();

    // Calculate statistics
    const stats = {
      totalLogs: logs.length,
      actionCounts: {} as Record<string, number>,
      entityCounts: {} as Record<string, number>,
      actorCounts: {} as Record<string, number>,
      dailyActivity: {} as Record<string, number>,
    };

    logs.forEach((log) => {
      // Count by action
      stats.actionCounts[log.action] = (stats.actionCounts[log.action] || 0) + 1;

      // Count by entity
      stats.entityCounts[log.entityTable] = (stats.entityCounts[log.entityTable] || 0) + 1;

      // Count by actor
      stats.actorCounts[log.actorUserId] = (stats.actorCounts[log.actorUserId] || 0) + 1;

      // Daily activity
      const date = new Date(log.createdAt).toISOString().split('T')[0];
      stats.dailyActivity[date] = (stats.dailyActivity[date] || 0) + 1;
    });

    return stats;
  },
});

// Query to get recent activity logs
export const getRecentActivity = query({
  args: {
    organizationId: v.id("organizations"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { organizationId, limit = 50 }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Check permissions
    const user = await ctx.db.get(userId);
    if (!user || (user.role !== "admin" && user.role !== "verifikator")) {
      throw new Error("Insufficient permissions");
    }

    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .order("desc")
      .take(limit);

    return logs;
  },
});

// Mutation to create an audit log
export const createAuditLog = mutation({
  args: {
    organizationId: v.id("organizations"),
    action: v.string(),
    entityTable: v.string(),
    entityId: v.string(),
    entityData: v.optional(v.any()),
    actorUserId: v.optional(v.id("users")),
    keterangan: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const auditLogId = await ctx.db.insert("auditLogs", {
      ...args,
      createdAt: Date.now(),
    });

    return auditLogId;
  },
});

// Mutation to bulk create audit logs (for migrations or bulk operations)
export const bulkCreateAuditLogs = mutation({
  args: {
    logs: v.array(v.object({
      organizationId: v.id("organizations"),
      action: v.string(),
      entityTable: v.string(),
      entityId: v.string(),
      entityData: v.optional(v.any()),
      actorUserId: v.optional(v.id("users")),
      keterangan: v.optional(v.string()),
      ipAddress: v.optional(v.string()),
      userAgent: v.optional(v.string()),
    })),
  },
  handler: async (ctx, { logs }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Check permissions
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") {
      throw new Error("Insufficient permissions");
    }

    const auditLogIds = await Promise.all(
      logs.map(async (logData) => {
        return await ctx.db.insert("auditLogs", {
          ...logData,
          createdAt: Date.now(),
        });
      })
    );

    return auditLogIds;
  },
});

// Query to export audit logs
export const exportAuditLogs = query({
  args: {
    organizationId: v.id("organizations"),
    filters: v.optional(v.object({
      action: v.optional(v.string()),
      entityTable: v.optional(v.string()),
      actorUserId: v.optional(v.id("users")),
      dateFrom: v.optional(v.number()),
      dateTo: v.optional(v.number()),
    })),
    format: v.string(), // "csv" or "json"
  },
  handler: async (ctx, { organizationId, filters, format }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Check permissions
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") {
      throw new Error("Insufficient permissions");
    }

    // Build the query (similar to getAuditLogs but without pagination)
    let query = ctx.db
      .query("auditLogs")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .order("desc");

    // Apply filters
    if (filters?.action) {
      query = query.filter((q) => q.eq(q.field("action"), filters.action));
    }
    if (filters?.entityTable) {
      query = query.filter((q) => q.eq(q.field("entityTable"), filters.entityTable));
    }
    if (filters?.actorUserId) {
      query = query.filter((q) => q.eq(q.field("actorUserId"), filters.actorUserId));
    }
    if (filters?.dateFrom) {
      query = query.filter((q) => q.gte(q.field("createdAt"), filters.dateFrom));
    }
    if (filters?.dateTo) {
      query = query.filter((q) => q.lte(q.field("createdAt"), filters.dateTo));
    }

    const logs = await query.collect();

    // Enrich logs with user and entity information
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        const actor = log.actorUserId ? await ctx.db.get(log.actorUserId) : null;
        const organization = await ctx.db.get(log.organizationId);

        return {
          ...log,
          actorName: actor?.name || "System",
          actorEmail: actor?.email || "system@example.com",
          organizationName: organization?.name || "Unknown",
          createdAt: new Date(log.createdAt).toLocaleString('id-ID', {
            timeZone: 'Asia/Jakarta',
          }),
        };
      })
    );

    if (format === "csv") {
      // Convert to CSV format
      const headers = [
        "ID", "Action", "Entity", "Entity ID", "Actor", "Actor Email", "Organization",
        "Description", "IP Address", "Created At"
      ];

      const csvRows = enrichedLogs.map(log => [
        log._id,
        log.action,
        log.entityTable,
        log.entityId,
        log.actorName,
        log.actorEmail,
        log.organizationName,
        log.keterangan || "",
        log.ipAddress || "",
        log.createdAt,
      ]);

      return {
        format: "csv",
        data: [headers, ...csvRows],
        filename: `audit-logs-${new Date().toISOString().split('T')[0]}.csv`,
      };
    }

    return {
      format: "json",
      data: enrichedLogs,
      filename: `audit-logs-${new Date().toISOString().split('T')[0]}.json`,
    };
  },
});

// Query to get audit log actions for filters
export const getAvailableActions = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, { organizationId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Check permissions
    const user = await ctx.db.get(userId);
    if (!user || (user.role !== "admin" && user.role !== "verifikator")) {
      throw new Error("Insufficient permissions");
    }

    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();

    // Extract unique actions
    const actions = [...new Set(logs.map(log => log.action))];
    return actions.sort();
  },
});

// Query to get entity tables for filters
export const getAvailableEntityTables = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, { organizationId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Check permissions
    const user = await ctx.db.get(userId);
    if (!user || (user.role !== "admin" && user.role !== "verifikator")) {
      throw new Error("Insufficient permissions");
    }

    const logs = await ctx.db
      .query("auditLogs")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
      .collect();

    // Extract unique entity tables
    const entityTables = [...new Set(logs.map(log => log.entityTable))];
    return entityTables.sort();
  },
});

// Enhanced audit log helper functions
export const logNpdWorkflow = mutation({
  args: {
    organizationId: v.id("organizations"),
    npdId: v.id("npdDocuments"),
    action: v.string(), // "created", "submitted", "verified", "finalized", "rejected"
    previousStatus: v.optional(v.string()),
    newStatus: v.optional(v.string()),
    catatan: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db.get(userId);
    if (!user || user.organizationId !== args.organizationId) {
      throw new Error("Access denied");
    }

    // Get NPD details for audit
    const npd = await ctx.db.get(args.npdId);
    if (!npd) {
      throw new Error("NPD not found");
    }

    await ctx.db.insert("auditLogs", {
      action: args.action,
      entityTable: "npdDocuments",
      entityId: args.npdId,
      entityData: {
        previousStatus: args.previousStatus,
        newStatus: args.newStatus,
        documentNumber: npd.documentNumber,
        jenis: npd.jenis,
        tahun: npd.tahun,
        catatan: args.catatan,
      },
      actorUserId: userId,
      organizationId: args.organizationId,
      keterangan: `${args.action}: ${args.previousStatus || ''} → ${args.newStatus || ''}`,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Log SP2D creation with enhanced details
export const logSp2dCreation = mutation({
  args: {
    organizationId: v.id("organizations"),
    sp2dId: v.id("sp2dRefs"),
    npdId: v.id("npdDocuments"),
    nilaiCair: v.number(),
    distributionDetails: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db.get(userId);
    if (!user || user.organizationId !== args.organizationId) {
      throw new Error("Access denied");
    }

    // Get SP2D and NPD details for audit
    const [sp2d, npd] = await Promise.all([
      ctx.db.get(args.sp2dId),
      ctx.db.get(args.npdId),
    ]);

    if (!sp2d || !npd) {
      throw new Error("SP2D or NPD not found");
    }

    await ctx.db.insert("auditLogs", {
      action: "created",
      entityTable: "sp2dRefs",
      entityId: args.sp2dId,
      entityData: {
        sp2dNumber: sp2d.noSP2D,
        sp2dDate: new Date(sp2d.tglSP2D).toISOString(),
        nilaiCair: args.nilaiCair,
        npdDocumentNumber: npd.documentNumber,
        npdJenis: npd.jenis,
        distributionDetails: args.distributionDetails,
      },
      actorUserId: userId,
      organizationId: args.organizationId,
      keterangan: `SP2D ${sp2d.noSP2D} created for NPD ${npd.documentNumber}`,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Log constraint violations
export const logConstraintViolation = mutation({
  args: {
    organizationId: v.id("organizations"),
    entityType: v.string(), // "npdDocuments", "sp2dRefs", "rkaAccounts"
    entityId: v.string(),
    violationType: v.string(), // "budget_exceeded", "duplicate_entry", "invalid_transition"
    details: v.any(),
    severity: v.string(), // "error", "warning", "critical"
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const user = await ctx.db.get(userId);
    if (!user || user.organizationId !== args.organizationId) {
      throw new Error("Access denied");
    }

    await ctx.db.insert("auditLogs", {
      action: "constraint_violation",
      entityTable: args.entityType,
      entityId: args.entityId,
      entityData: {
        violationType: args.violationType,
        details: args.details,
        severity: args.severity,
      },
      actorUserId: userId,
      organizationId: args.organizationId,
      keterangan: `Constraint violation: ${args.violationType} - ${args.severity}`,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});