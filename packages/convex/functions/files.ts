import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Allowed file types for upload
const ALLOWED_FILE_TYPES = {
  // Documents
  'application/pdf': { ext: ['.pdf'], maxSize: 10 },
  'application/msword': { ext: ['.doc'], maxSize: 10 },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { ext: ['.docx'], maxSize: 10 },
  'application/vnd.ms-excel': { ext: ['.xls'], maxSize: 10 },
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { ext: ['.xlsx'], maxSize: 10 },
  // Images
  'image/jpeg': { ext: ['.jpg', '.jpeg'], maxSize: 5 },
  'image/png': { ext: ['.png'], maxSize: 5 },
  'image/webp': { ext: ['.webp'], maxSize: 5 },
  // Text
  'text/csv': { ext: ['.csv'], maxSize: 5 },
  'text/plain': { ext: ['.txt'], maxSize: 2 },
};

// Calculate SHA-256 checksum from bytes
async function calculateChecksum(data: ArrayBuffer): Promise<string> {
  // Use Web Crypto API for SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Validate file type and extension
function validateFileType(filename: string, mimeType: string): { valid: boolean; error?: string } {
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  // Check if MIME type is allowed
  if (!ALLOWED_FILE_TYPES[mimeType]) {
    return { 
      valid: false, 
      error: `File type ${mimeType} is not allowed. Allowed types: PDF, DOC, DOCX, XLS, XLSX, Images (JPG, PNG, WEBP), CSV, TXT` 
    };
  }
  
  // Check if extension matches MIME type
  const allowedExtensions = ALLOWED_FILE_TYPES[mimeType].ext;
  if (!allowedExtensions.includes(ext)) {
    return { 
      valid: false, 
      error: `File extension ${ext} does not match MIME type ${mimeType}` 
    };
  }
  
  return { valid: true };
}

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
    jenis: v.optional(v.string()), // Type of attachment (defaults to "Other")
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

    // Validate file type and extension
    const typeValidation = validateFileType(args.filename, args.fileType);
    if (!typeValidation.valid) {
      throw new Error(typeValidation.error || "Invalid file type");
    }

    // Get max allowed size for this file type (in MB)
    const maxSizeMB = ALLOWED_FILE_TYPES[args.fileType]?.maxSize || 10;
    const maxSize = maxSizeMB * 1024 * 1024; // Convert to bytes
    
    // Validate file size against type-specific limit
    if (args.fileSize > maxSize) {
      throw new Error(`File size exceeds maximum limit of ${maxSizeMB}MB for ${args.fileType}`);
    }

    // Calculate SHA-256 checksum for file integrity
    const checksum = await calculateChecksum(args.fileData.buffer);

    // Check if file with same checksum already exists for this NPD
    const existingFiles = await ctx.db
      .query("attachments")
      .withIndex("by_npd", (q) => q.eq("npdId", args.npdId))
      .collect();
    
    const duplicateFile = existingFiles.find(f => f.checksum === checksum);
    if (duplicateFile) {
      throw new Error(`File already exists with the same content: ${duplicateFile.namaFile}`);
    }

    // Generate unique file path
    const fileUrl = generateFileUrl(
      user.organizationId.toString(),
      args.npdId.toString(),
      args.filename
    );

    // Store file using Convex storage
    const storageId = await ctx.storage.store(args.fileData);

    // Store file metadata in database using attachments table with enhanced metadata
    const fileRecordId = await ctx.db.insert("attachments", {
      npdId: args.npdId,
      namaFile: args.filename,
      tipeMime: args.fileType,
      ukuran: args.fileSize,
      url: storageId, // Use Convex storage ID
      jenis: args.jenis || "Other", // Default to "Other" if not specified
      checksum, // SHA-256 checksum for integrity verification
      status: "uploaded",
      uploadedBy: userId,
      organizationId: user.organizationId,
      uploadedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create audit log with enhanced metadata
    await ctx.db.insert("auditLogs", {
      action: "file_uploaded",
      entityTable: "attachments",
      entityId: fileRecordId,
      actorUserId: userId,
      organizationId: user.organizationId,
      entityData: {
        filename: args.filename,
        fileSize: args.fileSize,
        fileType: args.fileType,
        checksum,
        jenis: args.jenis || "Other",
      },
      createdAt: Date.now(),
    });

    return {
      fileId: fileRecordId,
      storageId,
      fileUrl: storageId,
      checksum,
    };
  },
});

// Confirm file upload and update status
export const confirmUpload = mutation({
  args: {
    fileId: v.id("attachments"),
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
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      action: "file_uploaded",
      entityTable: "attachments",
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
      .query("attachments")
      .withIndex("by_npd", (q) => q.eq("npdId", npdId))
      .collect();

    return files;
  },
});

// Delete a file
export const remove = mutation({
  args: {
    fileId: v.id("attachments"),
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
      entityTable: "attachments",
      entityId: args.fileId,
      actorUserId: userId,
      organizationId: user.organizationId,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Get download URL for a file using Convex storage with rate limiting check
export const getDownloadUrl = query({
  args: {
    fileId: v.id("attachments"),
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

    // Check rate limiting - max 100 downloads per user per hour
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    const recentDownloads = await ctx.db
      .query("auditLogs")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .filter((q) => 
        q.and(
          q.eq(q.field("action"), "file_downloaded"),
          q.eq(q.field("actorUserId"), userId),
          q.gte(q.field("createdAt"), oneHourAgo)
        )
      )
      .collect();

    if (recentDownloads.length >= 100) {
      throw new Error("Download rate limit exceeded. Maximum 100 downloads per hour.");
    }

    // Generate download URL using Convex storage
    const downloadUrl = await ctx.storage.getUrl(file.url);

    return {
      downloadUrl,
      filename: file.namaFile,
      fileType: file.tipeMime,
      fileSize: file.ukuran,
      checksum: file.checksum,
    };
  },
});

// Record file download with audit logging (call this after successful download)
export const recordDownload = mutation({
  args: {
    fileId: v.id("attachments"),
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

    // Create audit log for download
    await ctx.db.insert("auditLogs", {
      action: "file_downloaded",
      entityTable: "attachments",
      entityId: args.fileId,
      actorUserId: userId,
      organizationId: user.organizationId,
      entityData: {
        filename: file.namaFile,
        fileSize: file.ukuran,
        checksum: file.checksum,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Get file data directly from storage
export const getFileData = query({
  args: {
    fileId: v.id("attachments"),
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
    const fileData = await ctx.storage.get(file.url);

    if (!fileData) {
      throw new Error("File data not found in storage");
    }

    return {
      data: fileData,
      filename: file.namaFile,
      fileType: file.tipeMime,
      fileSize: file.ukuran,
    };
  },
});