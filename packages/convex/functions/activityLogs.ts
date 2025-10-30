import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all activity logs for the organization
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

    // Get all activity logs for the organization
    let activityLogs = await ctx.db
      .query("activityLogs")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .order("desc")
      .collect();

    // Apply pagination if specified
    if (args.offset && args.offset > 0) {
      activityLogs = activityLogs.slice(args.offset);
    }

    if (args.limit && args.limit > 0) {
      activityLogs = activityLogs.slice(0, args.limit);
    }

    // Get user information for each activity log
    const activityLogsWithUsers = await Promise.all(
      activityLogs.map(async (log) => {
        const logUser = await ctx.db.get(log.userId);
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

    return activityLogsWithUsers;
  },
});

// Get activity logs for a specific entity
export const getByEntity = query({
  args: {
    entityType: v.string(),
    entityId: v.union(v.id("rkaDocuments"), v.id("npdDocuments"), v.id("budgetItems")),
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

    // Get all activity logs for the entity
    const activityLogs = await ctx.db
      .query("activityLogs")
      .withIndex("by_entity", (q) => 
        q.eq("entityType", args.entityType).eq("entityId", args.entityId)
      )
      .order("desc")
      .collect();

    // Filter by organization
    const organizationLogs = activityLogs.filter(
      log => log.organizationId === user.organizationId
    );

    // Get user information for each activity log
    const activityLogsWithUsers = await Promise.all(
      organizationLogs.map(async (log) => {
        const logUser = await ctx.db.get(log.userId);
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

    return activityLogsWithUsers;
  },
});

// Get activity logs for a specific user
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

    // Get all activity logs for the user
    let activityLogs = await ctx.db
      .query("activityLogs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    // Apply pagination if specified
    if (args.offset && args.offset > 0) {
      activityLogs = activityLogs.slice(args.offset);
    }

    if (args.limit && args.limit > 0) {
      activityLogs = activityLogs.slice(0, args.limit);
    }

    return activityLogs;
  },
});

// Get activity logs by action type
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

    // Get all activity logs for the organization
    let activityLogs = await ctx.db
      .query("activityLogs")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .order("desc")
      .collect();

    // Filter by action type
    const actionLogs = activityLogs.filter(log => log.action === args.action);

    // Apply pagination if specified
    if (args.offset && args.offset > 0) {
      actionLogs.slice(args.offset);
    }

    if (args.limit && args.limit > 0) {
      actionLogs.slice(0, args.limit);
    }

    // Get user information for each activity log
    const activityLogsWithUsers = await Promise.all(
      actionLogs.map(async (log) => {
        const logUser = await ctx.db.get(log.userId);
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

    return activityLogsWithUsers;
  },
});

// Get activity logs by date range
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

    // Get all activity logs for the organization
    let activityLogs = await ctx.db
      .query("activityLogs")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .order("desc")
      .collect();

    // Filter by date range
    const dateRangeLogs = activityLogs.filter(
      log => log.createdAt >= args.startDate && log.createdAt <= args.endDate
    );

    // Apply pagination if specified
    if (args.offset && args.offset > 0) {
      dateRangeLogs.slice(args.offset);
    }

    if (args.limit && args.limit > 0) {
      dateRangeLogs.slice(0, args.limit);
    }

    // Get user information for each activity log
    const activityLogsWithUsers = await Promise.all(
      dateRangeLogs.map(async (log) => {
        const logUser = await ctx.db.get(log.userId);
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

    return activityLogsWithUsers;
  },
});
