import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all audit logs for the organization (consolidated from activityLogs)
export const list = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the user to find their organization
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get all audit logs for the organization
    let auditLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .order("desc")
      .collect();

    // Apply pagination if specified
    if (args.offset && args.offset > 0) {
      auditLogs = auditLogs.slice(args.offset);
    }

    if (args.limit && args.limit > 0) {
      auditLogs = auditLogs.slice(0, args.limit);
    }

    // Get user information for each audit log
    const auditLogsWithUsers = await Promise.all(
      auditLogs.map(async (log) => {
        const logUser = await ctx.db.get(log.actorUserId);
        return {
          ...log,
          user: logUser ? {
            id: logUser._id,
            name: logUser.name,
            email: logUser.email,
          } : null,
        };
      })
    );

    return auditLogsWithUsers;
  },
});

// Get audit logs for a specific entity
export const getByEntity = query({
  args: {
    entityTable: v.string(), // Changed from entityType to entityTable to match auditLogs schema
    entityId: v.string(), // Now a string to match audit logs schema
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the user to find their organization
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get all audit logs for the entity
    const auditLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_entity", (q) => 
        q.eq("entityTable", args.entityTable).eq("entityId", args.entityId)
      )
      .order("desc")
      .collect();

    // Filter by organization
    const organizationLogs = auditLogs.filter(
      log => log.organizationId === user.organizationId
    );

    // Get user information for each audit log
    const auditLogsWithUsers = await Promise.all(
      organizationLogs.map(async (log) => {
        const logUser = await ctx.db.get(log.actorUserId);
        return {
          ...log,
          user: logUser ? {
            id: logUser._id,
            name: logUser.name,
            email: logUser.email,
          } : null,
        };
      })
    );

    return auditLogsWithUsers;
  },
});

// Get audit logs for a specific user
export const getByUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    // Get the current user to find their organization
    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser) {
      throw new Error("User not found");
    }

    // Get the target user
    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser) {
      throw new Error("Target user not found");
    }

    // Check if the target user is in the same organization
    if (targetUser.organizationId !== currentUser.organizationId) {
      throw new Error("Access denied");
    }

    // Get all audit logs for the user (using actorUserId)
    let auditLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_actor", (q) => q.eq("actorUserId", args.userId))
      .order("desc")
      .collect();

    // Apply pagination if specified
    if (args.offset && args.offset > 0) {
      auditLogs = auditLogs.slice(args.offset);
    }

    if (args.limit && args.limit > 0) {
      auditLogs = auditLogs.slice(0, args.limit);
    }

    return auditLogs;
  },
});

// Get audit logs by action type
export const getByAction = query({
  args: {
    action: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the user to find their organization
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get all audit logs for the organization
    let auditLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .order("desc")
      .collect();

    // Filter by action type
    let actionLogs = auditLogs.filter(log => log.action === args.action);

    // Apply pagination if specified
    if (args.offset && args.offset > 0) {
      actionLogs = actionLogs.slice(args.offset);
    }

    if (args.limit && args.limit > 0) {
      actionLogs = actionLogs.slice(0, args.limit);
    }

    // Get user information for each audit log
    const auditLogsWithUsers = await Promise.all(
      actionLogs.map(async (log) => {
        const logUser = await ctx.db.get(log.actorUserId);
        return {
          ...log,
          user: logUser ? {
            id: logUser._id,
            name: logUser.name,
            email: logUser.email,
          } : null,
        };
      })
    );

    return auditLogsWithUsers;
  },
});

// Get audit logs by date range
export const getByDateRange = query({
  args: {
    startDate: v.number(),
    endDate: v.number(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the user to find their organization
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get all audit logs for the organization
    let auditLogs = await ctx.db
      .query("auditLogs")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .order("desc")
      .collect();

    // Filter by date range
    let dateRangeLogs = auditLogs.filter(
      log => log.createdAt >= args.startDate && log.createdAt <= args.endDate
    );

    // Apply pagination if specified
    if (args.offset && args.offset > 0) {
      dateRangeLogs = dateRangeLogs.slice(args.offset);
    }

    if (args.limit && args.limit > 0) {
      dateRangeLogs = dateRangeLogs.slice(0, args.limit);
    }

    // Get user information for each audit log
    const auditLogsWithUsers = await Promise.all(
      dateRangeLogs.map(async (log) => {
        const logUser = await ctx.db.get(log.actorUserId);
        return {
          ...log,
          user: logUser ? {
            id: logUser._id,
            name: logUser.name,
            email: logUser.email,
          } : null,
        };
      })
    );

    return auditLogsWithUsers;
  },
});
