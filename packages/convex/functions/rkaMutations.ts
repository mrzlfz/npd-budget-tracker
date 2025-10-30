import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Create a new RKA document
export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    documentNumber: v.string(),
    fiscalYear: v.number(),
    totalBudget: v.number(),
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

    // Create the RKA document
    const rkaId = await ctx.db.insert("rkaDocuments", {
      title: args.title,
      description: args.description,
      documentNumber: args.documentNumber,
      fiscalYear: args.fiscalYear,
      totalBudget: args.totalBudget,
      status: "draft",
      organizationId: user.organizationId,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Log the activity
    await ctx.db.insert("activityLogs", {
      action: "created",
      entityType: "rkaDocument",
      entityId: rkaId,
      userId,
      organizationId: user.organizationId,
      details: `Created RKA document: ${args.title}`,
      createdAt: Date.now(),
    });

    return rkaId;
  },
});

// Update an existing RKA document
export const update = mutation({
  args: {
    id: v.id("rkaDocuments"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    documentNumber: v.optional(v.string()),
    fiscalYear: v.optional(v.number()),
    totalBudget: v.optional(v.number()),
    status: v.optional(v.string()),
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

    // Get the RKA document to update
    const rkaDocument = await ctx.db.get(args.id);
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

    // Update the RKA document
    const { id, ...updateData } = args;
    await ctx.db.patch(args.id, {
      ...updateData,
      updatedAt: Date.now(),
    });

    // Log the activity
    await ctx.db.insert("activityLogs", {
      action: "updated",
      entityType: "rkaDocument",
      entityId: args.id,
      userId,
      organizationId: user.organizationId,
      details: `Updated RKA document: ${rkaDocument.title}`,
      createdAt: Date.now(),
    });

    return args.id;
  },
});

// Delete an RKA document
export const remove = mutation({
  args: {
    id: v.id("rkaDocuments"),
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

    // Get the RKA document to delete
    const rkaDocument = await ctx.db.get(args.id);
    if (!rkaDocument) {
      throw new Error("RKA document not found");
    }

    // Check if the user has access to this RKA document
    if (rkaDocument.organizationId !== user.organizationId) {
      throw new Error("Access denied");
    }

    // Check if the user can delete this document
    if (
      rkaDocument.createdBy !== userId &&
      user.role !== "admin" &&
      user.role !== "admin"
    ) {
      throw new Error("Access denied");
    }

    // Check if there are any NPD documents associated with this RKA document
    const npdDocuments = await ctx.db
      .query("npdDocuments")
      .withIndex("by_rka_document", (q) => q.eq("rkaDocumentId", args.id))
      .collect();

    if (npdDocuments.length > 0) {
      throw new Error("Cannot delete RKA document with associated NPD documents");
    }

    // Delete all budget items associated with this RKA document
    const budgetItems = await ctx.db
      .query("budgetItems")
      .withIndex("by_rka_document", (q) => q.eq("rkaDocumentId", args.id))
      .collect();

    for (const budgetItem of budgetItems) {
      await ctx.db.delete(budgetItem._id);
    }

    // Delete the RKA document
    await ctx.db.delete(args.id);

    // Log the activity
    await ctx.db.insert("activityLogs", {
      action: "deleted",
      entityType: "rkaDocument",
      entityId: args.id,
      userId,
      organizationId: user.organizationId,
      details: `Deleted RKA document: ${rkaDocument.title}`,
      createdAt: Date.now(),
    });

    return args.id;
  },
});

// Submit an RKA document for approval
export const submit = mutation({
  args: {
    id: v.id("rkaDocuments"),
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

    // Get the RKA document to submit
    const rkaDocument = await ctx.db.get(args.id);
    if (!rkaDocument) {
      throw new Error("RKA document not found");
    }

    // Check if the user has access to this RKA document
    if (rkaDocument.organizationId !== user.organizationId) {
      throw new Error("Access denied");
    }

    // Check if the user can submit this document
    if (
      rkaDocument.createdBy !== userId &&
      user.role !== "admin" &&
      user.role !== "admin"
    ) {
      throw new Error("Access denied");
    }

    // Check if the document is in draft status
    if (rkaDocument.status !== "draft") {
      throw new Error("Only draft documents can be submitted");
    }

    // Update the RKA document status
    await ctx.db.patch(args.id, {
      status: "submitted",
      updatedAt: Date.now(),
    });

    // Log the activity
    await ctx.db.insert("activityLogs", {
      action: "submitted",
      entityType: "rkaDocument",
      entityId: args.id,
      userId,
      organizationId: user.organizationId,
      details: `Submitted RKA document: ${rkaDocument.title}`,
      createdAt: Date.now(),
    });

    return args.id;
  },
});

// Approve an RKA document
export const approve = mutation({
  args: {
    id: v.id("rkaDocuments"),
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

    // Check if the user has the right role to approve
    if (user.role !== "admin") {
      throw new Error("Access denied");
    }

    // Get the RKA document to approve
    const rkaDocument = await ctx.db.get(args.id);
    if (!rkaDocument) {
      throw new Error("RKA document not found");
    }

    // Check if the user has access to this RKA document
    if (rkaDocument.organizationId !== user.organizationId) {
      throw new Error("Access denied");
    }

    // Check if the document is in submitted status
    if (rkaDocument.status !== "submitted") {
      throw new Error("Only submitted documents can be approved");
    }

    // Update the RKA document status
    await ctx.db.patch(args.id, {
      status: "approved",
      updatedAt: Date.now(),
    });

    // Log the activity
    await ctx.db.insert("activityLogs", {
      action: "approved",
      entityType: "rkaDocument",
      entityId: args.id,
      userId,
      organizationId: user.organizationId,
      details: `Approved RKA document: ${rkaDocument.title}`,
      createdAt: Date.now(),
    });

    return args.id;
  },
});

// Reject an RKA document
export const reject = mutation({
  args: {
    id: v.id("rkaDocuments"),
    reason: v.string(),
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

    // Check if the user has the right role to reject
    if (user.role !== "admin") {
      throw new Error("Access denied");
    }

    // Get the RKA document to reject
    const rkaDocument = await ctx.db.get(args.id);
    if (!rkaDocument) {
      throw new Error("RKA document not found");
    }

    // Check if the user has access to this RKA document
    if (rkaDocument.organizationId !== user.organizationId) {
      throw new Error("Access denied");
    }

    // Check if the document is in submitted status
    if (rkaDocument.status !== "submitted") {
      throw new Error("Only submitted documents can be rejected");
    }

    // Update the RKA document status
    await ctx.db.patch(args.id, {
      status: "rejected",
      updatedAt: Date.now(),
    });

    // Log the activity
    await ctx.db.insert("activityLogs", {
      action: "rejected",
      entityType: "rkaDocument",
      entityId: args.id,
      userId,
      organizationId: user.organizationId,
      details: `Rejected RKA document: ${rkaDocument.title}. Reason: ${args.reason}`,
      createdAt: Date.now(),
    });

    return args.id;
  },
});
