import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get quarterly report data
export const getQuarterlyReportData = query({
  args: {
    organizationId: v.id("organizations"),
    tahun: v.number(),
    quarter: v.string(), // "Q1", "Q2", "Q3", "Q4"
  },
  handler: async (ctx, { organizationId, tahun, quarter }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Check permissions
    const user = await ctx.db.get(userId);
    if (!user || user.organizationId !== organizationId) {
      throw new Error("Access denied");
    }

    // Get quarter months
    const quarterMonths = {
      Q1: [1, 2, 3],
      Q2: [4, 5, 6],
      Q3: [7, 8, 9],
      Q4: [10, 11, 12]
    };

    const months = quarterMonths[quarter as keyof typeof quarterMonths] || [];

    // Get NPD data for the period
    const npdQuery = ctx.db
      .query("npdDocuments")
      .withIndex("by_organization_tahun", q =>
        q.eq("organizationId", organizationId)
        .eq("tahun", tahun)
      );

    const npds = await npdQuery.collect();

    // Get SP2D data
    const sp2dQuery = ctx.db
      .query("sp2dRefs")
      .withIndex("by_organization", q => q.eq("organizationId", organizationId));

    const sp2dRefs = await sp2dQuery.collect();

    // Filter SP2D by quarter
    const sp2dInQuarter = sp2dRefs.filter(sp2d => {
      const sp2dDate = new Date(sp2d.tglSP2D);
      return sp2dDate.getMonth() + 1 >= months[0] && sp2dDate.getMonth() + 1 <= months[2];
    });

    // Calculate metrics
    const totalNPDs = npds.length;
    const finalizedNPDs = npds.filter(npd => npd.status === "final").length;
    const totalSP2D = sp2dInQuarter.length;
    const totalNilai = sp2dInQuarter.reduce((sum, sp2d) => sum + sp2d.nilaiCair, 0);

    // Get top programs by budget
    const programsQuery = ctx.db
      .query("rkaPrograms")
      .withIndex("by_organization_fiscal_year", q =>
        q.eq("organizationId", organizationId)
        .eq("fiscalYear", tahun)
      );

    const programs = await programsQuery.collect();

    const topPrograms = programs
      .sort((a, b) => b.totalPagu - a.totalPagu)
      .slice(0, 10)
      .map(program => ({
        kode: program.kode,
        nama: program.nama,
        pagu: program.totalPagu,
        realisasi: program.totalPagu * 0.65, // Mock realization
        persentase: 65
      }));

    // Get top accounts by realization
    const accountsQuery = ctx.db
      .query("rkaAccounts")
      .withIndex("by_organization_fiscal_year", q =>
        q.eq("organizationId", organizationId)
        .eq("fiscalYear", tahun)
      );

    const accounts = await accountsQuery.collect();

    const topAccounts = accounts
      .sort((a, b) => b.realisasiTahun - a.realisasiTahun)
      .slice(0, 10)
      .map(account => ({
        kode: account.kode,
        uraian: account.uraian,
        pagu: account.paguTahun,
        realisasi: account.realisasiTahun,
        persentase: account.paguTahun > 0 ? (account.realisasiTahun / account.paguTahun) * 100 : 0
      }));

    // Calculate performance rate (mock)
    const avgPerformanceRate = 0.85; // Mock: 85% average

    return {
      totalNPDs,
      finalizedNPDs,
      totalSP2D,
      totalNilai,
      avgPerformanceRate,
      topPrograms,
      topAccounts,
    };
  },
});

// Generate quarterly report
export const generateQuarterlyReport = mutation({
  args: {
    organizationId: v.id("organizations"),
    tahun: v.number(),
    quarter: v.string(),
  },
  handler: async (ctx, { organizationId, tahun, quarter }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Check permissions
    const user = await ctx.db.get(userId);
    if (!user || user.organizationId !== organizationId) {
      throw new Error("Access denied");
    }

    // Log the report generation
    await ctx.db.insert("auditLogs", {
      action: "generated_report",
      entityTable: "quarterly_reports",
      entityId: `${organizationId}_${tahun}_${quarter}`,
      actorUserId: userId,
      organizationId,
      createdAt: Date.now(),
    });

    return {
      success: true,
      message: `Quarterly report ${quarter} ${tahun} queued for generation`,
      reportId: `${organizationId}_${tahun}_${quarter}`
    };
  },
});