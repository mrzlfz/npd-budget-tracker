import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all budget items for an RKA document
export const getByRkaDocument = query({
  args: {
    rkaDocumentId: v.id("rkaDocuments"),
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

    // Get the RKA document
    const rkaDocument = await ctx.db.get(args.rkaDocumentId);
    if (!rkaDocument) {
      throw new Error("RKA document not found");
    }

    // Check if the user has access to this RKA document
    if (rkaDocument.organizationId !== user.organizationId) {
      throw new Error("Access denied");
    }

    // Get all budget items for this RKA document
    const budgetItems = await ctx.db
      .query("budgetItems")
      .withIndex("by_rka_document", (q) => q.eq("rkaDocumentId", args.rkaDocumentId))
      .collect();

    return budgetItems;
  },
});

// Create a new budget item
export const create = mutation({
  args: {
    rkaDocumentId: v.id("rkaDocuments"),
    name: v.string(),
    description: v.optional(v.string()),
    category: v.string(),
    amount: v.number(),
    quantity: v.number(),
    unitPrice: v.number(),
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

    // Get the RKA document
    const rkaDocument = await ctx.db.get(args.rkaDocumentId);
    if (!rkaDocument) {
      throw new Error("RKA document not found");
    }

    // Check if the user has access to this RKA document
    if (rkaDocument.organizationId !== user.organizationId) {
      throw new Error("Access denied");
    }

    // Check if the user can update this document
    if (
      rkaDocument.createdBy !== userId &&
      user.role !== "admin" &&
      user.role !== "admin"
    ) {
      throw new Error("Access denied");
    }

    // Create the budget item
    const budgetItemId = await ctx.db.insert("budgetItems", {
      rkaDocumentId: args.rkaDocumentId,
      name: args.name,
      description: args.description,
      category: args.category,
      amount: args.amount,
      quantity: args.quantity,
      unitPrice: args.unitPrice,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Calculate the new total budget for the RKA document
    const budgetItems = await ctx.db
      .query("budgetItems")
      .withIndex("by_rka_document", (q) => q.eq("rkaDocumentId", args.rkaDocumentId))
      .collect();

    const totalBudget = budgetItems.reduce((sum, item) => sum + item.amount, 0);

    // Update the RKA document with the new total budget
    await ctx.db.patch(args.rkaDocumentId, {
      totalBudget,
      updatedAt: Date.now(),
    });

    // Log the activity
    await ctx.db.insert("activityLogs", {
      action: "created",
      entityType: "budgetItem",
      entityId: budgetItemId,
      userId,
      organizationId: user.organizationId,
      details: `Created budget item: ${args.name} for RKA document: ${rkaDocument.title}`,
      createdAt: Date.now(),
    });

    return budgetItemId;
  },
});

// Update an existing budget item
export const update = mutation({
  args: {
    id: v.id("budgetItems"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    amount: v.optional(v.number()),
    quantity: v.optional(v.number()),
    unitPrice: v.optional(v.number()),
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

    // Get the budget item to update
    const budgetItem = await ctx.db.get(args.id);
    if (!budgetItem) {
      throw new Error("Budget item not found");
    }

    // Get the RKA document
    const rkaDocument = await ctx.db.get(budgetItem.rkaDocumentId);
    if (!rkaDocument) {
      throw new Error("RKA document not found");
    }

    // Check if the user has access to this RKA document
    if (rkaDocument.organizationId !== user.organizationId) {
      throw new Error("Access denied");
    }

    // Check if the user can update this document
    if (
      rkaDocument.createdBy !== userId &&
      user.role !== "admin" &&
      user.role !== "admin"
    ) {
      throw new Error("Access denied");
    }

    // Update the budget item
    const { id, ...updateData } = args;
    await ctx.db.patch(args.id, {
      ...updateData,
      updatedAt: Date.now(),
    });

    // Calculate the new total budget for the RKA document
    const budgetItems = await ctx.db
      .query("budgetItems")
      .withIndex("by_rka_document", (q) => q.eq("rkaDocumentId", budgetItem.rkaDocumentId))
      .collect();

    const totalBudget = budgetItems.reduce((sum, item) => sum + item.amount, 0);

    // Update the RKA document with the new total budget
    await ctx.db.patch(budgetItem.rkaDocumentId, {
      totalBudget,
      updatedAt: Date.now(),
    });

    // Log the activity
    await ctx.db.insert("activityLogs", {
      action: "updated",
      entityType: "budgetItem",
      entityId: args.id,
      userId,
      organizationId: user.organizationId,
      details: `Updated budget item: ${budgetItem.name} for RKA document: ${rkaDocument.title}`,
      createdAt: Date.now(),
    });

    return args.id;
  },
});

// Delete a budget item
export const remove = mutation({
  args: {
    id: v.id("budgetItems"),
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

    // Get the budget item to delete
    const budgetItem = await ctx.db.get(args.id);
    if (!budgetItem) {
      throw new Error("Budget item not found");
    }

    // Get the RKA document
    const rkaDocument = await ctx.db.get(budgetItem.rkaDocumentId);
    if (!rkaDocument) {
      throw new Error("RKA document not found");
    }

    // Check if the user has access to this RKA document
    if (rkaDocument.organizationId !== user.organizationId) {
      throw new Error("Access denied");
    }

    // Check if the user can update this document
    if (
      rkaDocument.createdBy !== userId &&
      user.role !== "admin" &&
      user.role !== "admin"
    ) {
      throw new Error("Access denied");
    }

    // Delete the budget item
    await ctx.db.delete(args.id);

    // Calculate the new total budget for the RKA document
    const budgetItems = await ctx.db
      .query("budgetItems")
      .withIndex("by_rka_document", (q) => q.eq("rkaDocumentId", budgetItem.rkaDocumentId))
      .collect();

    const totalBudget = budgetItems.reduce((sum, item) => sum + item.amount, 0);

    // Update the RKA document with the new total budget
    await ctx.db.patch(budgetItem.rkaDocumentId, {
      totalBudget,
      updatedAt: Date.now(),
    });

    // Log the activity
    await ctx.db.insert("activityLogs", {
      action: "deleted",
      entityType: "budgetItem",
      entityId: args.id,
      userId,
      organizationId: user.organizationId,
      details: `Deleted budget item: ${budgetItem.name} for RKA document: ${rkaDocument.title}`,
      createdAt: Date.now(),
    });

    return args.id;
  },
});
