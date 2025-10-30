import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Validation rules per organization
export const getValidationRules = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    // Default validation rules
    const defaultRules = {
      // NPD validations
      npd: {
        maxAmountPerAccount: 100000000, // Max 100 juta per account
        maxLinesPerNPD: 50,
        requiredAttachments: {
          UP: ['RAB'], // Rencana Anggaran Belanja
          GU: ['RAB', 'SPD'], // Surat Permintaan Dana
          TU: ['RAB', 'SPD'], // Tanda Bukti Uang
          LS: ['Kontrak', 'BAST'], // Barang dan Jasa
        },
        workflowRestrictions: {
          // Only allow certain status transitions based on role
        }
      },

      // SP2D validations
      sp2d: {
        maxNilaiCair: 999999999, // Max 999 juta
        requireSPMNumber: true,
        allowBackdate: false, // Cannot backdate SP2D
      },

      // Account validations
      accounts: {
        allowNegativePagu: false,
        requireCodeFormat: true, // Must follow 5.XX.XX.XX.XXX format
        maxAccountsPerSubkegiatan: 100,
      }
    };

    // Get custom rules from organization if exists
    const customRules = organization.validationRules || {};

    // Merge with custom rules taking precedence
    const mergedRules = {
      npd: { ...defaultRules.npd, ...customRules.npd },
      sp2d: { ...defaultRules.sp2d, ...customRules.sp2d },
      accounts: { ...defaultRules.accounts, ...customRules.accounts },
    };

    return mergedRules;
  },
});

// Validate NPD before creation/update
export const validateNPD = mutation({
  args: {
    organizationId: v.id("organizations"),
    npdData: v.object({
      jenis: v.string(),
      lines: v.array(v.object({
        accountId: v.id("rkaAccounts"),
        jumlah: v.number(),
      })),
    }),
  },
  handler: async (ctx, args) => {
    const { organizationId, npdData } = args;

    // Get validation rules
    const rules = await ctx.db.query(api.validations.getValidationRules, {
      organizationId
    });

    const errors = [];

    // Validate each line
    for (const [index, line] of npdData.lines.entries()) {
      // Get account details
      const account = await ctx.db.get(line.accountId);
      if (!account) {
        errors.push(`Baris ${index + 1}: Akun tidak ditemukan`);
        continue;
      }

      // Validate sisa pagu
      const sisaPagu = account.paguTahun - account.realisasiTahun;
      if (line.jumlah > sisaPagu) {
        errors.push(`Baris ${index + 1}: Jumlah (${line.jumlah}) melebihi sisa pagu (${formatCurrency(sisaPagu)}) untuk akun ${account.kode}`);
      }

      // Validate max amount per account
      if (line.jumlah > rules.npd.maxAmountPerAccount) {
        errors.push(`Baris ${index + 1}: Jumlah (${line.jumlah}) melebihi batas maksimal per akun (${formatCurrency(rules.npd.maxAmountPerAccount)})`);
      }

      // Validate account is active
      if (account.status !== 'active') {
        errors.push(`Baris ${index + 1}: Akun ${account.kode} tidak aktif`);
      }
    }

    // Validate total lines
    if (npdData.lines.length > rules.npd.maxLinesPerNPD) {
      errors.push(`NPD memiliki terlalu banyak baris (${npdData.lines.length}). Maksimal: ${rules.npd.maxLinesPerNPD}`);
    }

    // Validate total amount
    const totalAmount = npdData.lines.reduce((sum, line) => sum + line.jumlah, 0);
    if (totalAmount > rules.npd.maxAmountPerAccount * npdData.lines.length) {
      errors.push(`Total jumlah (${formatCurrency(totalAmount)}) melebihi batas yang diizinkan`);
    }

    // Check required attachments
    const requiredAttachments = rules.npd.requiredAttachments[npdData.jenis] || [];
    // Note: In real implementation, you'd check if these attachments exist

    return {
      isValid: errors.length === 0,
      errors,
      warnings: requiredAttachments.length > 0 ? [
        `Lampiran wajib untuk ${npdData.jenis}: ${requiredAttachments.join(', ')}`
      ] : [],
    };
  },
});

// Validate SP2D creation
export const validateSP2D = mutation({
  args: {
    organizationId: v.id("organizations"),
    sp2dData: v.object({
      npdId: v.id("npdDocuments"),
      noSP2D: v.string(),
      tglSP2D: v.number(),
      nilaiCair: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    const { organizationId, sp2dData } = args;

    // Get validation rules
    const rules = await ctx.db.query(api.validations.getValidationRules, {
      organizationId
    });

    const errors = [];

    // Get NPD details
    const npd = await ctx.db.get(sp2dData.npdId);
    if (!npd) {
      errors.push('NPD tidak ditemukan');
      return { isValid: false, errors };
    }

    // Validate NPD status
    if (npd.status !== 'final') {
      errors.push(`NPD harus dalam status final. Status sekarang: ${npd.status}`);
    }

    // Validate SP2D format
    if (!rules.sp2d.noSP2D || sp2dData.noSP2D.length === 0) {
      errors.push('Nomor SP2D wajib diisi');
    }

    // Validate amount
    if (sp2dData.nilaiCair > rules.sp2d.maxNilaiCair) {
      errors.push(`Nilai cair (${formatCurrency(sp2dData.nilaiCair)}) melebihi batas maksimal (${formatCurrency(rules.sp2d.maxNilaiCair)})`);
    }

    // Validate date - no backdating
    const sp2dDate = new Date(sp2dData.tglSP2D);
    const npdFinalizedDate = npd.finalizedAt ? new Date(npd.finalizedAt) : null;

    if (!rules.sp2d.allowBackdate && npdFinalizedDate && sp2dDate < npdFinalizedDate) {
      errors.push('Tanggal SP2D tidak boleh lebih awal dari tanggal finalisasi NPD');
    }

    // Validate amount doesn't exceed NPD total
    const npdLines = await ctx.db
      .query("npdLines")
      .withIndex("by_npd", (q) => q.eq("npdId", sp2dData.npdId))
      .collect();

    const totalNPDAmount = npdLines.reduce((sum, line) => sum + line.jumlah, 0);
    if (sp2dData.nilaiCair > totalNPDAmount) {
      errors.push(`Nilai cair (${formatCurrency(sp2dData.nilaiCair)}) melebihi total NPD (${formatCurrency(totalNPDAmount)})`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: [],
    };
  },
});

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}