import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// CSV Import RKA function
export const importRKA = mutation({
  args: {
    organizationId: v.id("organizations"),
    fiscalYear: v.number(),
    csvData: v.array(v.object({
      programKode: v.string(),
      programNama: v.string(),
      kegiatanKode: v.string(),
      kegiatanNama: v.string(),
      subkegiatanKode: v.string(),
      subkegiatanNama: v.string(),
      akunKode: v.string(),
      akunUraian: v.string(),
      satuan: v.optional(v.string()),
      volume: v.optional(v.number()),
      hargaSatuan: v.optional(v.number()),
      paguTahun: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    const { organizationId, fiscalYear, csvData } = args;

    // Validate required fields
    const requiredFields = ['programKode', 'programNama', 'kegiatanKode', 'kegiatanNama',
                           'subkegiatanKode', 'subkegiatanNama', 'akunKode', 'akunUraian', 'paguTahun'];

    for (const [index, row] of csvData.entries()) {
      const missingFields = requiredFields.filter(field => !row[field] || row[field] === '');
      if (missingFields.length > 0) {
        throw new Error(`Baris ${index + 2}: Field yang diperlukan kosong: ${missingFields.join(', ')}`);
      }
    }

    // Validate kode format (should follow pattern X.XX.XX.XX.XXX)
    const kodePattern = /^\d+\.\d+\.\d+\.\d+\.\d+$/;
    for (const [index, row] of csvData.entries()) {
      if (!kodePattern.test(row.akunKode)) {
        throw new Error(`Baris ${index + 2}: Format kode akun tidak valid. Format yang benar: X.XX.XX.XX.XXX (contoh: 5.1.01.01.001)`);
      }
    }

    // Import data in batches to prevent timeouts
    const batchSize = 50;
    const batches = [];
    for (let i = 0; i < csvData.length; i += batchSize) {
      batches.push(csvData.slice(i, i + batchSize));
    }

    const importResults = {
      programs: new Map(),
      kegiatans: new Map(),
      subkegiatans: new Map(),
      accounts: [],
      errors: []
    };

    try {
      // Process each batch
      for (const batch of batches) {
        await processBatch(ctx, batch, importResults, organizationId, fiscalYear);
      }

      // Create summary
      const summary = {
        totalRows: csvData.length,
        programsCreated: importResults.programs.size,
        kegiatansCreated: importResults.kegiatans.size,
        subkegiatansCreated: importResults.subkegiatans.size,
        accountsCreated: importResults.accounts.length,
        errors: importResults.errors.length,
        fiscalYear
      };

      // Log import activity
      await ctx.db.insert("auditLogs", {
        action: "imported_rka",
        entityTable: "csv_import",
        entityId: `${organizationId}_${fiscalYear}`,
        entityData: summary,
        actorUserId: "system", // This should be replaced with actual user ID
        organizationId,
        createdAt: Date.now(),
      });

      return {
        success: true,
        summary,
        details: importResults
      };
    } catch (error) {
      // Log error
      await ctx.db.insert("auditLogs", {
        action: "import_rka_failed",
        entityTable: "csv_import",
        entityId: `${organizationId}_${fiscalYear}`,
        entityData: { error: error instanceof Error ? error.message : 'Unknown error' },
        actorUserId: "system",
        organizationId,
        createdAt: Date.now(),
      });

      throw error;
    }
  },
});

// Helper function to process batch
async function processBatch(ctx: any, batch: any[], results: any, organizationId: string, fiscalYear: number) {
  for (const row of batch) {
    try {
      // Process Program
      if (!results.programs.has(row.programKode)) {
        const program = await ctx.db.insert("rkaPrograms", {
          kode: row.programKode,
          nama: row.programNama,
          uraian: `Impor dari CSV - ${new Date().toLocaleDateString('id-ID')}`,
          organizationId,
          fiscalYear,
          totalPagu: 0, // Will be calculated from accounts
          status: "active",
          createdBy: "system", // Should be actual user ID
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        results.programs.set(row.programKode, program);
      }

      // Process Kegiatan
      const program = results.programs.get(row.programKode);
      if (program && !results.kegiatans.has(row.kegiatanKode)) {
        const kegiatan = await ctx.db.insert("rkaKegiatans", {
          programId: program._id,
          kode: row.kegiatanKode,
          nama: row.kegiatanNama,
          uraian: `Impor dari CSV - ${new Date().toLocaleDateString('id-ID')}`,
          organizationId,
          fiscalYear,
          totalPagu: 0, // Will be calculated from accounts
          status: "active",
          createdBy: "system",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        results.kegiatans.set(row.kegiatanKode, kegiatan);
      }

      // Process Sub Kegiatan
      const kegiatan = results.kegiatans.get(row.kegiatanKode);
      if (kegiatan && !results.subkegiatans.has(row.subkegiatanKode)) {
        const subkegiatan = await ctx.db.insert("rkaSubkegiatans", {
          kegiatanId: kegiatan._id,
          programId: program._id,
          kode: row.subkegiatanKode,
          nama: row.subkegiatanNama,
          uraian: `Impor dari CSV - ${new Date().toLocaleDateString('id-ID')}`,
          organizationId,
          fiscalYear,
          totalPagu: 0, // Will be calculated from accounts
          status: "active",
          // Indikator performance (optional dari CSV)
          indikatorOutput: undefined,
          targetOutput: undefined,
          satuanOutput: undefined,
          indikatorHasil: undefined,
          targetHasil: undefined,
          satuanHasil: undefined,
          createdBy: "system",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        results.subkegiatans.set(row.subkegiatanKode, subkegiatan);
      }

      // Process Account
      const subkegiatan = results.subkegiatans.get(row.subkegiatanKode);
      if (subkegiatan) {
        const account = await ctx.db.insert("rkaAccounts", {
          subkegiatanId: subkegiatan._id,
          kegiatanId: kegiatan._id,
          programId: program._id,
          kode: row.akunKode,
          uraian: row.akunUraian,
          satuan: row.satuan,
          volume: row.volume || 0,
          hargaSatuan: row.hargaSatuan || 0,
          paguTahun: row.paguTahun,
          realisasiTahun: 0, // Start with 0 realization
          sisaPagu: row.paguTahun, // Initially, sisa = pagu
          status: "active",
          organizationId,
          fiscalYear,
          createdBy: "system",
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        results.accounts.push(account);
      }
    } catch (error) {
      results.errors.push({
        row,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

// Validate CSV structure before import
export const validateCSVStructure = mutation({
  args: {
    headers: v.array(v.string()),
    sampleRow: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const { headers, sampleRow } = args;

    const requiredHeaders = [
      'programKode', 'programNama',
      'kegiatanKode', 'kegiatanNama',
      'subkegiatanKode', 'subkegiatanNama',
      'akunKode', 'akunUraian',
      'paguTahun'
    ];

    const optionalHeaders = [
      'satuan', 'volume', 'hargaSatuan'
    ];

    // Check required headers
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      return {
        valid: false,
        errors: [`Header yang diperlukan tidak ada: ${missingHeaders.join(', ')}`]
      };
    }

    // Check sample row data
    if (sampleRow.length > 0) {
      for (let i = 0; i < sampleRow.length; i++) {
        const header = headers[i];
        const value = sampleRow[i];

        if (requiredHeaders.includes(header) && (!value || value === '')) {
          return {
            valid: false,
            errors: [`Sample baris: Field '${header}' kosong`]
          };
        }
      }
    }

    return {
      valid: true,
      message: 'Struktur CSV valid untuk import RKA'
    };
  },
});