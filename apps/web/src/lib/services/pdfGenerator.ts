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
    npdData,
    organizationData,
    templateOptions = {}
  }: {
    npdId: Id<'npdDocuments'>
    npdData?: any
    organizationData?: any
    templateOptions?: Partial<PDFGenerationOptions>
  }): Promise<{ url: string; size: number; buffer: Buffer }> {
    let browser: Browser | null = null
    
    try {
      console.log('Generating PDF for NPD:', npdId)

      // Set default options
      const options: PDFGenerationOptions = {
        format: templateOptions.format || 'A4',
        orientation: templateOptions.orientation || 'portrait',
        includeWatermark: templateOptions.includeWatermark ?? true,
        includeSignatures: templateOptions.includeSignatures ?? true,
        copyCount: templateOptions.copyCount || 1,
      }

      // Validate NPD data
      if (!npdData) {
        throw new Error('NPD data is required for PDF generation')
      }

      if (!organizationData) {
        throw new Error('Organization data is required for PDF generation')
      }

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

      // Generate HTML content
      const htmlContent = this.generateNPDHTMLContent({
        npd: npdData,
        organization: organizationData,
        options
      })

      // Set content and wait for load
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle'
      })

      // Configure PDF options
      const pdfOptions: any = {
        format: options.format,
        landscape: options.orientation === 'landscape',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      }

      // Generate PDF
      const pdfBuffer = await page.pdf(pdfOptions)

      await browser.close()
      browser = null

      // Handle multiple copies
      const finalBuffer = options.copyCount > 1
        ? Buffer.concat(Array(options.copyCount).fill(pdfBuffer))
        : Buffer.from(pdfBuffer)

      // Generate filename
      const filename = `NPD-${npdData.documentNumber || npdId}.pdf`
      
      return {
        url: filename,
        size: finalBuffer.length,
        buffer: finalBuffer
      }
    } catch (error) {
      console.error('PDF generation error:', error)
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      if (browser) {
        await browser.close()
      }
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

  async generateSP2DPDF({
    sp2dId,
    sp2dData,
    npdData,
    organizationData,
    distributionData,
    templateOptions = {}
  }: {
    sp2dId: string
    sp2dData: any
    npdData: any
    organizationData: any
    distributionData?: any[]
    templateOptions?: Partial<PDFGenerationOptions>
  }): Promise<{ url: string; size: number; buffer: Buffer }> {
    let browser: Browser | null = null
    
    try {
      console.log('Generating PDF for SP2D:', sp2dId)

      // Set default options
      const options: PDFGenerationOptions = {
        format: templateOptions.format || 'A4',
        orientation: templateOptions.orientation || 'portrait',
        includeWatermark: templateOptions.includeWatermark ?? false,
        includeSignatures: templateOptions.includeSignatures ?? true,
        copyCount: templateOptions.copyCount || 1,
      }

      // Validate data
      if (!sp2dData) {
        throw new Error('SP2D data is required for PDF generation')
      }

      if (!npdData) {
        throw new Error('NPD data is required for PDF generation')
      }

      if (!organizationData) {
        throw new Error('Organization data is required for PDF generation')
      }

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

      // Generate HTML content
      const htmlContent = this.generateSP2DHTMLContent({
        sp2d: sp2dData,
        npd: npdData,
        organization: organizationData,
        distribution: distributionData || [],
        options
      })

      // Set content and wait for load
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle'
      })

      // Configure PDF options
      const pdfOptions: any = {
        format: options.format,
        landscape: options.orientation === 'landscape',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      }

      // Generate PDF
      const pdfBuffer = await page.pdf(pdfOptions)

      await browser.close()
      browser = null

      // Handle multiple copies
      const finalBuffer = options.copyCount > 1
        ? Buffer.concat(Array(options.copyCount).fill(pdfBuffer))
        : Buffer.from(pdfBuffer)

      // Generate filename
      const filename = `SP2D-${sp2dData.noSP2D || sp2dId}.pdf`
      
      return {
        url: filename,
        size: finalBuffer.length,
        buffer: finalBuffer
      }
    } catch (error) {
      console.error('SP2D PDF generation error:', error)
      throw new Error(`Failed to generate SP2D PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }

  private generateSP2DHTMLContent({ sp2d, npd, organization, distribution, options }: { 
    sp2d: any; 
    npd: any;
    organization: any; 
    distribution: any[];
    options: PDFGenerationOptions 
  }): string {
    const templateConfig = organization?.pdfTemplateConfig || {}
    const totalDistributed = distribution.reduce((sum, item) => sum + (item.amount || 0), 0)

    // Format currency helper
    const formatCurrencyValue = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount)
    }

    // Format date helper
    const formatDate = (timestamp: number) => {
      const date = new Date(timestamp)
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    }

    // Generate signatures section
    const signaturesHTML = options.includeSignatures ? `
      <div class="signatures">
        ${(templateConfig.signatures || [
          { name: 'Bendahara Pengeluaran', title: 'Bendahara', position: 'left' },
          { name: 'Kepala SKPD', title: 'Pengguna Anggaran', position: 'right' }
        ]).map((sig: any) => `
          <div class="signature-box">
            <div class="signature-role">${sig.title}</div>
            <div class="signature-space"></div>
            <div class="signature-name">${sig.name}</div>
            ${sig.nip ? `<div class="signature-nip">NIP. ${sig.nip}</div>` : ''}
          </div>
        `).join('')}
      </div>
    ` : ''

    return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SP2D - ${sp2d.noSP2D}</title>
  <style>
    @page {
      size: ${options.format} ${options.orientation};
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: ${templateConfig.customStyles?.bodyFont || 'Arial, sans-serif'};
      font-size: 11pt;
      line-height: 1.6;
      padding: 20mm 15mm;
      position: relative;
    }

    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 3px solid ${templateConfig.customStyles?.headerColor || '#000'};
      padding-bottom: 15px;
    }

    .logo {
      max-width: 70px;
      max-height: 70px;
      margin-bottom: 10px;
    }

    .kop-surat {
      font-family: ${templateConfig.customStyles?.headerFont || 'Times New Roman, serif'};
      font-size: 16pt;
      font-weight: bold;
      line-height: 1.4;
      margin-bottom: 5px;
    }

    .kop-address {
      font-size: 10pt;
      color: #333;
    }

    .document-title {
      font-size: 14pt;
      font-weight: bold;
      text-align: center;
      margin: 25px 0 20px;
      text-transform: uppercase;
      text-decoration: underline;
    }

    .document-info {
      margin-bottom: 20px;
      font-size: 10pt;
    }

    .info-row {
      display: flex;
      margin-bottom: 8px;
    }

    .info-label {
      width: 180px;
      font-weight: 600;
    }

    .info-separator {
      width: 20px;
    }

    .info-value {
      flex: 1;
    }

    .section-title {
      font-size: 12pt;
      font-weight: bold;
      margin: 25px 0 15px;
      padding-bottom: 5px;
      border-bottom: 2px solid #333;
    }

    .table-container {
      margin: 20px 0;
    }

    .distribution-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
    }

    .distribution-table th,
    .distribution-table td {
      border: 1px solid #000;
      padding: 8px 6px;
      vertical-align: top;
    }

    .distribution-table th {
      background-color: #f0f0f0;
      font-weight: bold;
      text-align: center;
    }

    .distribution-table td.no {
      text-align: center;
      width: 40px;
    }

    .distribution-table td.code {
      width: 120px;
      font-family: 'Courier New', monospace;
      font-size: 9pt;
    }

    .distribution-table td.amount {
      text-align: right;
      font-family: 'Courier New', monospace;
      width: 130px;
    }

    .distribution-table td.percentage {
      text-align: center;
      width: 80px;
    }

    .total-row {
      font-weight: bold;
      background-color: #f9f9f9;
    }

    .summary-box {
      margin: 20px 0;
      padding: 15px;
      background-color: #f5f5f5;
      border-left: 4px solid #333;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 11pt;
    }

    .summary-label {
      font-weight: 600;
    }

    .summary-value {
      font-family: 'Courier New', monospace;
    }

    .signatures {
      margin-top: 40px;
      display: flex;
      justify-content: space-around;
      page-break-inside: avoid;
    }

    .signature-box {
      text-align: center;
      min-width: 200px;
    }

    .signature-role {
      font-weight: bold;
      margin-bottom: 5px;
      font-size: 10pt;
    }

    .signature-space {
      height: 60px;
      margin: 10px 0;
    }

    .signature-name {
      font-weight: bold;
      text-decoration: underline;
      margin-bottom: 2px;
    }

    .signature-nip {
      font-size: 9pt;
      color: #666;
    }

    .footer {
      position: fixed;
      bottom: 15mm;
      left: 15mm;
      right: 15mm;
      font-size: 8pt;
      color: #666;
      text-align: center;
      border-top: 1px solid #ccc;
      padding-top: 5px;
    }

    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    ${templateConfig.logoUrl ? `<img src="${templateConfig.logoUrl}" alt="Logo" class="logo">` : ''}
    <div class="kop-surat">${templateConfig.kopSurat || organization.name || 'PEMERINTAH DAERAH'}</div>
    ${templateConfig.kopAddress ? `<div class="kop-address">${templateConfig.kopAddress}</div>` : ''}
  </div>

  <!-- Document Title -->
  <div class="document-title">
    SURAT PERINTAH PENCAIRAN DANA (SP2D)
    <br />
    DAN RINCIAN DISTRIBUSI
  </div>

  <!-- SP2D Info -->
  <div class="document-info">
    <div class="info-row">
      <div class="info-label">Nomor SP2D</div>
      <div class="info-separator">:</div>
      <div class="info-value"><strong>${sp2d.noSP2D || '-'}</strong></div>
    </div>
    <div class="info-row">
      <div class="info-label">Nomor SPM</div>
      <div class="info-separator">:</div>
      <div class="info-value">${sp2d.noSPM || '-'}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Tanggal SP2D</div>
      <div class="info-separator">:</div>
      <div class="info-value">${sp2d.tglSP2D ? formatDate(sp2d.tglSP2D) : '-'}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Referensi NPD</div>
      <div class="info-separator">:</div>
      <div class="info-value">${npd.documentNumber || '-'}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Program/Kegiatan</div>
      <div class="info-separator">:</div>
      <div class="info-value">${npd.programName || '-'}</div>
    </div>
  </div>

  <!-- Summary Box -->
  <div class="summary-box">
    <div class="summary-row">
      <div class="summary-label">Total Nilai SP2D:</div>
      <div class="summary-value"><strong>${formatCurrencyValue(sp2d.nilaiCair || 0)}</strong></div>
    </div>
    <div class="summary-row">
      <div class="summary-label">Total Terdistribusi:</div>
      <div class="summary-value">${formatCurrencyValue(totalDistributed)}</div>
    </div>
  </div>

  <!-- Distribution Section -->
  <div class="section-title">RINCIAN DISTRIBUSI PER REKENING</div>
  
  <div class="table-container">
    <table class="distribution-table">
      <thead>
        <tr>
          <th>No</th>
          <th>Kode Rekening</th>
          <th>Uraian</th>
          <th>Jumlah NPD (Rp)</th>
          <th>% Dist</th>
          <th>Nilai Cair (Rp)</th>
        </tr>
      </thead>
      <tbody>
        ${distribution.map((item: any, index: number) => {
          const percentage = item.npdAmount > 0 ? ((item.amount / item.npdAmount) * 100).toFixed(2) : '0.00'
          return `
          <tr>
            <td class="no">${index + 1}</td>
            <td class="code">${item.accountCode || '-'}</td>
            <td>${item.accountName || item.description || '-'}</td>
            <td class="amount">${formatCurrencyValue(item.npdAmount || 0)}</td>
            <td class="percentage">${percentage}%</td>
            <td class="amount">${formatCurrencyValue(item.amount || 0)}</td>
          </tr>
        `}).join('')}
        <tr class="total-row">
          <td colspan="3" style="text-align: right; padding-right: 10px;"><strong>TOTAL</strong></td>
          <td class="amount"><strong>${formatCurrencyValue(distribution.reduce((sum, item) => sum + (item.npdAmount || 0), 0))}</strong></td>
          <td class="percentage"><strong>100%</strong></td>
          <td class="amount"><strong>${formatCurrencyValue(totalDistributed)}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  ${sp2d.catatan ? `
  <div style="margin: 20px 0;">
    <strong>Catatan:</strong><br />
    ${sp2d.catatan}
  </div>
  ` : ''}

  <div style="margin-top: 15px; font-size: 10pt; font-style: italic; color: #666;">
    <strong>Keterangan:</strong> Distribusi dihitung secara proporsional berdasarkan nilai masing-masing rekening pada NPD.
  </div>

  <!-- Signatures -->
  ${signaturesHTML}

  <!-- Footer -->
  <div class="footer">
    ${templateConfig.footerText || `Dokumen ini dibuat secara elektronik dan sah tanpa tanda tangan basah`}
    <br />
    Dicetak pada: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
  </div>
</body>
</html>
    `.trim()
  }

  async generateQuarterlyReportPDF({
    organizationData,
    reportData,
    quarter,
    tahun,
    templateOptions = {}
  }: {
    organizationData: any
    reportData: any
    quarter: string
    tahun: number
    templateOptions?: Partial<PDFGenerationOptions>
  }): Promise<{ url: string; size: number; buffer: Buffer }> {
    let browser: Browser | null = null
    
    try {
      console.log('Generating Quarterly Report PDF:', quarter, tahun)

      // Set default options
      const options: PDFGenerationOptions = {
        format: templateOptions.format || 'A4',
        orientation: templateOptions.orientation || 'landscape',
        includeWatermark: templateOptions.includeWatermark ?? false,
        includeSignatures: templateOptions.includeSignatures ?? true,
        copyCount: templateOptions.copyCount || 1,
      }

      // Validate data
      if (!organizationData) {
        throw new Error('Organization data is required for PDF generation')
      }

      if (!reportData) {
        throw new Error('Report data is required for PDF generation')
      }

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

      // Generate HTML content
      const htmlContent = this.generateQuarterlyReportHTMLContent({
        organization: organizationData,
        data: reportData,
        quarter,
        tahun,
        options
      })

      // Set content and wait for load
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle'
      })

      // Configure PDF options
      const pdfOptions: any = {
        format: options.format,
        landscape: options.orientation === 'landscape',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      }

      // Generate PDF
      const pdfBuffer = await page.pdf(pdfOptions)

      await browser.close()
      browser = null

      // Handle multiple copies
      const finalBuffer = options.copyCount > 1
        ? Buffer.concat(Array(options.copyCount).fill(pdfBuffer))
        : Buffer.from(pdfBuffer)

      // Generate filename
      const filename = `Laporan-Triwulanan-${quarter}-${tahun}.pdf`
      
      return {
        url: filename,
        size: finalBuffer.length,
        buffer: finalBuffer
      }
    } catch (error) {
      console.error('Quarterly Report PDF generation error:', error)
      throw new Error(`Failed to generate quarterly report PDF: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      if (browser) {
        await browser.close()
      }
    }
  }

  private generateQuarterlyReportHTMLContent({ organization, data, quarter, tahun, options }: { 
    organization: any; 
    data: any;
    quarter: string;
    tahun: number;
    options: PDFGenerationOptions 
  }): string {
    const templateConfig = organization?.pdfTemplateConfig || {}

    // Format currency helper
    const formatCurrencyValue = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount)
    }

    // Format quarter date range
    const quarterMonths = {
      'Q1': { start: 'Januari', end: 'Maret', months: [1, 2, 3] },
      'Q2': { start: 'April', end: 'Juni', months: [4, 5, 6] },
      'Q3': { start: 'Juli', end: 'September', months: [7, 8, 9] },
      'Q4': { start: 'Oktober', end: 'Desember', months: [10, 11, 12] }
    }
    
    const quarterInfo = quarterMonths[quarter as keyof typeof quarterMonths] || quarterMonths['Q1']
    const quarterLabel = `Triwulan ${quarter.charAt(1)} (${quarterInfo.start} - ${quarterInfo.end})`

    // Generate signatures section
    const signaturesHTML = options.includeSignatures ? `
      <div class="signatures">
        ${(templateConfig.signatures || [
          { name: 'Kepala Bagian Keuangan', title: 'Pembuat Laporan', position: 'left' },
          { name: 'Kepala SKPD', title: 'Mengetahui', position: 'right' }
        ]).map((sig: any) => `
          <div class="signature-box">
            <div class="signature-role">${sig.title}</div>
            <div class="signature-space"></div>
            <div class="signature-name">${sig.name}</div>
            ${sig.nip ? `<div class="signature-nip">NIP. ${sig.nip}</div>` : ''}
          </div>
        `).join('')}
      </div>
    ` : ''

    return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laporan Triwulanan ${quarter} ${tahun}</title>
  <style>
    @page {
      size: ${options.format} ${options.orientation};
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: ${templateConfig.customStyles?.bodyFont || 'Arial, sans-serif'};
      font-size: 10pt;
      line-height: 1.5;
      padding: 20mm 15mm;
      position: relative;
    }

    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 3px solid ${templateConfig.customStyles?.headerColor || '#000'};
      padding-bottom: 15px;
    }

    .logo {
      max-width: 70px;
      max-height: 70px;
      margin-bottom: 10px;
    }

    .kop-surat {
      font-family: ${templateConfig.customStyles?.headerFont || 'Times New Roman, serif'};
      font-size: 16pt;
      font-weight: bold;
      line-height: 1.4;
      margin-bottom: 5px;
    }

    .kop-address {
      font-size: 10pt;
      color: #333;
    }

    .report-title {
      font-size: 16pt;
      font-weight: bold;
      text-align: center;
      margin: 25px 0 20px;
      text-transform: uppercase;
    }

    .report-subtitle {
      font-size: 12pt;
      text-align: center;
      margin-bottom: 30px;
      color: #555;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }

    .summary-card {
      border: 2px solid #ddd;
      padding: 15px;
      text-align: center;
      background-color: #f9f9f9;
    }

    .summary-title {
      font-weight: bold;
      margin-bottom: 10px;
      font-size: 11pt;
      color: #333;
    }

    .summary-value {
      font-size: 18pt;
      font-weight: 700;
      color: #1976d2;
      font-family: 'Courier New', monospace;
    }

    .section-title {
      font-size: 13pt;
      font-weight: bold;
      margin: 30px 0 15px;
      padding-bottom: 8px;
      border-bottom: 2px solid #333;
      text-transform: uppercase;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9pt;
      margin-bottom: 25px;
    }

    .data-table th,
    .data-table td {
      border: 1px solid #000;
      padding: 8px 6px;
      vertical-align: middle;
    }

    .data-table th {
      background-color: #e0e0e0;
      font-weight: bold;
      text-align: center;
    }

    .data-table td.no {
      text-align: center;
      width: 35px;
    }

    .data-table td.code {
      font-family: 'Courier New', monospace;
      font-size: 8pt;
    }

    .data-table td.amount {
      text-align: right;
      font-family: 'Courier New', monospace;
      white-space: nowrap;
    }

    .data-table td.percentage {
      text-align: center;
      font-weight: 600;
    }

    .highlight-row {
      background-color: #fffacd;
    }

    .signatures {
      margin-top: 50px;
      display: flex;
      justify-content: space-around;
      page-break-inside: avoid;
    }

    .signature-box {
      text-align: center;
      min-width: 200px;
    }

    .signature-role {
      font-weight: bold;
      margin-bottom: 5px;
      font-size: 10pt;
    }

    .signature-space {
      height: 70px;
      margin: 15px 0;
    }

    .signature-name {
      font-weight: bold;
      text-decoration: underline;
      margin-bottom: 3px;
    }

    .signature-nip {
      font-size: 9pt;
      color: #666;
    }

    .footer {
      position: fixed;
      bottom: 15mm;
      left: 15mm;
      right: 15mm;
      font-size: 8pt;
      color: #666;
      text-align: center;
      border-top: 1px solid #ccc;
      padding-top: 5px;
    }

    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
      
      .section-title {
        page-break-after: avoid;
      }
      
      .data-table {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    ${templateConfig.logoUrl ? `<img src="${templateConfig.logoUrl}" alt="Logo" class="logo">` : ''}
    <div class="kop-surat">${templateConfig.kopSurat || organization.name || 'PEMERINTAH DAERAH'}</div>
    ${templateConfig.kopAddress ? `<div class="kop-address">${templateConfig.kopAddress}</div>` : ''}
  </div>

  <!-- Report Title -->
  <div class="report-title">
    LAPORAN KINERJA TRIWULANAN
  </div>
  <div class="report-subtitle">
    ${quarterLabel} Tahun Anggaran ${tahun}
  </div>

  <!-- Executive Summary -->
  <div class="summary-grid">
    <div class="summary-card">
      <div class="summary-title">Total NPD</div>
      <div class="summary-value">${data.totalNPDs || 0}</div>
    </div>
    <div class="summary-card">
      <div class="summary-title">NPD Selesai</div>
      <div class="summary-value">${data.finalizedNPDs || 0}</div>
    </div>
    <div class="summary-card">
      <div class="summary-title">NPD Dalam Proses</div>
      <div class="summary-value">${(data.totalNPDs || 0) - (data.finalizedNPDs || 0)}</div>
    </div>
    <div class="summary-card">
      <div class="summary-title">Total SP2D</div>
      <div class="summary-value">${data.totalSP2D || 0}</div>
    </div>
    <div class="summary-card">
      <div class="summary-title">Nilai SP2D</div>
      <div class="summary-value">${formatCurrencyValue(data.totalNilai || 0)}</div>
    </div>
    <div class="summary-card">
      <div class="summary-title">Kinerja Rata-rata</div>
      <div class="summary-value">${((data.avgPerformanceRate || 0) * 100).toFixed(1)}%</div>
    </div>
  </div>

  <!-- Top Programs -->
  <div class="section-title">Program Teratas (Top 10 berdasarkan Pagu)</div>
  <table class="data-table">
    <thead>
      <tr>
        <th>No</th>
        <th>Kode Program</th>
        <th>Nama Program</th>
        <th>Total Pagu (Rp)</th>
        <th>Realisasi (Rp)</th>
        <th>Sisa Pagu (Rp)</th>
        <th>%</th>
      </tr>
    </thead>
    <tbody>
      ${(data.topPrograms || []).map((program: any, index: number) => {
        const persentase = program.pagu > 0 ? (program.realisasi / program.pagu) * 100 : 0
        const isHighlight = persentase > 80
        return `
        <tr${isHighlight ? ' class="highlight-row"' : ''}>
          <td class="no">${index + 1}</td>
          <td class="code">${program.kode || '-'}</td>
          <td>${program.nama || '-'}</td>
          <td class="amount">${formatCurrencyValue(program.pagu || 0)}</td>
          <td class="amount">${formatCurrencyValue(program.realisasi || 0)}</td>
          <td class="amount">${formatCurrencyValue((program.pagu || 0) - (program.realisasi || 0))}</td>
          <td class="percentage">${persentase.toFixed(1)}%</td>
        </tr>
      `}).join('')}
    </tbody>
  </table>

  <!-- Top Accounts -->
  <div class="section-title">Akun Belanja Teratas (Top 10 berdasarkan Realisasi)</div>
  <table class="data-table">
    <thead>
      <tr>
        <th>No</th>
        <th>Kode Rekening</th>
        <th>Uraian</th>
        <th>Total Pagu (Rp)</th>
        <th>Realisasi (Rp)</th>
        <th>Sisa Pagu (Rp)</th>
        <th>%</th>
      </tr>
    </thead>
    <tbody>
      ${(data.topAccounts || []).map((account: any, index: number) => {
        const persentase = account.persentase || 0
        const isHighlight = persentase > 80
        return `
        <tr${isHighlight ? ' class="highlight-row"' : ''}>
          <td class="no">${index + 1}</td>
          <td class="code">${account.kode || '-'}</td>
          <td>${account.uraian || '-'}</td>
          <td class="amount">${formatCurrencyValue(account.pagu || 0)}</td>
          <td class="amount">${formatCurrencyValue(account.realisasi || 0)}</td>
          <td class="amount">${formatCurrencyValue((account.pagu || 0) - (account.realisasi || 0))}</td>
          <td class="percentage">${persentase.toFixed(1)}%</td>
        </tr>
      `}).join('')}
    </tbody>
  </table>

  <div style="margin-top: 25px; padding: 15px; background-color: #f5f5f5; border-left: 4px solid #1976d2;">
    <strong>Catatan:</strong> Laporan ini mencakup data NPD, SP2D, dan realisasi anggaran untuk periode ${quarterLabel} ${tahun}. 
    Baris dengan highlight (kuning) menunjukkan program/akun dengan realisasi di atas 80% dari pagu.
  </div>

  <!-- Signatures -->
  ${signaturesHTML}

  <!-- Footer -->
  <div class="footer">
    ${templateConfig.footerText || `Dokumen ini dibuat secara elektronik dan sah tanpa tanda tangan basah`}
    <br />
    Dicetak pada: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
  </div>
</body>
</html>
    `.trim()
  }

  private generateNPDHTMLContent({ npd, organization, options }: { npd: any; organization: any; options: PDFGenerationOptions }): string {
    const templateConfig = organization?.pdfTemplateConfig || {}
    const npdLines = npd.lines || []
    const totalJumlah = npdLines.reduce((sum: number, line: any) => sum + (line.jumlah || 0), 0)

    // Format date helper
    const formatDate = (timestamp: number) => {
      const date = new Date(timestamp)
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
    }

    // Generate watermark if status is not final
    const watermarkHTML = options.includeWatermark && npd.status !== 'final' ? `
      <div class="watermark">${npd.status.toUpperCase()}</div>
    ` : ''

    // Generate signatures section
    const signaturesHTML = options.includeSignatures ? `
      <div class="signatures">
        ${(templateConfig.signatures || [
          { name: 'PPTK', title: 'Pejabat Pelaksana Teknis Kegiatan', position: 'left' },
          { name: 'Bendahara', title: 'Bendahara Pengeluaran', position: 'right' }
        ]).map((sig: any) => `
          <div class="signature-box">
            <div class="signature-role">${sig.title}</div>
            <div class="signature-space"></div>
            <div class="signature-name">${sig.name}</div>
            ${sig.nip ? `<div class="signature-nip">NIP. ${sig.nip}</div>` : ''}
          </div>
        `).join('')}
      </div>
    ` : ''

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
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: ${templateConfig.customStyles?.bodyFont || 'Arial, sans-serif'};
      font-size: 11pt;
      line-height: 1.6;
      padding: 20mm 15mm;
      position: relative;
    }

    .header {
      text-align: center;
      margin-bottom: 20px;
      border-bottom: 3px solid ${templateConfig.customStyles?.headerColor || '#000'};
      padding-bottom: 15px;
    }

    .logo {
      max-width: 70px;
      max-height: 70px;
      margin-bottom: 10px;
    }

    .kop-surat {
      font-family: ${templateConfig.customStyles?.headerFont || 'Times New Roman, serif'};
      font-size: 16pt;
      font-weight: bold;
      line-height: 1.4;
      margin-bottom: 5px;
    }

    .kop-address {
      font-size: 10pt;
      color: #333;
    }

    .document-title {
      font-size: 14pt;
      font-weight: bold;
      text-align: center;
      margin: 25px 0 20px;
      text-transform: uppercase;
      text-decoration: underline;
    }

    .document-info {
      margin-bottom: 20px;
      font-size: 10pt;
    }

    .info-row {
      display: flex;
      margin-bottom: 8px;
    }

    .info-label {
      width: 180px;
      font-weight: 600;
    }

    .info-separator {
      width: 20px;
    }

    .info-value {
      flex: 1;
    }

    .table-container {
      margin: 20px 0;
    }

    .rka-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
    }

    .rka-table th,
    .rka-table td {
      border: 1px solid #000;
      padding: 8px 6px;
      vertical-align: top;
    }

    .rka-table th {
      background-color: #f0f0f0;
      font-weight: bold;
      text-align: center;
    }

    .rka-table td.no {
      text-align: center;
      width: 40px;
    }

    .rka-table td.code {
      width: 120px;
      font-family: 'Courier New', monospace;
      font-size: 9pt;
    }

    .rka-table td.amount {
      text-align: right;
      font-family: 'Courier New', monospace;
      width: 150px;
    }

    .total-row {
      font-weight: bold;
      background-color: #f9f9f9;
    }

    .amount-words {
      margin: 15px 0;
      padding: 10px;
      background-color: #f5f5f5;
      border-left: 4px solid #333;
      font-style: italic;
    }

    .signatures {
      margin-top: 40px;
      display: flex;
      justify-content: space-around;
      page-break-inside: avoid;
    }

    .signature-box {
      text-align: center;
      min-width: 200px;
    }

    .signature-role {
      font-weight: bold;
      margin-bottom: 5px;
      font-size: 10pt;
    }

    .signature-space {
      height: 60px;
      margin: 10px 0;
    }

    .signature-name {
      font-weight: bold;
      text-decoration: underline;
      margin-bottom: 2px;
    }

    .signature-nip {
      font-size: 9pt;
      color: #666;
    }

    .footer {
      position: fixed;
      bottom: 15mm;
      left: 15mm;
      right: 15mm;
      font-size: 8pt;
      color: #666;
      text-align: center;
      border-top: 1px solid #ccc;
      padding-top: 5px;
    }

    .watermark {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) rotate(-45deg);
      font-size: 120pt;
      font-weight: bold;
      color: rgba(200, 200, 200, 0.3);
      z-index: -1;
      pointer-events: none;
    }

    .page-number:after {
      content: counter(page);
    }

    @media print {
      body {
        print-color-adjust: exact;
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  ${watermarkHTML}

  <!-- Header -->
  <div class="header">
    ${templateConfig.logoUrl ? `<img src="${templateConfig.logoUrl}" alt="Logo" class="logo">` : ''}
    <div class="kop-surat">${templateConfig.kopSurat || organization.name || 'PEMERINTAH DAERAH'}</div>
    ${templateConfig.kopAddress ? `<div class="kop-address">${templateConfig.kopAddress}</div>` : ''}
  </div>

  <!-- Document Title -->
  <div class="document-title">
    NOTA PENCAIRAN DANA (NPD)
    <br />
    ${npd.jenis ? `Jenis: ${npd.jenis}` : ''}
  </div>

  <!-- Document Info -->
  <div class="document-info">
    <div class="info-row">
      <div class="info-label">Nomor NPD</div>
      <div class="info-separator">:</div>
      <div class="info-value">${npd.documentNumber || '-'}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Tanggal</div>
      <div class="info-separator">:</div>
      <div class="info-value">${npd.createdAt ? formatDate(npd.createdAt) : '-'}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Program/Kegiatan</div>
      <div class="info-separator">:</div>
      <div class="info-value">${npd.programName || '-'}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Sub Kegiatan</div>
      <div class="info-separator">:</div>
      <div class="info-value">${npd.subKegiatanName || '-'}</div>
    </div>
    <div class="info-row">
      <div class="info-label">Status</div>
      <div class="info-separator">:</div>
      <div class="info-value"><strong>${npd.status ? npd.status.toUpperCase() : 'DRAFT'}</strong></div>
    </div>
  </div>

  <!-- Rincian Table -->
  <div class="table-container">
    <table class="rka-table">
      <thead>
        <tr>
          <th>No</th>
          <th>Kode Rekening</th>
          <th>Uraian</th>
          <th>Jumlah (Rp)</th>
        </tr>
      </thead>
      <tbody>
        ${npdLines.map((line: any, index: number) => `
          <tr>
            <td class="no">${index + 1}</td>
            <td class="code">${line.kodeRekening || line.accountCode || '-'}</td>
            <td>${line.uraian || line.description || '-'}</td>
            <td class="amount">${formatCurrency(line.jumlah || 0)}</td>
          </tr>
        `).join('')}
        <tr class="total-row">
          <td colspan="3" style="text-align: right; padding-right: 10px;"><strong>TOTAL</strong></td>
          <td class="amount"><strong>${formatCurrency(totalJumlah)}</strong></td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- Amount in Words -->
  <div class="amount-words">
    <strong>Terbilang:</strong> ${npd.terbilang || '...'} Rupiah
  </div>

  ${npd.catatan ? `
  <div style="margin: 15px 0;">
    <strong>Catatan:</strong><br />
    ${npd.catatan}
  </div>
  ` : ''}

  <!-- Signatures -->
  ${signaturesHTML}

  <!-- Footer -->
  <div class="footer">
    ${templateConfig.footerText || `Dokumen ini dibuat secara elektronik dan sah tanpa tanda tangan basah`}
    <br />
    Dicetak pada: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
  </div>
</body>
</html>
    `.trim()
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

