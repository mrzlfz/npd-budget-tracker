import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get the current user
export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      return null;
    }

    // Get the organization information
    const organization = await ctx.db.get(user.organizationId);

    return {
      ...user,
      organization: organization ? {
        id: organization._id,
        name: organization.name,
        description: organization.description,
      } : null,
    };
  },
});

// Create or update a user when they sign in
export const createOrUpdate = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    clerkOrganizationId: v.string(),
    organizationName: v.string(),
    organizationDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if the organization already exists
    const existingOrganization = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_organization_id", (q) => q.eq("clerkOrganizationId", args.clerkOrganizationId))
      .first();

    let organizationId;
    if (existingOrganization) {
      organizationId = existingOrganization._id;
    } else {
      // Create a new organization
      organizationId = await ctx.db.insert("organizations", {
        name: args.organizationName,
        description: args.organizationDescription,
        clerkOrganizationId: args.clerkOrganizationId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Check if the user already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_user_id", (q) => q.eq("clerkUserId", args.clerkUserId))
      .first();

    if (existingUser) {
      // Update the existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        organizationId,
        updatedAt: Date.now(),
      });
      return existingUser._id;
    } else {
      // Create a new user
      const userId = await ctx.db.insert("users", {
        clerkUserId: args.clerkUserId,
        email: args.email,
        name: args.name,
        organizationId,
        role: "viewer", // Default role (Auditor/Viewer)
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      return userId;
    }
  },
});

// Get all users in the organization
export const list = query({
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

// Update a user's role
export const updateRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    // Get the current user to check their role
    const currentUser = await ctx.db.get(currentUserId);
    if (!currentUser || currentUser.role !== "admin") {
      throw new Error("Access denied");
    }

    // Get the user to update
    const userToUpdate = await ctx.db.get(args.userId);
    if (!userToUpdate) {
      throw new Error("User not found");
    }

    // Check if the user is in the same organization
    if (userToUpdate.organizationId !== currentUser.organizationId) {
      throw new Error("Access denied");
    }

    // Update the user's role
    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: Date.now(),
    });

    return args.userId;
  },
});
