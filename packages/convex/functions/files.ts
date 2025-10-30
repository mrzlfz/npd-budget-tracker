import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Upload a file and return the file URL
export const uploadUrl = mutation({
  args: {
    filename: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    npdId: v.id("npdDocuments"),
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

    // Validate NPD access
    const npd = await ctx.db.get(args.npdId);
    if (!npd || npd.organizationId !== user.organizationId) {
      throw new Error("NPD not found or access denied");
    }

    // Generate a unique file ID
    const fileId = `files/${user.organizationId}/${args.npdId}/${Date.now()}-${args.filename}`;

    // Store file metadata in database
    const fileRecordId = await ctx.db.insert("npdFiles", {
      npdId: args.npdId,
      filename: args.filename,
      fileType: args.fileType,
      fileSize: args.fileSize,
      fileUrl: fileId,
      uploadedBy: userId,
      organizationId: user.organizationId,
      createdAt: Date.now(),
    });

    // Generate upload URL (in production, this would use a real storage service)
    const uploadUrl = `${process.env.CONVEX_SITE_URL}/api/upload?fileId=${fileId}`;

    return {
      fileId: fileRecordId,
      uploadUrl,
      fileUrl: fileId,
    };
  },
});

// Confirm file upload and update status
export const confirmUpload = mutation({
  args: {
    fileId: v.id("npdFiles"),
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

    const file = await ctx.db.get(args.fileId);
    if (!file || file.organizationId !== user.organizationId) {
      throw new Error("File not found or access denied");
    }

    // Update file status to uploaded
    await ctx.db.patch(args.fileId, {
      status: "uploaded",
      uploadedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "file_uploaded",
      entityTable: "npdFiles",
      entityId: args.fileId,
      actorUserId: userId,
      organizationId: user.organizationId,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Get files for an NPD
export const getByNpd = query({
  args: {
    npdId: v.id("npdDocuments"),
  },
  handler: async (ctx, { npdId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Validate NPD access
    const npd = await ctx.db.get(npdId);
    if (!npd || npd.organizationId !== user.organizationId) {
      throw new Error("NPD not found or access denied");
    }

    // Get files for this NPD
    const files = await ctx.db
      .query("npdFiles")
      .withIndex("by_npd", (q) => q.eq("npdId", npdId))
      .collect();

    return files;
  },
});

// Delete a file
export const remove = mutation({
  args: {
    fileId: v.id("npdFiles"),
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

    const file = await ctx.db.get(args.fileId);
    if (!file || file.organizationId !== user.organizationId) {
      throw new Error("File not found or access denied");
    }

    // Check if NPD can be modified (not finalized)
    const npd = await ctx.db.get(file.npdId);
    if (!npd || npd.organizationId !== user.organizationId) {
      throw new Error("NPD not found or access denied");
    }

    if (npd.status === "final") {
      throw new Error("Cannot delete files from finalized NPD");
    }

    // Delete file record (in production, also delete from storage)
    await ctx.db.delete(args.fileId);

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "file_deleted",
      entityTable: "npdFiles",
      entityId: args.fileId,
      actorUserId: userId,
      organizationId: user.organizationId,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Get download URL for a file
export const getDownloadUrl = query({
  args: {
    fileId: v.id("npdFiles"),
  },
  handler: async (ctx, { fileId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const file = await ctx.db.get(fileId);
    if (!file || file.organizationId !== user.organizationId) {
      throw new Error("File not found or access denied");
    }

    // Generate download URL (in production, this would use a real storage service)
    const downloadUrl = `${process.env.CONVEX_SITE_URL}/api/download?fileId=${file.fileUrl}`;

    return { downloadUrl, filename: file.filename, fileType: file.fileType };
  },
});