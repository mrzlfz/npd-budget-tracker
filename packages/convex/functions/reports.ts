import { v } from "convex/values";
import { query } from "./_generated/server";

// Budget realization report
export const realisasi = query({
  args: {
    organizationId: v.id("organizations"),
    tahun: v.number(),
    bulan: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { organizationId, tahun, bulan } = args;

    // Get all RKA accounts for the organization and year
    const accounts = await ctx.db
      .query("rkaAccounts")
      .withIndex("by_organization_fiscal_year", (q) =>
        q.eq("organizationId", organizationId).eq("fiscalYear", tahun)
      )
      .collect();

    // Get all realizations for these accounts
    const realizations = await Promise.all(
      accounts.map(async (account) => {
        const realizationRecords = await ctx.db
          .query("realizations")
          .withIndex("by_account", (q) => q.eq("accountId", account._id))
          .collect();

        // Filter by month if specified
        const filteredRealizations = bulan
          ? realizationRecords.filter((r) => {
              const realizationMonth = new Date(r.createdAt).getMonth() + 1;
              return realizationMonth === bulan;
            })
          : realizationRecords;

        const totalRealisasi = filteredRealizations.reduce(
          (sum, r) => sum + r.totalCair,
          0
        );

        return {
          kode: account.kode,
          uraian: account.uraian,
          paguTahun: account.paguTahun,
          realisasiTahun: totalRealisasi,
          sisaPagu: account.paguTahun - totalRealisasi,
          persentaseRealisasi: account.paguTahun > 0 ? (totalRealisasi / account.paguTahun) * 100 : 0,
          subkegiatan: account.subkegiatanId,
          kegiatan: account.kegiatanId,
          program: account.programId,
        };
      })
    );

    return realizations;
  },
});

// Performance indicator report
export const performance = query({
  args: {
    organizationId: v.id("organizations"),
    tahun: v.number(),
    periode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { organizationId, tahun, periode } = args;

    // Get all sub-kegiatans for the organization and year
    const subkegiatans = await ctx.db
      .query("rkaSubkegiatans")
      .withIndex("by_organization_fiscal_year", (q) =>
        q.eq("organizationId", organizationId).eq("fiscalYear", tahun)
      )
      .collect();

    // Get performance logs for these sub-kegiatans
    const performanceData = await Promise.all(
      subkegiatans.map(async (subkegiatan) => {
        const performanceLogs = await ctx.db
          .query("performanceLogs")
          .withIndex("by_subkegiatan", (q) => q.eq("subkegiatanId", subkegiatan._id))
          .collect();

        // Filter by period if specified
        const filteredLogs = periode && periode !== "semua"
          ? performanceLogs.filter((log) => log.periode === periode)
          : performanceLogs;

        // Group logs by indicator name
        const indicators = filteredLogs.reduce((acc, log) => {
          if (!acc[log.indikatorNama]) {
            acc[log.indikatorNama] = {
              nama: log.indikatorNama,
              target: log.target,
              realisasi: 0,
              satuan: log.satuan,
              persentaseCapaian: 0,
              logs: [],
            };
          }
          acc[log.indikatorNama].realisasi += log.realisasi;
          acc[log.indikatorNama].logs.push(log);
          return acc;
        }, {} as Record<string, any>);

        // Calculate percentages
        Object.values(indicators).forEach((indicator) => {
          indicator.persentaseCapaian = indicator.target > 0 ? (indicator.realisasi / indicator.target) * 100 : 0;
        });

        return {
          subkegiatanKode: subkegiatan.kode,
          subkegiatanNama: subkegiatan.nama,
          programId: subkegiatan.programId,
          kegiatanId: subkegiatan.kegiatanId,
          indicators: Object.values(indicators),
        };
      })
    );

    return performanceData;
  },
});

// Audit trail report
export const audit = query({
  args: {
    organizationId: v.id("organizations"),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    userId: v.optional(v.string()),
    action: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { organizationId, startDate, endDate, userId, action } = args;

    // Build query with filters
    let query = ctx.db
      .query("auditLogs")
      .withIndex("by_organization", (q) => q.eq("organizationId", organizationId));

    // Apply date filters
    if (startDate) {
      query = query.withIndex("by_created_at", (q) =>
        q.gte("createdAt", startDate)
      );
    }

    if (endDate) {
      query = query.withIndex("by_created_at", (q) =>
        q.lte("createdAt", endDate)
      );
    }

    let logs = await query.collect();

    // Apply additional filters
    if (userId) {
      logs = logs.filter((log) => log.actorUserId === userId);
    }

    if (action) {
      logs = logs.filter((log) => log.action === action);
    }

    // Get user information for each log
    const enrichedLogs = await Promise.all(
      logs.map(async (log) => {
        const user = await ctx.db.get(log.actorUserId);
        return {
          ...log,
          actorName: user?.name || "Unknown User",
          actorEmail: user?.email || "Unknown Email",
        };
      })
    );

    return enrichedLogs;
  },
});

// NPD status summary report
export const npdSummary = query({
  args: {
    organizationId: v.id("organizations"),
    tahun: v.number(),
  },
  handler: async (ctx, args) => {
    const { organizationId, tahun } = args;

    // Get all NPDs for the organization and year
    const npds = await ctx.db
      .query("npdDocuments")
      .withIndex("by_organization_tahun", (q) =>
        q.eq("organizationId", organizationId).eq("tahun", tahun)
      )
      .collect();

    // Group by status and calculate totals
    const summary = npds.reduce(
      (acc, npd) => {
        const status = npd.status;
        if (!acc[status]) {
          acc[status] = {
            count: 0,
            totalAmount: 0,
          };
        }
        acc[status].count += 1;

        // Get total amount from NPD lines
        const lines = ctx.db
          .query("npdLines")
          .withIndex("by_npd", (q) => q.eq("npdId", npd._id))
          .collect();

        // For now, we'll add placeholder for total calculation
        // In a real implementation, you'd want to optimize this query
        acc[status].totalAmount += 0; // TODO: Calculate actual total

        return acc;
      },
      {} as Record<string, { count: number; totalAmount: number }>
    );

    return {
      tahun,
      totalNPDs: npds.length,
      summary,
    };
  },
});