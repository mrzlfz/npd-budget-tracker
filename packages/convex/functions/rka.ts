import { query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all RKA documents for the user's organization
export const list = query({
  args: {
    paginationOpts: v.optional(
      v.object({
        numItems: v.number(),
        cursor: v.optional(v.string()),
      })
    ),
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

    // Get RKA documents for the user's organization
    const rkaDocuments = await ctx.db
      .query("rkaDocuments")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .order("desc")
      .collect();

    // Get the creator information for each RKA document
    const rkaWithCreators = await Promise.all(
      rkaDocuments.map(async (rka) => {
        const creator = await ctx.db.get(rka.createdBy);
        return {
          ...rka,
          creator: creator ? { name: creator.name, email: creator.email } : null,
        };
      })
    );

    return rkaWithCreators;
  },
});

// Search and filter RKA documents with pagination
export const searchAndFilter = query({
  args: {
    filters: v.optional(
      v.object({
        searchQuery: v.optional(v.string()),
        status: v.optional(v.string()),
        fiscalYear: v.optional(v.string()),
        createdBy: v.optional(v.id("users")),
      })
    ),
    pagination: v.object({
      page: v.number(),
      limit: v.number(),
    }),
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

    // Start with all RKA documents for the user's organization
    let rkaDocuments = await ctx.db
      .query("rkaDocuments")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .order("desc")
      .collect();

    // Apply filters
    if (args.filters?.status) {
      rkaDocuments = rkaDocuments.filter((rka) => rka.status === args.filters.status);
    }

    if (args.filters?.fiscalYear) {
      rkaDocuments = rkaDocuments.filter((rka) => rka.fiscalYear === args.filters.fiscalYear);
    }

    if (args.filters?.createdBy) {
      rkaDocuments = rkaDocuments.filter((rka) => rka.createdBy === args.filters.createdBy);
    }

    // Apply search query
    if (args.filters?.searchQuery) {
      const query = args.filters.searchQuery.toLowerCase();
      rkaDocuments = rkaDocuments.filter(
        (rka) =>
          rka.title.toLowerCase().includes(query) ||
          rka.description?.toLowerCase().includes(query) ||
          rka.documentNumber.toLowerCase().includes(query)
      );
    }

    // Get the creator information for each RKA document
    const rkaWithCreators = await Promise.all(
      rkaDocuments.map(async (rka) => {
        const creator = await ctx.db.get(rka.createdBy);
        return {
          ...rka,
          creator: creator ? { name: creator.name, email: creator.email } : null,
        };
      })
    );

    // Apply pagination
    const { page, limit } = args.pagination;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const documents = rkaWithCreators.slice(startIndex, endIndex);
    
    const totalItems = rkaWithCreators.length;
    const totalPages = Math.ceil(totalItems / limit);
    
    return {
      documents,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    };
  },
});

// Get all fiscal years for the user's organization
export const getFiscalYears = query({
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

    // Get all RKA documents for the user's organization
    const rkaDocuments = await ctx.db
      .query("rkaDocuments")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .collect();

    // Extract unique fiscal years
    const fiscalYears = [...new Set(rkaDocuments.map((rka) => rka.fiscalYear.toString()))];
    
    // Sort in descending order (most recent first)
    return fiscalYears.sort((a, b) => parseInt(b) - parseInt(a));
  },
});

// Get a single RKA document by ID
export const getById = query({
  args: { id: v.id("rkaDocuments") },
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
    const rkaDocument = await ctx.db.get(args.id);
    if (!rkaDocument) {
      throw new Error("RKA document not found");
    }

    // Check if the user has access to this RKA document
    if (rkaDocument.organizationId !== user.organizationId) {
      throw new Error("Access denied");
    }

    // Get the creator information
    const creator = await ctx.db.get(rkaDocument.createdBy);

    // Get the budget items for this RKA document
    const budgetItems = await ctx.db
      .query("budgetItems")
      .withIndex("by_rka_document", (q) => q.eq("rkaDocumentId", rkaDocument._id))
      .collect();

    return {
      ...rkaDocument,
      creator: creator ? { name: creator.name, email: creator.email } : null,
      budgetItems,
    };
  },
});

// Search and filter RKA documents
export const search = query({
  args: {
    searchQuery: v.optional(v.string()),
    status: v.optional(v.string()),
    fiscalYear: v.optional(v.number()),
    createdBy: v.optional(v.id("users")),
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

    // Start with all RKA documents for the user's organization
    let rkaDocuments = await ctx.db
      .query("rkaDocuments")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .collect();

    // Apply filters
    if (args.status) {
      rkaDocuments = rkaDocuments.filter((rka) => rka.status === args.status);
    }

    if (args.fiscalYear) {
      rkaDocuments = rkaDocuments.filter((rka) => rka.fiscalYear === args.fiscalYear);
    }

    if (args.createdBy) {
      rkaDocuments = rkaDocuments.filter((rka) => rka.createdBy === args.createdBy);
    }

    // Apply search query
    if (args.searchQuery) {
      const query = args.searchQuery.toLowerCase();
      rkaDocuments = rkaDocuments.filter(
        (rka) =>
          rka.title.toLowerCase().includes(query) ||
          rka.description?.toLowerCase().includes(query) ||
          rka.documentNumber.toLowerCase().includes(query)
      );
    }

    // Get the creator information for each RKA document
    const rkaWithCreators = await Promise.all(
      rkaDocuments.map(async (rka) => {
        const creator = await ctx.db.get(rka.createdBy);
        return {
          ...rka,
          creator: creator ? { name: creator.name, email: creator.email } : null,
        };
      })
    );

    return rkaWithCreators;
  },
});

// Get RKA documents by fiscal year
export const getByFiscalYear = query({
  args: { fiscalYear: v.number() },
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

    // Get RKA documents for the specified fiscal year
    const rkaDocuments = await ctx.db
      .query("rkaDocuments")
      .withIndex("by_fiscal_year", (q) => q.eq("fiscalYear", args.fiscalYear))
      .collect();

    // Filter by organization
    const orgRkaDocuments = rkaDocuments.filter(
      (rka) => rka.organizationId === user.organizationId
    );

    // Get the creator information for each RKA document
    const rkaWithCreators = await Promise.all(
      orgRkaDocuments.map(async (rka) => {
        const creator = await ctx.db.get(rka.createdBy);
        return {
          ...rka,
          creator: creator ? { name: creator.name, email: creator.email } : null,
        };
      })
    );

    return rkaWithCreators;
  },
});

// Get RKA documents by status
export const getByStatus = query({
  args: { status: v.string() },
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

    // Get RKA documents with the specified status
    const rkaDocuments = await ctx.db
      .query("rkaDocuments")
      .withIndex("by_status", (q) => q.eq("status", args.status))
      .collect();

    // Filter by organization
    const orgRkaDocuments = rkaDocuments.filter(
      (rka) => rka.organizationId === user.organizationId
    );

    // Get the creator information for each RKA document
    const rkaWithCreators = await Promise.all(
      orgRkaDocuments.map(async (rka) => {
        const creator = await ctx.db.get(rka.createdBy);
        return {
          ...rka,
          creator: creator ? { name: creator.name, email: creator.email } : null,
        };
      })
    );

    return rkaWithCreators;
  },
});
