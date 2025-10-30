import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get the current user's organization
export const getCurrent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the user to find their organization
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get the organization
    const organization = await ctx.db.get(user.organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    return organization;
  },
});

// Get an organization by ID
export const getById = query({
  args: {
    id: v.id("organizations"),
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

    // Get the organization
    const organization = await ctx.db.get(args.id);
    if (!organization) {
      throw new Error("Organization not found");
    }

    // Check if the user has access to this organization
    if (organization._id !== user.organizationId) {
      throw new Error("Access denied");
    }

    return organization;
  },
});

// Update organization PDF template
export const updatePdfTemplate = mutation({
  args: {
    organizationId: v.id("organizations"),
    templateConfig: v.optional(v.object({
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
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const { organizationId, templateConfig } = args;

    // Get the user to verify admin role
    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") {
      throw new Error("Insufficient permissions");
    }

    // Get existing organization
    const organization = await ctx.db.get(organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    // Verify user belongs to this organization
    if (user.organizationId !== organizationId) {
      throw new Error("Access denied");
    }

    // Update organization with new template config
    await ctx.db.patch(organizationId, {
      pdfTemplateConfig: templateConfig,
      updatedAt: Date.now(),
    });

    // Log the change
    await ctx.db.insert("auditLogs", {
      action: "updated",
      entityTable: "organizations",
      entityId: organizationId,
      entityData: {
        before: organization.pdfTemplateConfig,
        after: templateConfig,
      },
      actorUserId: userId,
      organizationId,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Create a new organization
export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the user
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Check if the user is already in an organization
    if (user.organizationId) {
      throw new Error("User is already in an organization");
    }

    // Create the organization
    const organizationId = await ctx.db.insert("organizations", {
      name: args.name,
      description: args.description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update the user with the organization ID and set as admin
    await ctx.db.patch(userId, {
      organizationId,
      role: "admin",
    });

    // Log the activity
    await ctx.db.insert("activityLogs", {
      action: "created",
      entityType: "organization",
      entityId: organizationId,
      userId,
      organizationId,
      details: `Created organization: ${args.name}`,
      createdAt: Date.now(),
    });

    return organizationId;
  },
});

// Update an organization
export const update = mutation({
  args: {
    name: v.optional(v.string()),
    description: v.optional(v.string()),
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

    // Check if the user is an admin
    if (user.role !== "admin") {
      throw new Error("Access denied");
    }

    // Get the organization
    const organization = await ctx.db.get(user.organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    // Update the organization
    await ctx.db.patch(user.organizationId, {
      ...args,
      updatedAt: Date.now(),
    });

    // Log the activity
    await ctx.db.insert("activityLogs", {
      action: "updated",
      entityType: "organization",
      entityId: user.organizationId,
      userId,
      organizationId: user.organizationId,
      details: `Updated organization: ${organization.name}`,
      createdAt: Date.now(),
    });

    return user.organizationId;
  },
});

// Get all users in the organization
export const getUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the user to find their organization
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get all users in the organization
    const users = await ctx.db
      .query("users")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .collect();

    return users;
  },
});

// Get organization statistics
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get the user to find their organization
    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get all users in the organization
    const users = await ctx.db
      .query("users")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .collect();

    // Get all RKA documents in the organization
    const rkaDocuments = await ctx.db
      .query("rkaDocuments")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .collect();

    // Get all NPD documents in the organization
    const npdDocuments = await ctx.db
      .query("npdDocuments")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .collect();

    // Calculate statistics
    const stats = {
      totalUsers: users.length,
      totalRkaDocuments: rkaDocuments.length,
      totalNpdDocuments: npdDocuments.length,
      totalBudget: rkaDocuments.reduce((sum, doc) => sum + doc.totalBudget, 0),
      rkaDocumentsByStatus: {
        draft: rkaDocuments.filter(doc => doc.status === "draft").length,
        submitted: rkaDocuments.filter(doc => doc.status === "submitted").length,
        approved: rkaDocuments.filter(doc => doc.status === "approved").length,
        rejected: rkaDocuments.filter(doc => doc.status === "rejected").length,
      },
      npdDocumentsByStatus: {
        draft: npdDocuments.filter(doc => doc.status === "draft").length,
        submitted: npdDocuments.filter(doc => doc.status === "submitted").length,
        approved: npdDocuments.filter(doc => doc.status === "approved").length,
        rejected: npdDocuments.filter(doc => doc.status === "rejected").length,
      },
    };

    return stats;
  },
});
