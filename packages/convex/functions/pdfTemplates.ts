import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Get organization with PDF template
export const getTemplateConfig = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const organization = await ctx.db.get(args.organizationId);

    if (!organization) {
      throw new Error("Organization not found");
    }

    return organization.pdfTemplateConfig || null;
  },
});

// Update organization PDF template
export const updateTemplateConfig = mutation({
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
    const { organizationId, templateConfig } = args;

    // Get existing organization
    const organization = await ctx.db.get(organizationId);
    if (!organization) {
      throw new Error("Organization not found");
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
      actorUserId: organization.createdBy, // This would need to be passed properly
      organizationId,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// Upload organization logo
export const uploadLogo = mutation({
  args: {
    organizationId: v.id("organizations"),
    fileUrl: v.string(),
    fileName: v.string(),
    fileSize: v.number(),
  },
  handler: async (ctx, args) => {
    const { organizationId, fileUrl, fileName, fileSize } = args;

    // Get existing organization
    const organization = await ctx.db.get(organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    // Update template config with logo URL
    const currentConfig = organization.pdfTemplateConfig || {};
    await ctx.db.patch(organizationId, {
      pdfTemplateConfig: {
        ...currentConfig,
        logoUrl: fileUrl,
      },
      updatedAt: Date.now(),
    });

    // Log the change
    await ctx.db.insert("auditLogs", {
      action: "uploaded_logo",
      entityTable: "organizations",
      entityId: organizationId,
      entityData: {
        fileName,
        fileSize,
      },
      actorUserId: organization.createdBy, // This would need to be passed properly
      organizationId,
      createdAt: Date.now(),
    });

    return {
      success: true,
      logoUrl: fileUrl
    };
  },
});

// Remove organization logo
export const removeLogo = mutation({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const { organizationId } = args;

    // Get existing organization
    const organization = await ctx.db.get(organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    const currentConfig = organization.pdfTemplateConfig || {};

    // Remove logo URL from config
    await ctx.db.patch(organizationId, {
      pdfTemplateConfig: {
        ...currentConfig,
        logoUrl: undefined,
      },
      updatedAt: Date.now(),
    });

    // Log the change
    await ctx.db.insert("auditLogs", {
      action: "removed_logo",
      entityTable: "organizations",
      entityId: organizationId,
      entityData: {
        previousLogoUrl: currentConfig.logoUrl,
      },
      actorUserId: organization.createdBy, // This would need to be passed properly
      organizationId,
      createdAt: Date.now(),
    });

    return { success: true };
  },
});