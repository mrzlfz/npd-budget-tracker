import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all programs for organization
export const getPrograms = query({
  args: {
    fiscalYear: v.optional(v.number()),
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

    let programs = await ctx.db
      .query("rkaPrograms")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .collect();

    if (args.fiscalYear) {
      programs = programs.filter((program) => program.fiscalYear === args.fiscalYear);
    }

    return programs;
  },
});

// Get kegiatans for a program
export const getKegiatans = query({
  args: {
    programId: v.id("rkaPrograms"),
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

    // Verify user has access to this program
    const program = await ctx.db.get(args.programId);
    if (!program || program.organizationId !== user.organizationId) {
      throw new Error("Access denied");
    }

    return await ctx.db
      .query("rkaKegiatans")
      .withIndex("by_program", (q) => q.eq("programId", args.programId))
      .collect();
  },
});

// Get subkegiatans for a kegiatan
export const getSubkegiatans = query({
  args: {
    kegiatanId: v.id("rkaKegiatans"),
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

    // Verify user has access to this kegiatan
    const kegiatan = await ctx.db.get(args.kegiatanId);
    if (!kegiatan || kegiatan.organizationId !== user.organizationId) {
      throw new Error("Access denied");
    }

    return await ctx.db
      .query("rkaSubkegiatans")
      .withIndex("by_kegiatan", (q) => q.eq("kegiatanId", args.kegiatanId))
      .collect();
  },
});

// Get accounts for a subkegiatan
export const getAccounts = query({
  args: {
    subkegiatanId: v.id("rkaSubkegiatans"),
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

    // Verify user has access to this subkegiatan
    const subkegiatan = await ctx.db.get(args.subkegiatanId);
    if (!subkegiatan || subkegiatan.organizationId !== user.organizationId) {
      throw new Error("Access denied");
    }

    const accounts = await ctx.db
      .query("rkaAccounts")
      .withIndex("by_subkegiatan", (q) => q.eq("subkegiatanId", args.subkegiatanId))
      .collect();

    // Get realizations for each account to calculate remaining budget
    const accountsWithRealization = await Promise.all(
      accounts.map(async (account) => {
        const realizations = await ctx.db
          .query("realizations")
          .withIndex("by_account", (q) => q.eq("accountId", account._id))
          .collect();

        const totalRealized = realizations.reduce((sum, realization) => sum + realization.totalCair, 0);
        const sisaPagu = account.paguTahun - totalRealized;

        return {
          ...account,
          realisasiTahun: totalRealized,
          sisaPagu,
        };
      })
    );

    return accountsWithRealization;
  },
});

// Get complete hierarchy for organization
export const getHierarchy = query({
  args: {
    fiscalYear: v.optional(v.number()),
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

    // Get programs
    let programs = await ctx.db
      .query("rkaPrograms")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .collect();

    if (args.fiscalYear) {
      programs = programs.filter((program) => program.fiscalYear === args.fiscalYear);
    }

    // Get complete hierarchy
    const hierarchy = await Promise.all(
      programs.map(async (program) => {
        const kegiatans = await ctx.db
          .query("rkaKegiatans")
          .withIndex("by_program", (q) => q.eq("programId", program._id))
          .collect();

        const kegiatansWithSubkegiatans = await Promise.all(
          kegiatans.map(async (kegiatan) => {
            const subkegiatans = await ctx.db
              .query("rkaSubkegiatans")
              .withIndex("by_kegiatan", (q) => q.eq("kegiatanId", kegiatan._id))
              .collect();

            const subkegiatansWithAccounts = await Promise.all(
              subkegiatans.map(async (subkegiatan) => {
                const accounts = await ctx.db
                  .query("rkaAccounts")
                  .withIndex("by_subkegiatan", (q) => q.eq("subkegiatanId", subkegiatan._id))
                  .collect();

                // Get realizations for budget calculations
                const accountsWithRealization = await Promise.all(
                  accounts.map(async (account) => {
                    const realizations = await ctx.db
                      .query("realizations")
                      .withIndex("by_account", (q) => q.eq("accountId", account._id))
                      .collect();

                    const totalRealized = realizations.reduce((sum, realization) => sum + realization.totalCair, 0);

                    return {
                      ...account,
                      realisasiTahun: totalRealized,
                      sisaPagu: account.paguTahun - totalRealized,
                    };
                  })
                );

                return {
                  ...subkegiatan,
                  accounts: accountsWithRealization,
                  totalPagu: accountsWithRealization.reduce((sum, account) => sum + account.paguTahun, 0),
                  totalRealisasi: accountsWithRealization.reduce((sum, account) => sum + account.realisasiTahun, 0),
                  totalSisa: accountsWithRealization.reduce((sum, account) => sum + account.sisaPagu, 0),
                };
              })
            );

            return {
              ...kegiatan,
              subkegiatans: subkegiatansWithAccounts,
              totalPagu: subkegiatansWithAccounts.reduce((sum, sub) => sum + sub.totalPagu, 0),
              totalRealisasi: subkegiatansWithAccounts.reduce((sum, sub) => sum + sub.totalRealisasi, 0),
              totalSisa: subkegiatansWithAccounts.reduce((sum, sub) => sum + sub.totalSisa, 0),
            };
          })
        );

        return {
          ...program,
          kegiatans: kegiatansWithSubkegiatans,
          totalPagu: kegiatansWithSubkegiatans.reduce((sum, keg) => sum + keg.totalPagu, 0),
          totalRealisasi: kegiatansWithSubkegiatans.reduce((sum, keg) => sum + keg.totalRealisasi, 0),
          totalSisa: kegiatansWithSubkegiatans.reduce((sum, keg) => sum + keg.totalSisa, 0),
        };
      })
    );

    return hierarchy;
  },
});

// Search across hierarchy
export const searchHierarchy = query({
  args: {
    searchQuery: v.string(),
    fiscalYear: v.optional(v.number()),
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

    const query = args.searchQuery.toLowerCase();

    // Search in programs
    const programs = await ctx.db
      .query("rkaPrograms")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .collect();

    const filteredPrograms = programs.filter((program) => {
      const matchesYear = !args.fiscalYear || program.fiscalYear === args.fiscalYear;
      const matchesSearch = program.nama.toLowerCase().includes(query) ||
                         program.uraian?.toLowerCase().includes(query) ||
                         program.kode.toLowerCase().includes(query);
      return matchesYear && matchesSearch;
    });

    // Search in kegiatans
    const kegiatans = await ctx.db
      .query("rkaKegiatans")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .collect();

    const filteredKegiatans = kegiatans.filter((kegiatan) => {
      const matchesYear = !args.fiscalYear || kegiatan.fiscalYear === args.fiscalYear;
      const matchesSearch = kegiatan.nama.toLowerCase().includes(query) ||
                         kegiatan.uraian?.toLowerCase().includes(query) ||
                         kegiatan.kode.toLowerCase().includes(query);
      return matchesYear && matchesSearch;
    });

    // Search in subkegiatans
    const subkegiatans = await ctx.db
      .query("rkaSubkegiatans")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .collect();

    const filteredSubkegiatans = subkegiatans.filter((subkegiatan) => {
      const matchesYear = !args.fiscalYear || subkegiatan.fiscalYear === args.fiscalYear;
      const matchesSearch = subkegiatan.nama.toLowerCase().includes(query) ||
                         subkegiatan.uraian?.toLowerCase().includes(query) ||
                         subkegiatan.kode.toLowerCase().includes(query);
      return matchesYear && matchesSearch;
    });

    // Search in accounts
    const accounts = await ctx.db
      .query("rkaAccounts")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .collect();

    const filteredAccounts = await Promise.all(
      accounts.filter((account) => {
        const matchesYear = !args.fiscalYear || account.fiscalYear === args.fiscalYear;
        const matchesSearch = account.uraian.toLowerCase().includes(query) ||
                           account.kode.toLowerCase().includes(query);
        return matchesYear && matchesSearch;
      }).map(async (account) => {
        // Get realization data
        const realizations = await ctx.db
          .query("realizations")
          .withIndex("by_account", (q) => q.eq("accountId", account._id))
          .collect();

        const totalRealized = realizations.reduce((sum, realization) => sum + realization.totalCair, 0);

        return {
          ...account,
          realisasiTahun: totalRealized,
          sisaPagu: account.paguTahun - totalRealized,
        };
      })
    );

    return {
      programs: filteredPrograms,
      kegiatans: filteredKegiatans,
      subkegiatans: filteredSubkegiatans,
      accounts: filteredAccounts,
    };
  },
});

// Get fiscal years for organization
export const getFiscalYears = query({
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

    const programs = await ctx.db
      .query("rkaPrograms")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .collect();

    const fiscalYears = [...new Set(programs.map((program) => program.fiscalYear))];

    return fiscalYears.sort((a, b) => b - a); // Most recent first
  },
});