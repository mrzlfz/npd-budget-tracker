import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Import progress tracking states
export const createImportProgress = mutation({
  args: {
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
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const progressId = await ctx.db.insert("importProgress", {
      organizationId: args.organizationId,
      importType: args.importType,
      totalRows: args.totalRows,
      status: args.status,
      currentRow: args.currentRow,
      errors: args.errors,
      metadata: args.metadata,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return progressId;
  },
});

export const updateImportProgress = mutation({
  args: {
    progressId: v.id("importProgress"),
    status: v.optional(v.string()),
    currentRow: v.optional(v.number()),
    errors: v.optional(v.array(v.object({
      row: v.number(),
      field: v.string(),
      message: v.string(),
    }))),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.progressId);
    if (!existing) {
      throw new Error("Import progress not found");
    }

    const updated = await ctx.db.patch(args.progressId, {
      status: args.status || existing.status,
      currentRow: args.currentRow ?? existing.currentRow,
      errors: args.errors ?? existing.errors,
      metadata: args.metadata ?? existing.metadata,
      updatedAt: Date.now(),
    });

    return updated;
  },
});

export const getImportProgress = query({
  args: {
    organizationId: v.id("organizations"),
    importType: v.optional(v.string()),
  },
  handler: async (ctx, { organizationId, importType }) => {
    let query = ctx.db
      .query("importProgress")
      .withIndex("by_organization", q => q.eq("organizationId", organizationId))
      .order("desc");

    if (importType) {
      query = query.filter(q => q.eq(q.field("importType"), importType));
    }

    const progress = await query.take(10).collect();
    return progress;
  },
});

export const getImportProgressById = query({
  args: {
    progressId: v.id("importProgress"),
  },
  handler: async (ctx, { progressId }) => {
    const progress = await ctx.db.get(progressId);
    return progress;
  },
});

export const deleteImportProgress = mutation({
  args: {
    progressId: v.id("importProgress"),
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const progress = await ctx.db.get(args.progressId);
    if (!progress) {
      throw new Error("Import progress not found");
    }

    if (progress.organizationId !== args.organizationId) {
      throw new Error("Access denied");
    }

    await ctx.db.delete(args.progressId);
    return { success: true };
  },
});

// Clean up old import progress (older than 24 hours)
export const cleanupOldImportProgress = mutation({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, { organizationId }) => {
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);

    const oldProgress = await ctx.db
      .query("importProgress")
      .withIndex("by_organization", q =>
        q.eq("organizationId", organizationId)
         .lt("createdAt", twentyFourHoursAgo)
      )
      .collect();

    // Delete old progress records
    for (const progress of oldProgress) {
      await ctx.db.delete(progress._id);
    }

    return {
      deletedCount: oldProgress.length,
      message: `Cleaned up ${oldProgress.length} old import progress records`
    };
  },
});