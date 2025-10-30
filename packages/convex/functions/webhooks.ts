import { mutation, query } from './_generated/server';
import { v } from 'convex/values';

// Sync or create user from Clerk
export const syncUser = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_user_id')
      .eq('clerkUserId', args.clerkUserId)
      .first();

    if (existingUser) {
      // Update existing user
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        name: args.name,
        organizationId: args.organizationId ? args.organizationId : existingUser.organizationId,
        updatedAt: Date.now(),
      });
      return existingUser._id;
    }

    // Create new user
    const userId = await ctx.db.insert('users', {
      clerkUserId: args.clerkUserId,
      email: args.email,
      name: args.name,
      organizationId: args.organizationId,
      role: 'viewer', // Default role
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert('auditLogs', {
      action: 'created',
      entityTable: 'users',
      entityId: userId,
      actorUserId: userId,
      organizationId: args.organizationId || userId,
      keterangan: `User synced from Clerk: ${args.email}`,
      createdAt: Date.now(),
    });

    return userId;
  },
});

// Update user from Clerk
export const updateUser = mutation({
  args: {
    clerkUserId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_user_id')
      .eq('clerkUserId', args.clerkUserId)
      .first();

    if (!user) {
      throw new Error(`User not found: ${args.clerkUserId}`);
    }

    await ctx.db.patch(user._id, {
      email: args.email,
      name: args.name,
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert('auditLogs', {
      action: 'updated',
      entityTable: 'users',
      entityId: user._id,
      entityData: { before: { email: user.email, name: user.name }, after: { email: args.email, name: args.name } },
      actorUserId: user._id,
      organizationId: user.organizationId,
      keterangan: `User updated from Clerk: ${args.email}`,
      createdAt: Date.now(),
    });

    return user._id;
  },
});

// Deactivate user (soft delete)
export const deactivateUser = mutation({
  args: {
    clerkUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_user_id')
      .eq('clerkUserId', args.clerkUserId)
      .first();

    if (!user) {
      throw new Error(`User not found: ${args.clerkUserId}`);
    }

    // Soft delete by setting role to inactive (or you could add an isActive field)
    await ctx.db.patch(user._id, {
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert('auditLogs', {
      action: 'deleted',
      entityTable: 'users',
      entityId: user._id,
      actorUserId: user._id,
      organizationId: user.organizationId,
      keterangan: `User deactivated from Clerk: ${args.clerkUserId}`,
      createdAt: Date.now(),
    });

    return user._id;
  },
});

// Sync or create organization from Clerk
export const syncOrganization = mutation({
  args: {
    clerkOrganizationId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if organization already exists
    const existingOrg = await ctx.db
      .query('organizations')
      .withIndex('by_clerk_organization_id')
      .eq('clerkOrganizationId', args.clerkOrganizationId)
      .first();

    if (existingOrg) {
      // Update existing organization
      await ctx.db.patch(existingOrg._id, {
        name: args.name,
        description: args.description,
        updatedAt: Date.now(),
      });
      return existingOrg._id;
    }

    // Create new organization
    const organizationId = await ctx.db.insert('organizations', {
      name: args.name,
      description: args.description,
      clerkOrganizationId: args.clerkOrganizationId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert('auditLogs', {
      action: 'created',
      entityTable: 'organizations',
      entityId: organizationId,
      actorUserId: organizationId, // Self-reference for system actions
      organizationId,
      keterangan: `Organization synced from Clerk: ${args.name}`,
      createdAt: Date.now(),
    });

    return organizationId;
  },
});

// Update organization from Clerk
export const updateOrganization = mutation({
  args: {
    clerkOrganizationId: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query('organizations')
      .withIndex('by_clerk_organization_id')
      .eq('clerkOrganizationId', args.clerkOrganizationId)
      .first();

    if (!organization) {
      throw new Error(`Organization not found: ${args.clerkOrganizationId}`);
    }

    await ctx.db.patch(organization._id, {
      name: args.name,
      description: args.description,
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert('auditLogs', {
      action: 'updated',
      entityTable: 'organizations',
      entityId: organization._id,
      entityData: { before: { name: organization.name, description: organization.description }, after: { name: args.name, description: args.description } },
      actorUserId: organization._id,
      organizationId: organization._id,
      keterangan: `Organization updated from Clerk: ${args.name}`,
      createdAt: Date.now(),
    });

    return organization._id;
  },
});

// Deactivate organization (soft delete)
export const deactivateOrganization = mutation({
  args: {
    clerkOrganizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const organization = await ctx.db
      .query('organizations')
      .withIndex('by_clerk_organization_id')
      .eq('clerkOrganizationId', args.clerkOrganizationId)
      .first();

    if (!organization) {
      throw new Error(`Organization not found: ${args.clerkOrganizationId}`);
    }

    await ctx.db.patch(organization._id, {
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert('auditLogs', {
      action: 'deleted',
      entityTable: 'organizations',
      entityId: organization._id,
      actorUserId: organization._id,
      organizationId: organization._id,
      keterangan: `Organization deactivated from Clerk: ${args.clerkOrganizationId}`,
      createdAt: Date.now(),
    });

    return organization._id;
  },
});

// Update user organization membership
export const updateUserMembership = mutation({
  args: {
    clerkUserId: v.string(),
    organizationId: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the user
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_user_id')
      .eq('clerkUserId', args.clerkUserId)
      .first();

    if (!user) {
      throw new Error(`User not found: ${args.clerkUserId}`);
    }

    // Get the organization
    const organization = await ctx.db
      .query('organizations')
      .withIndex('by_clerk_organization_id')
      .eq('clerkOrganizationId', args.organizationId)
      .first();

    if (!organization) {
      throw new Error(`Organization not found: ${args.organizationId}`);
    }

    // Update user's organization and role
    await ctx.db.patch(user._id, {
      organizationId: organization._id,
      role: args.role === 'admin' ? 'admin' :
             args.role === 'org:admin' ? 'admin' :
             args.role === 'member' ? 'viewer' :
             args.role === 'basic_member' ? 'viewer' : 'viewer',
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert('auditLogs', {
      action: 'updated',
      entityTable: 'users',
      entityId: user._id,
      entityData: { before: { organizationId: user.organizationId, role: user.role }, after: { organizationId: organization._id, role: args.role } },
      actorUserId: user._id,
      organizationId: organization._id,
      keterangan: `User membership updated: ${args.clerkUserId} -> ${args.organizationId} (${args.role})`,
      createdAt: Date.now(),
    });

    return user._id;
  },
});

// Remove user organization membership
export const removeUserMembership = mutation({
  args: {
    clerkUserId: v.string(),
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    // Get the user
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_user_id')
      .eq('clerkUserId', args.clerkUserId)
      .first();

    if (!user) {
      throw new Error(`User not found: ${args.clerkUserId}`);
    }

    // Update user's organization to null and role to viewer
    await ctx.db.patch(user._id, {
      organizationId: null,
      role: 'viewer',
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert('auditLogs', {
      action: 'updated',
      entityTable: 'users',
      entityId: user._id,
      entityData: { before: { organizationId: user.organizationId, role: user.role }, after: { organizationId: null, role: 'viewer' } },
      actorUserId: user._id,
      organizationId: user.organizationId,
      keterangan: `User membership removed: ${args.clerkUserId} from ${args.organizationId}`,
      createdAt: Date.now(),
    });

    return user._id;
  },
});