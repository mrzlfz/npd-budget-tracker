import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

/**
 * Migration: npdFiles to attachments
 * This mutation migrates all data from the old npdFiles table to the new consolidated attachments table.
 * Run this once after deploying the schema changes.
 * 
 * Note: This is a one-time migration. The npdFiles table will be removed from the schema after migration.
 */
export const migrateNpdFilesToAttachments = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Only admin can run migrations
    if (user.role !== "admin") {
      throw new Error("Only admins can run migrations");
    }

    try {
      // Get all records from npdFiles (if table still exists)
      // Note: This will fail gracefully if npdFiles table has already been removed
      const npdFiles = await ctx.db.query("npdFiles" as any).collect();

      let migratedCount = 0;
      let skippedCount = 0;

      for (const file of npdFiles) {
        // Check if file already exists in attachments (by url/storageId)
        const existing = await ctx.db
          .query("attachments")
          .withIndex("by_npd", (q) => q.eq("npdId", file.npdId))
          .filter((q) => q.eq(q.field("url"), file.fileUrl))
          .first();

        if (existing) {
          skippedCount++;
          continue;
        }

        // Migrate to attachments table with proper field mapping
        await ctx.db.insert("attachments", {
          npdId: file.npdId,
          namaFile: file.filename,
          tipeMime: file.fileType,
          ukuran: file.fileSize,
          url: file.fileUrl, // Storage ID
          jenis: "Other", // Default type since npdFiles didn't have this field
          status: file.status,
          uploadedBy: file.uploadedBy,
          organizationId: file.organizationId,
          uploadedAt: file.uploadedAt || file.createdAt,
          createdAt: file.createdAt,
          updatedAt: file.createdAt, // Use createdAt as initial updatedAt
        });

        migratedCount++;
      }

      // Create audit log for migration
      await ctx.db.insert("auditLogs", {
        action: "migration_completed",
        entityTable: "attachments",
        entityId: "migration_npdFiles_to_attachments",
        actorUserId: userId,
        organizationId: user.organizationId,
        createdAt: Date.now(),
        entityData: {
          migratedCount,
          skippedCount,
          totalRecords: npdFiles.length,
        },
      });

      return {
        success: true,
        migratedCount,
        skippedCount,
        totalRecords: npdFiles.length,
        message: `Migration completed: ${migratedCount} records migrated, ${skippedCount} skipped (already exist)`,
      };
    } catch (error) {
      // If npdFiles table doesn't exist (already migrated), return success
      if (error instanceof Error && error.message.includes("npdFiles")) {
        return {
          success: true,
          migratedCount: 0,
          skippedCount: 0,
          totalRecords: 0,
          message: "Migration already completed or npdFiles table not found",
        };
      }
      throw error;
    }
  },
});

