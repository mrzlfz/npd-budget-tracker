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
    const rules = await ctx.runQuery(api.validations.getValidationRules, {
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
    const rules = await ctx.runQuery(api.validations.getValidationRules, {
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

// PRD Section C2: File attachment validation per NPD type
export interface NpdTypeValidation {
  jenis: string;
  nama: string;
  requiredAttachments: string[];
  optionalAttachments: string[];
  maxFiles: number;
  maxFileSizeMB: number;
  allowedTypes: Record<string, string[]>;
}

// NPD type validation rules according to PRD
const NPD_TYPE_VALIDATIONS: Record<string, NpdTypeValidation> = {
  UP: {
    jenis: "UP",
    nama: "Uang Persediaan",
    requiredAttachments: ["RAB"],
    optionalAttachments: ["Kwitansi", "Faktur", "BAST"],
    maxFiles: 5,
    maxFileSizeMB: 10,
    allowedTypes: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
  },
  GU: {
    jenis: "GU",
    nama: "Ganti Uang",
    requiredAttachments: ["Kwitansi", "Surat Pengantar"],
    optionalAttachments: ["Faktur", "BAST", "Dokumen Pendukung"],
    maxFiles: 8,
    maxFileSizeMB: 10,
    allowedTypes: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
  },
  TU: {
    jenis: "TU",
    nama: "Tambahan Uang",
    requiredAttachments: ["Surat Permohonan", "Dokumen Pendukung"],
    optionalAttachments: ["RAB", "Kwitansi", "Faktur", "BAST"],
    maxFiles: 6,
    maxFileSizeMB: 10,
    allowedTypes: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
    },
  },
  LS: {
    jenis: "LS",
    nama: "Langsung",
    requiredAttachments: ["Kontrak", "BAST", "Faktur"],
    optionalAttachments: ["RAB", "Dokumen Pendukung", "Foto Kegiatan"],
    maxFiles: 10,
    maxFileSizeMB: 15, // Larger for contracts
    allowedTypes: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/gif": [".gif"],
    },
  },
};

// Query to get validation rules for a specific NPD type
export const getNpdTypeValidation = query({
  args: {
    jenis: v.string(), // "UP", "GU", "TU", "LS"
  },
  handler: async (ctx, { jenis }) => {
    const validation = NPD_TYPE_VALIDATIONS[jenis.toUpperCase()];

    if (!validation) {
      throw new Error(`Unknown NPD type: ${jenis}`);
    }

    return validation;
  },
});

// Query to validate attachments for an NPD
export const validateNpdAttachments = query({
  args: {
    jenis: v.string(),
    attachments: v.array(v.object({
      jenis: v.string(), // Type of attachment
      filename: v.string(),
      fileSize: v.number(),
      mimeType: v.string(),
    })),
  },
  handler: async (ctx, { jenis, attachments }) => {
    const validation = NPD_TYPE_VALIDATIONS[jenis.toUpperCase()];

    if (!validation) {
      throw new Error(`Unknown NPD type: ${jenis}`);
    }

    const result = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
      missingRequired: [] as string[],
      hasOptional: [] as string[],
      validAttachments: [] as any[],
      invalidAttachments: [] as any[],
    };

    // Check file count
    if (attachments.length > validation.maxFiles) {
      result.isValid = false;
      result.errors.push(
        `Maksimal ${validation.maxFiles} file, saat ini ${attachments.length} file`
      );
    }

    // Check each attachment
    for (const attachment of attachments) {
      const attachmentErrors: string[] = [];

      // Check file size
      const fileSizeMB = attachment.fileSize / (1024 * 1024);
      if (fileSizeMB > validation.maxFileSizeMB) {
        attachmentErrors.push(
          `File ${attachment.filename} terlalu besar. Maksimal ${validation.maxFileSizeMB}MB`
        );
      }

      // Check file type
      const isValidType = Object.entries(validation.allowedTypes).some(([mimeType, extensions]) =>
        attachment.mimeType === mimeType ||
        extensions.some((ext) =>
          attachment.filename.toLowerCase().endsWith(ext)
        )
      );

      if (!isValidType) {
        const allowedTypes = Object.entries(validation.allowedTypes)
          .map(([mimeType, extensions]) => extensions.join(", "))
          .join(", ");
        attachmentErrors.push(
          `File ${attachment.filename} tidak valid. Tipe yang diperbolehkan: ${allowedTypes}`
        );
      }

      if (attachmentErrors.length > 0) {
        result.invalidAttachments.push({
          ...attachment,
          errors: attachmentErrors,
        });
      } else {
        result.validAttachments.push(attachment);
      }
    }

    // Check required attachments
    const presentTypes = attachments.map(a => a.jenis);
    for (const requiredType of validation.requiredAttachments) {
      if (!presentTypes.includes(requiredType)) {
        result.isValid = false;
        result.missingRequired.push(requiredType);
      }
    }

    // Check optional attachments
    for (const optionalType of validation.optionalAttachments) {
      if (presentTypes.includes(optionalType)) {
        result.hasOptional.push(optionalType);
      }
    }

    // Generate warning if no optional attachments
    if (validation.optionalAttachments.length > 0 && result.hasOptional.length === 0) {
      result.warnings.push(
        `Tidak ada lampiran opsional. Pertimbangkan untuk melampirkan: ${validation.optionalAttachments.join(", ")}`
      );
    }

    return result;
  },
});

// Query to check if NPD can be submitted based on attachments
export const canSubmitNpd = query({
  args: {
    jenis: v.string(),
    attachments: v.array(v.object({
      jenis: v.string(),
      filename: v.string(),
      fileSize: v.number(),
      mimeType: v.string(),
    })),
  },
  handler: async (ctx, { jenis, attachments }) => {
    const validation = await validateNpdAttachments({ jenis, attachments });

    return {
      canSubmit: validation.isValid && validation.missingRequired.length === 0,
      reason: validation.isValid && validation.missingRequired.length === 0
        ? "NPD dapat diajukan"
        : validation.errors.join("; ") ||
          `Tidak dapat mengajukan NPD. Lampiran wajib yang hilang: ${validation.missingRequired.join(", ")}`,
      validation,
    };
  },
});

// Helper function to get file category for display
export function getFileCategory(filename: string, mimeType: string): string {
  if (mimeType.startsWith("image/")) {
    return "Gambar";
  } else if (mimeType.includes("pdf")) {
    return "PDF";
  } else if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) {
    return "Spreadsheet";
  } else if (mimeType.includes("word") || mimeType.includes("document")) {
    return "Dokumen";
  } else {
    return "File Lainnya";
  }
}

// Helper function to validate single file
export function validateSingleFile(
  file: File,
  validation: NpdTypeValidation
): { isValid: boolean; error: string } {
  // Check file size
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > validation.maxFileSizeMB) {
    return {
      isValid: false,
      error: `File ${file.name} terlalu besar. Maksimal ${validation.maxFileSizeMB}MB`,
    };
  }

  // Check file type
  const isValidType = Object.entries(validation.allowedTypes).some(([mimeType, extensions]) =>
    file.type === mimeType ||
    extensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    )
  );

  if (!isValidType) {
    const allowedTypes = Object.entries(validation.allowedTypes)
      .map(([mimeType, extensions]) => extensions.join(", "))
      .join(", ");
    return {
      isValid: false,
      error: `File ${file.name} tidak valid. Tipe yang diperbolehkan: ${allowedTypes}`,
    };
  }

  return { isValid: true, error: "" };
}

// Helper function to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}