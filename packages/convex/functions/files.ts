import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper function to generate storage URLs
function generateFileUrl(organizationId: string, npdId: string, filename: string): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${organizationId}/${npdId}/${timestamp}-${sanitizedFilename}`;
}

// Upload a file using Convex storage and return the storage URL
export const upload = mutation({
  args: {
    filename: v.string(),
    fileType: v.string(),
    fileSize: v.number(),
    npdId: v.id("npdDocuments"),
    fileData: v.bytes(), // File data as bytes
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

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (args.fileSize > maxSize) {
      throw new Error(`File size exceeds maximum limit of ${maxSize / 1024 / 1024}MB`);
    }

    // Generate unique file path
    const fileUrl = generateFileUrl(
      user.organizationId.toString(),
      args.npdId.toString(),
      args.filename
    );

    // Store file using Convex storage
    const storageId = await ctx.storage.store(args.fileData);

    // Store file metadata in database
    const fileRecordId = await ctx.db.insert("npdFiles", {
      npdId: args.npdId,
      filename: args.filename,
      fileType: args.fileType,
      fileSize: args.fileSize,
      fileUrl: storageId, // Use Convex storage ID
      status: "uploaded",
      uploadedBy: userId,
      organizationId: user.organizationId,
      uploadedAt: Date.now(),
      createdAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "file_uploaded",
      entityTable: "npdFiles",
      entityId: fileRecordId,
      actorUserId: userId,
      organizationId: user.organizationId,
      createdAt: Date.now(),
    });

    return {
      fileId: fileRecordId,
      storageId,
      fileUrl: storageId,
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

// Get download URL for a file using Convex storage
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

    // Generate download URL using Convex storage
    const downloadUrl = await ctx.storage.getUrl(file.fileUrl);

    return {
      downloadUrl,
      filename: file.filename,
      fileType: file.fileType,
      fileSize: file.fileSize
    };
  },
});

// Get file data directly from storage
export const getFileData = query({
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

    // Get file data from Convex storage
    const fileData = await ctx.storage.get(file.fileUrl);

    if (!fileData) {
      throw new Error("File data not found in storage");
    }

    return {
      data: fileData,
      filename: file.filename,
      fileType: file.fileType,
      fileSize: file.fileSize,
    };
  },
});