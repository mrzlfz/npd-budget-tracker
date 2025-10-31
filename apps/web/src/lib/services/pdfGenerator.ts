import { chromium, Browser, Page } from 'playwright'
import { formatCurrency } from '@/lib/utils/format'
import { api } from '@/convex/_generated/api'
import type { Id } from 'convex/values'

interface PDFGenerationOptions {
  format: 'A4' | 'Legal'
  orientation: 'portrait' | 'landscape'
  includeWatermark: boolean
  includeSignatures: boolean
  copyCount: number
}

interface PDFData {
  npd: any
  organization: any
  templateConfig: any
  options: PDFGenerationOptions
}

export class PDFGenerator {
  private browser: Browser | null = null

  async generateNPDPDF({
    npdId,
    templateOptions = {}
  }: {
    npdId: Id<'npdDocuments'>
    templateOptions?: Partial<PDFGenerationOptions>
  }): Promise<{ url: string; size: number }> {
    try {
      // In production, this would call Convex action
      console.log('Generating PDF for NPD:', npdId)

      // For now, return mock data
      const mockResult = {
        url: `/api/pdf/preview/${npdId}`,
        size: 1024 * 1024, // 1MB
      }

      return mockResult
    } catch (error) {
      console.error('PDF generation error:', error)
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async initializeBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      })
    }
    return this.browser
  }

  async generatePDFWithPlaywright({ npd, organization, templateConfig, options }: PDFData): Promise<Buffer> {
  let browser: Browser | null = null

  try {
    // Launch browser
    browser = await chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    })

    const page = await browser.newPage()

    // Set page size
    const pageSize = {
      format: options.format.toLowerCase(),
      orientation: options.orientation,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      }
    }

    // Generate HTML content
    const htmlContent = generateHTMLContent({
      npd,
      organization,
      options
    })

    // Set content and wait for load
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle'
    })

    // Generate PDF
    const pdfBuffer = await page.pdf({
      ...pageSize,
      printBackground: true,
      preferCSSPageSize: true
    })

    // If copyCount > 1, duplicate the PDF content
    if (options.copyCount > 1) {
      const finalBuffer = Buffer.concat(
        Array(options.copyCount).fill(pdfBuffer)
      )
      return finalBuffer
    }

    return Buffer.from(pdfBuffer)
  } catch (error) {
    console.error('PDF generation error:', error)
    throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

  private generateHTMLContent({ npd, organization, templateConfig, options }: PDFData): string {
  const templateConfig = organization?.pdfTemplateConfig || {}

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nota Pencairan Dana - ${npd.documentNumber}</title>
  <style>
    @page {
      size: ${options.format} ${options.orientation};
      margin: 20px;
    }

    body {
      font-family: ${templateConfig.customStyles?.bodyFont || 'Arial, sans-serif'};
      font-size: 12px;
      line-height: 1.4;
      margin: 0;
      padding: 0;
    }

    .header {
      text-align: center;
      margin-bottom: 30px;
      border-bottom: 2px solid ${templateConfig.customStyles?.headerColor || '#000'};
      padding-bottom: 20px;
    }

    .logo {
      max-width: 80px;
      max-height: 80px;
      margin-bottom: 10px;
    }

    .kop-surat {
      font-family: ${templateConfig.customStyles?.headerFont || 'Arial, sans-serif'};
      font-size: 14px;
      font-weight: bold;
      margin-bottom: 10px;
      white-space: pre-line;
    }

    .document-title {
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      margin: 30px 0;
      text-transform: uppercase;
    }

    .document-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }

    .info-item {
      margin-bottom: 10px;
    }

    .info-label {
      font-weight: bold;
      display: inline-block;
      width: 100px;
    }

    .table-container {
      margin: 20px 0;
    }

    .rka-table {
      width: 100%;
      border-collapse: collapse;
    }

    .rka-table th,
    .rka-table td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
    }

    .rka-table th {
      background-color: #f5f5f5;
      font-weight: bold;
    }

    .total-row {
      font-weight: bold;
      background-color: #f9f9f9;
    }

    .amount {
      text-align: right;
      font-family: 'Courier New', monospace;
    }

    .signatures {
      margin-top: 50px;
      display: flex;
      justify-content: space-between;
      gap: 50px;
    }

    .signature-box {
      text-align: center;
      min-width: 200px;
    }

    .signature-line {
      border-top: 1px solid #000;
      margin-top: 60px;
    }

    .footer {
      position: fixed;
      bottom: 20px;
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
      color: rgba(0, 0, 0, 0.1);
      font-weight: bold;
      z-index: -1;
      user-select: none;
      pointer-events: none;
    }

    @media print {
      .watermark {
        color: rgba(0, 0, 0, 0.05);
      }
    }
  </style>
</head>
<body>
  ${options.includeWatermark && templateConfig.customStyles?.watermark ? `
    <div class="watermark">${templateConfig.customStyles.watermark}</div>
  ` : ''}

  <!-- Header with Logo and Kop Surat -->
  <div class="header">
    ${templateConfig.logoUrl ? `
      <img src="${templateConfig.logoUrl}" alt="Logo" class="logo">
    ` : ''}

    ${templateConfig.kopSurat ? `
      <div class="kop-surat">${templateConfig.kopSurat}</div>
    ` : `
      <div class="kop-surat">${organization.name}</div>
    `}
  </div>

  <!-- Document Title -->
  <div class="document-title">
    Nota Pencairan Dana<br>
    <span style="font-size: 14px;">(${npd.jenis})</span>
  </div>

  <!-- Document Information -->
  <div class="document-info">
    <div>
      <div class="info-item">
        <span class="info-label">Nomor:</span> ${npd.documentNumber}
      </div>
      <div class="info-item">
        <span class="info-label">Tanggal:</span> ${new Date(npd.tanggal).toLocaleDateString('id-ID')}
      </div>
      <div class="info-item">
        <span class="info-label">Sub Kegiatan:</span> ${npd.subkegiatan?.nama}
      </div>
    </div>
    <div>
      <div class="info-item">
        <span class="info-label">Jenis:</span> ${npd.jenis}
      </div>
      <div class="info-item">
        <span class="info-label">Tahun:</span> ${npd.tahun}
      </div>
      <div class="info-item">
        <span class="info-label">Status:</span> ${npd.status}
      </div>
    </div>
  </div>

  <!-- RKA Lines Table -->
  <div class="table-container">
    <table class="rka-table">
      <thead>
        <tr>
          <th>No</th>
          <th>Kode Akun</th>
          <th>Uraian</th>
          <th>Volume</th>
          <th>Harga Satuan</th>
          <th class="amount">Jumlah</th>
        </tr>
      </thead>
      <tbody>
        ${npd.lines?.map((line: any, index: number) => `
          <tr>
            <td>${index + 1}</td>
            <td>${line.account?.kode || ''}</td>
            <td>${line.uraian}</td>
            <td>${line.account?.volume || ''}</td>
            <td class="amount">${formatCurrency(line.account?.hargaSatuan || 0)}</td>
            <td class="amount">${formatCurrency(line.jumlah)}</td>
          </tr>
        `).join('') || ''}
        <tr class="total-row">
          <td colspan="5"><strong>TOTAL</strong></td>
          <td class="amount"><strong>${formatCurrency(npd.lines?.reduce((sum: number, line: any) => sum + line.jumlah, 0) || 0)}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Catatan -->
  ${npd.catatan ? `
    <div style="margin-top: 30px;">
      <strong>Catatan:</strong>
      <p style="margin-top: 10px;">${npd.catatan}</p>
    </div>
  ` : ''}

  <!-- Signatures -->
  ${options.includeSignatures && templateConfig.signatures ? `
    <div class="signatures">
      ${templateConfig.signatures.map((signature: any) => `
        <div class="signature-box">
          <div>${signature.name}</div>
          <div style="font-size: 10px; margin-top: 5px;">${signature.title}</div>
          <div style="font-size: 9px; margin-top: 2px;">${signature.position || ''}</div>
          <div class="signature-line"></div>
        </div>
      `).join('')}
    </div>
  ` : ''}

  <!-- Footer -->
  ${templateConfig.footerText ? `
    <div class="footer">
      ${templateConfig.footerText}
    </div>
  ` : ''}

  <script>
    function formatCurrency(amount) {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
      }).format(amount);
    }
  </script>
</body>
</html>
  `
}

