import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get RKA accounts for dashboard
export const list = query({
  args: {
    organizationId: v.optional(v.id("organizations")),
  },
  handler: async (ctx, { organizationId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Build base query
    let baseQuery = ctx.db.query("rkaAccounts");

    // Apply organization filter if provided
    if (organizationId) {
      baseQuery = baseQuery.withIndex("by_organization", q =>
        q.eq("organizationId", organizationId)
      );
    }

    // Get accounts for the organization
    const accounts = await baseQuery.collect();

    return accounts;
  },
});

// Get RKA summary statistics
export const getSummary = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, { organizationId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user || user.organizationId !== organizationId) {
      throw new Error("Access denied");
    }

    // Get all accounts for the organization
    const accounts = await ctx.db
      .query("rkaAccounts")
      .withIndex("by_organization", q => q.eq("organizationId", organizationId))
      .collect();

    // Calculate summary statistics
    const totalPagu = accounts.reduce((sum, acc) => sum + acc.paguTahun, 0);
    const totalRealisasi = accounts.reduce((sum, acc) => sum + acc.realisasiTahun, 0);
    const totalSisa = accounts.reduce((sum, acc) => sum + acc.sisaPagu, 0);
    const activeAccounts = accounts.filter(acc => acc.status === "active").length;

    return {
      totalPagu,
      totalRealisasi,
      totalSisa,
      activeAccounts,
      utilizationRate: totalPagu > 0 ? (totalRealisasi / totalPagu) * 100 : 0,
    accountCount: accounts.length,
    // Additional metrics for dashboard
      averagePagu: accounts.length > 0 ? totalPagu / accounts.length : 0,
      averageUtilization: accounts.length > 0 ? totalRealisasi / accounts.length : 0,
    };
  },
});

// Get accounts by fiscal year
export const getByFiscalYear = query({
  args: {
    organizationId: v.id("organizations"),
    fiscalYear: v.number(),
  },
  handler: async (ctx, { organizationId, fiscalYear }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user || user.organizationId !== organizationId) {
      throw new Error("Access denied");
    }

    // Get accounts for the organization and fiscal year
    const accounts = await ctx.db
      .query("rkaAccounts")
      .withIndex("by_organization_fiscal_year", q =>
        q.eq("organizationId", organizationId).eq("fiscalYear", fiscalYear)
      )
      .collect();

    return accounts;
  },
});

// Get RKA accounts by subkegiatan
export const getAccountsBySubkegiatan = query({
  args: {
    subkegiatanId: v.id("rkaSubkegiatans"),
  },
  handler: async (ctx, { subkegiatanId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Get subkegiatan to validate access
    const subkegiatan = await ctx.db.get(subkegiatanId);
    if (!subkegiatan || subkegiatan.organizationId !== user.organizationId) {
      throw new Error("Subkegiatan not found or access denied");
    }

    // Get accounts for this subkegiatan
    const accounts = await ctx.db
      .query("rkaAccounts")
      .withIndex("by_subkegiatan", q => q.eq("subkegiatanId", subkegiatanId))
      .collect();

    return accounts;
  },
});

// Get all subkegiatan for organization
export const getSubkegiatans = query({
  args: {
    organizationId: v.optional(v.id("organizations")),
    fiscalYear: v.optional(v.number()),
  },
  handler: async (ctx, { organizationId, fiscalYear }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const orgId = organizationId || user.organizationId;

    // Build base query
    let baseQuery = ctx.db.query("rkaSubkegiatans")
      .withIndex("by_organization", q => q.eq("organizationId", orgId));

    // Apply fiscal year filter if provided
    if (fiscalYear) {
      baseQuery = baseQuery.filter(subkegiatan => subkegiatan.fiscalYear === fiscalYear);
    }

    const subkegiatans = await baseQuery.collect();

    return subkegiatans;
  },
});