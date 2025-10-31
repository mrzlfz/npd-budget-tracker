import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

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

// Template variants for different NPD types
export const getTemplateVariants = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    const baseConfig = organization.pdfTemplateConfig || {};

    return {
      UP: {
        ...baseConfig,
        templateType: "UP",
        title: "Nota Pencairan Dana - Uang Persediaan",
        requiredFields: ["suratPermohonan", "rincianBiaya", "buktiPendukung"],
      },
      GU: {
        ...baseConfig,
        templateType: "GU",
        title: "Nota Pencairan Dana - Ganti Uang",
        requiredFields: ["suratPengantar", "kwitansiAsli", "buktiPendukung"],
      },
      TU: {
        ...baseConfig,
        templateType: "TU",
        title: "Nota Pencairan Dana - Tambahan Uang",
        requiredFields: ["suratPermohonan", "rincianBiaya", "buktiPendukung"],
      },
      LS: {
        ...baseConfig,
        templateType: "LS",
        title: "Nota Pencairan Dana - Lanjutan Surat",
        requiredFields: ["suratPerintah", "kwitansiAsli", "buktiPendukung"],
      },
    };
  },
});

// Generate NPD PDF
export const generateNPDPDF = action({
  args: {
    npdId: v.id("npdDocuments"),
    templateOptions: v.optional(v.object({
      includeWatermark: v.boolean(),
      includeSignatures: v.boolean(),
      customHeader: v.optional(v.string()),
      customFooter: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get NPD with related data
    const npd = await ctx.runQuery(ctx.internal, "npd.getById", { npdId: args.npdId });
    if (!npd) {
      throw new Error("NPD not found");
    }

    // Get NPD lines with account details
    const npdLines = await ctx.runQuery(ctx.internal, "npd.getLines", { npdId: args.npdId });
    if (!npdLines || npdLines.length === 0) {
      throw new Error("NPD lines not found");
    }

    // Get organization and template config
    const organization = await ctx.runQuery(ctx.internal, "organizations.getById", {
      organizationId: npd.organizationId
    });
    if (!organization) {
      throw new Error("Organization not found");
    }

    // Get template variant for NPD type
    const templateVariants = await ctx.runQuery(ctx.internal, "pdfTemplates.getTemplateVariants", {
      organizationId: npd.organizationId,
    });
    const templateConfig = templateVariants[npd.jenis as keyof typeof templateVariants];

    // Get user for authentication
    const user = await ctx.runQuery(ctx.internal, "users.getById", { userId });
    if (!user) {
      throw new Error("User not found");
    }

    // Prepare PDF data
    const pdfData = {
      npd: {
        ...npd,
        createdAt: new Date(npd.createdAt).toLocaleDateString("id-ID"),
        tahun: npd.tahun,
      },
      organization: {
        ...organization,
        logoUrl: organization.pdfTemplateConfig?.logoUrl,
        kopSurat: organization.pdfTemplateConfig?.kopSurat,
        footerText: organization.pdfTemplateConfig?.footerText,
      },
      templateConfig,
      npdLines: npdLines.map(line => ({
        ...line,
        jumlah: new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
        }).format(line.jumlah),
      })),
      totalAmount: npdLines.reduce((sum, line) => sum + line.jumlah, 0),
      generatedBy: {
        name: user.name || user.email,
        role: user.role,
        timestamp: new Date().toLocaleString("id-ID"),
      },
      options: args.templateOptions || {
        includeWatermark: false,
        includeSignatures: true,
      },
    };

    try {
      // Generate PDF using internal action (to be implemented with Playwright)
      const pdfBuffer = await ctx.runAction(ctx.internal, "pdfTemplates.renderPDF", {
        templateData: pdfData,
        templateType: npd.jenis,
      });

      // Store PDF file info
      const pdfInfo = await ctx.runMutation(ctx.internal, "npd.addAttachment", {
        npdId: args.npdId,
        attachment: {
          jenis: "PDF_NPD",
          namaFile: `NPD_${npd.documentNumber}_${npd.jenis}.pdf`,
          url: pdfBuffer.url, // Will be set by file upload
          ukuran: pdfBuffer.size,
          tipeMime: "application/pdf",
          keterangan: "PDF NPD generated from template",
        },
      });

      // Log generation
      await ctx.runMutation(ctx.internal, "auditLogs.create", {
        action: "generated_pdf",
        entityTable: "npdDocuments",
        entityId: args.npdId,
        keterangan: `Generated ${npd.jenis} PDF with template`,
        organizationId: npd.organizationId,
        actorUserId: userId,
      });

      return {
        success: true,
        pdfUrl: pdfBuffer.url,
        attachmentId: pdfInfo,
      };
    } catch (error) {
      console.error("PDF generation error:", error);
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

// Internal action to render PDF with Playwright
export const renderPDF = action({
  args: {
    templateData: v.any(),
    templateType: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("Rendering PDF for:", args.templateType);

    try {
      // Create HTML template
      const htmlContent = generateHTMLTemplate(args.templateData, args.templateType);

      // Create a temporary file with HTML content for testing
      const timestamp = Date.now();
      const fileName = `npd_${args.templateData.npd.documentNumber}_${timestamp}.html`;

      // Mock PDF generation response with HTML content for debugging
      return {
        url: `/api/pdf/preview/${fileName}`,
        size: 1024000, // 1MB mock
        htmlContent, // For debugging
        success: true,
      };
    } catch (error) {
      throw new Error(`PDF rendering failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

// Generate HTML template for PDF
function generateHTMLTemplate(data: any, templateType: string): string {
  const { npd, organization, templateConfig, npdLines, generatedBy } = data;

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${templateConfig.title}</title>
        <style>
            @page {
                margin: 20mm;
                size: A4;
            }
            body {
                font-family: ${templateConfig.customStyles?.bodyFont || 'Arial'};
                font-size: 12px;
                line-height: 1.4;
                margin: 0;
                padding: 0;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid ${templateConfig.customStyles?.headerColor || '#000'};
                padding-bottom: 15px;
            }
            .logo {
                max-width: 120px;
                max-height: 80px;
                margin-bottom: 10px;
            }
            .kop-surat {
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 5px;
            }
            .title {
                text-align: center;
                font-size: 16px;
                font-weight: bold;
                margin: 20px 0;
                text-transform: uppercase;
            }
            .info-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            .info-table td {
                padding: 8px;
                border: 1px solid #ddd;
            }
            .info-table td:first-child {
                font-weight: bold;
                width: 30%;
                background-color: #f5f5f5;
            }
            .rincian-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            .rincian-table th,
            .rincian-table td {
                padding: 10px;
                border: 1px solid #ddd;
                text-align: left;
            }
            .rincian-table th {
                background-color: #f2f2f2;
                font-weight: bold;
            }
            .rincian-table .text-right {
                text-align: right;
            }
            .total-row {
                font-weight: bold;
                background-color: #f9f9f9;
            }
            .signatures {
                margin-top: 50px;
                display: flex;
                justify-content: space-between;
            }
            .signature-box {
                width: 45%;
                text-align: center;
            }
            .signature-line {
                border-top: 1px solid #000;
                margin: 40px 0 5px 0;
            }
            .footer {
                position: fixed;
                bottom: 20px;
                left: 20px;
                right: 20px;
                text-align: center;
                font-size: 10px;
                color: #666;
            }
            .watermark {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 72px;
                opacity: 0.1;
                color: #000;
                z-index: -1;
            }
        </style>
    </head>
    <body>
        ${data.options?.includeWatermark ? '<div class="watermark">DRAFT</div>' : ''}

        <div class="header">
            ${organization.logoUrl ? `<img src="${organization.logoUrl}" class="logo" alt="Logo">` : ''}
            ${organization.kopSurat ? `<div class="kop-surat">${organization.kopSurat}</div>` : ''}
        </div>

        <h1 class="title">${templateConfig.title}</h1>

        <table class="info-table">
            <tr>
                <td>Nomor NPD</td>
                <td>${npd.documentNumber}</td>
            </tr>
            <tr>
                <td>Tanggal</td>
                <td>${npd.createdAt}</td>
            </tr>
            <tr>
                <td>Jenis</td>
                <td>${npd.jenis}</td>
            </tr>
            <tr>
                <td>Tahun Anggaran</td>
                <td>${npd.tahun}</td>
            </tr>
            <tr>
                <td>Sub Kegiatan</td>
                <td>${npd.subkegiatanId}</td>
            </tr>
            ${npd.catatan ? `
            <tr>
                <td>Catatan</td>
                <td>${npd.catatan}</td>
            </tr>` : ''}
        </table>

        <h2>Rincian Akun</h2>
        <table class="rincian-table">
            <thead>
                <tr>
                    <th>No</th>
                    <th>Kode Akun</th>
                    <th>Uraian</th>
                    <th>Jumlah</th>
                </tr>
            </thead>
            <tbody>
                ${npdLines.map((line: any, index: number) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${line.kodeAkun}</td>
                    <td>${line.uraian}</td>
                    <td class="text-right">${line.jumlah}</td>
                </tr>`).join('')}
                <tr class="total-row">
                    <td colspan="3" style="text-align: right;"><strong>TOTAL</strong></td>
                    <td class="text-right"><strong>${new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                    }).format(data.totalAmount)}</strong></td>
                </tr>
            </tbody>
        </table>

        ${data.options?.includeSignatures && templateConfig.signatures ? `
        <div class="signatures">
            ${templateConfig.signatures.map((signature: any) => `
            <div class="signature-box">
                <div class="signature-line"></div>
                <div>${signature.name}</div>
                <div>${signature.title}</div>
                ${signature.position ? `<div>${signature.position}</div>` : ''}
            </div>`).join('')}
        </div>` : ''}

        ${organization.footerText ? `
        <div class="footer">
            ${organization.footerText}
        </div>` : ''}

        <div style="margin-top: 30px; font-size: 10px; color: #666;">
            Dibuat oleh: ${generatedBy.name} (${generatedBy.role}) pada ${generatedBy.timestamp}
        </div>
    </body>
    </html>
  `;
}

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

// Template variants for different NPD types
export const getTemplateVariants = query({
  args: {
    organizationId: v.id("organizations"),
  },
  handler: async (ctx, args) => {
    const organization = await ctx.db.get(args.organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    const baseConfig = organization.pdfTemplateConfig || {};

    return {
      UP: {
        ...baseConfig,
        templateType: "UP",
        title: "Nota Pencairan Dana - Uang Persediaan",
        requiredFields: ["suratPermohonan", "rincianBiaya", "buktiPendukung"],
      },
      GU: {
        ...baseConfig,
        templateType: "GU",
        title: "Nota Pencairan Dana - Ganti Uang",
        requiredFields: ["suratPengantar", "kwitansiAsli", "buktiPendukung"],
      },
      TU: {
        ...baseConfig,
        templateType: "TU",
        title: "Nota Pencairan Dana - Tambahan Uang",
        requiredFields: ["suratPermohonan", "rincianBiaya", "buktiPendukung"],
      },
      LS: {
        ...baseConfig,
        templateType: "LS",
        title: "Nota Pencairan Dana - Lanjutan Surat",
        requiredFields: ["suratPerintah", "kwitansiAsli", "buktiPendukung"],
      },
    };
  },
});

// Generate NPD PDF
export const generateNPDPDF = action({
  args: {
    npdId: v.id("npdDocuments"),
    templateOptions: v.optional(v.object({
      includeWatermark: v.boolean(),
      includeSignatures: v.boolean(),
      customHeader: v.optional(v.string()),
      customFooter: v.optional(v.string()),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Get NPD with related data
    const npd = await ctx.runQuery(ctx.internal, "npd.getById", { npdId: args.npdId });
    if (!npd) {
      throw new Error("NPD not found");
    }

    // Get NPD lines with account details
    const npdLines = await ctx.runQuery(ctx.internal, "npd.getLines", { npdId: args.npdId });
    if (!npdLines || npdLines.length === 0) {
      throw new Error("NPD lines not found");
    }

    // Get organization and template config
    const organization = await ctx.runQuery(ctx.internal, "organizations.getById", {
      organizationId: npd.organizationId
    });
    if (!organization) {
      throw new Error("Organization not found");
    }

    // Get template variant for NPD type
    const templateVariants = await ctx.runQuery(ctx.internal, "pdfTemplates.getTemplateVariants", {
      organizationId: npd.organizationId,
    });
    const templateConfig = templateVariants[npd.jenis as keyof typeof templateVariants];

    // Get user for authentication
    const user = await ctx.runQuery(ctx.internal, "users.getById", { userId });
    if (!user) {
      throw new Error("User not found");
    }

    // Prepare PDF data
    const pdfData = {
      npd: {
        ...npd,
        createdAt: new Date(npd.createdAt).toLocaleDateString("id-ID"),
        tahun: npd.tahun,
      },
      organization: {
        ...organization,
        logoUrl: organization.pdfTemplateConfig?.logoUrl,
        kopSurat: organization.pdfTemplateConfig?.kopSurat,
        footerText: organization.pdfTemplateConfig?.footerText,
      },
      templateConfig,
      npdLines: npdLines.map(line => ({
        ...line,
        jumlah: new Intl.NumberFormat("id-ID", {
          style: "currency",
          currency: "IDR",
        }).format(line.jumlah),
      })),
      totalAmount: npdLines.reduce((sum, line) => sum + line.jumlah, 0),
      generatedBy: {
        name: user.name || user.email,
        role: user.role,
        timestamp: new Date().toLocaleString("id-ID"),
      },
      options: args.templateOptions || {
        includeWatermark: false,
        includeSignatures: true,
      },
    };

    try {
      // Generate PDF using internal action (to be implemented with Playwright)
      const pdfBuffer = await ctx.runAction(ctx.internal, "pdfTemplates.renderPDF", {
        templateData: pdfData,
        templateType: npd.jenis,
      });

      // Store PDF file info
      const pdfInfo = await ctx.runMutation(ctx.internal, "npd.addAttachment", {
        npdId: args.npdId,
        attachment: {
          jenis: "PDF_NPD",
          namaFile: `NPD_${npd.documentNumber}_${npd.jenis}.pdf`,
          url: pdfBuffer.url, // Will be set by file upload
          ukuran: pdfBuffer.size,
          tipeMime: "application/pdf",
          keterangan: "PDF NPD generated from template",
        },
      });

      // Log generation
      await ctx.runMutation(ctx.internal, "auditLogs.create", {
        action: "generated_pdf",
        entityTable: "npdDocuments",
        entityId: args.npdId,
        keterangan: `Generated ${npd.jenis} PDF with template`,
        organizationId: npd.organizationId,
        actorUserId: userId,
      });

      return {
        success: true,
        pdfUrl: pdfBuffer.url,
        attachmentId: pdfInfo,
      };
    } catch (error) {
      console.error("PDF generation error:", error);
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

// Internal action to render PDF with Playwright
export const renderPDF = action({
  args: {
    templateData: v.any(),
    templateType: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("Rendering PDF for:", args.templateType);

    try {
      // Create HTML template
      const htmlContent = generateHTMLTemplate(args.templateData, args.templateType);

      // Create a temporary file with HTML content for testing
      const timestamp = Date.now();
      const fileName = `npd_${args.templateData.npd.documentNumber}_${timestamp}.html`;

      // Mock PDF generation response with HTML content for debugging
      return {
        url: `/api/pdf/preview/${fileName}`,
        size: 1024000, // 1MB mock
        htmlContent, // For debugging
        success: true,
      };
    } catch (error) {
      throw new Error(`PDF rendering failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  },
});

// Generate HTML template for PDF
function generateHTMLTemplate(data: any, templateType: string): string {
  const { npd, organization, templateConfig, npdLines, generatedBy } = data;

  return `
    <!DOCTYPE html>
    <html lang="id">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${templateConfig.title}</title>
        <style>
            @page {
                margin: 20mm;
                size: A4;
            }
            body {
                font-family: ${templateConfig.customStyles?.bodyFont || 'Arial'};
                font-size: 12px;
                line-height: 1.4;
                margin: 0;
                padding: 0;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid ${templateConfig.customStyles?.headerColor || '#000'};
                padding-bottom: 15px;
            }
            .logo {
                max-width: 120px;
                max-height: 80px;
                margin-bottom: 10px;
            }
            .kop-surat {
                font-weight: bold;
                font-size: 14px;
                margin-bottom: 5px;
            }
            .title {
                text-align: center;
                font-size: 16px;
                font-weight: bold;
                margin: 20px 0;
                text-transform: uppercase;
            }
            .info-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            .info-table td {
                padding: 8px;
                border: 1px solid #ddd;
            }
            .info-table td:first-child {
                font-weight: bold;
                width: 30%;
                background-color: #f5f5f5;
            }
            .rincian-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
            }
            .rincian-table th,
            .rincian-table td {
                padding: 10px;
                border: 1px solid #ddd;
                text-align: left;
            }
            .rincian-table th {
                background-color: #f2f2f2;
                font-weight: bold;
            }
            .rincian-table .text-right {
                text-align: right;
            }
            .total-row {
                font-weight: bold;
                background-color: #f9f9f9;
            }
            .signatures {
                margin-top: 50px;
                display: flex;
                justify-content: space-between;
            }
            .signature-box {
                width: 45%;
                text-align: center;
            }
            .signature-line {
                border-top: 1px solid #000;
                margin: 40px 0 5px 0;
            }
            .footer {
                position: fixed;
                bottom: 20px;
                left: 20px;
                right: 20px;
                text-align: center;
                font-size: 10px;
                color: #666;
            }
            .watermark {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 72px;
                opacity: 0.1;
                color: #000;
                z-index: -1;
            }
        </style>
    </head>
    <body>
        ${data.options?.includeWatermark ? '<div class="watermark">DRAFT</div>' : ''}

        <div class="header">
            ${organization.logoUrl ? `<img src="${organization.logoUrl}" class="logo" alt="Logo">` : ''}
            ${organization.kopSurat ? `<div class="kop-surat">${organization.kopSurat}</div>` : ''}
        </div>

        <h1 class="title">${templateConfig.title}</h1>

        <table class="info-table">
            <tr>
                <td>Nomor NPD</td>
                <td>${npd.documentNumber}</td>
            </tr>
            <tr>
                <td>Tanggal</td>
                <td>${npd.createdAt}</td>
            </tr>
            <tr>
                <td>Jenis</td>
                <td>${npd.jenis}</td>
            </tr>
            <tr>
                <td>Tahun Anggaran</td>
                <td>${npd.tahun}</td>
            </tr>
            <tr>
                <td>Sub Kegiatan</td>
                <td>${npd.subkegiatanId}</td>
            </tr>
            ${npd.catatan ? `
            <tr>
                <td>Catatan</td>
                <td>${npd.catatan}</td>
            </tr>` : ''}
        </table>

        <h2>Rincian Akun</h2>
        <table class="rincian-table">
            <thead>
                <tr>
                    <th>No</th>
                    <th>Kode Akun</th>
                    <th>Uraian</th>
                    <th>Jumlah</th>
                </tr>
            </thead>
            <tbody>
                ${npdLines.map((line: any, index: number) => `
                <tr>
                    <td>${index + 1}</td>
                    <td>${line.kodeAkun}</td>
                    <td>${line.uraian}</td>
                    <td class="text-right">${line.jumlah}</td>
                </tr>`).join('')}
                <tr class="total-row">
                    <td colspan="3" style="text-align: right;"><strong>TOTAL</strong></td>
                    <td class="text-right"><strong>${new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                    }).format(data.totalAmount)}</strong></td>
                </tr>
            </tbody>
        </table>

        ${data.options?.includeSignatures && templateConfig.signatures ? `
        <div class="signatures">
            ${templateConfig.signatures.map((signature: any) => `
            <div class="signature-box">
                <div class="signature-line"></div>
                <div>${signature.name}</div>
                <div>${signature.title}</div>
                ${signature.position ? `<div>${signature.position}</div>` : ''}
            </div>`).join('')}
        </div>` : ''}

        ${organization.footerText ? `
        <div class="footer">
            ${organization.footerText}
        </div>` : ''}

        <div style="margin-top: 30px; font-size: 10px; color: #666;">
            Dibuat oleh: ${generatedBy.name} (${generatedBy.role}) pada ${generatedBy.timestamp}
        </div>
    </body>
    </html>
  `;
}