import { chromium, Browser, Page } from 'playwright'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import { api } from '@/convex/_generated/api'
import type { Id } from 'convex/values'

interface QuarterlyReportData {
  periode: string
  tahun: number
  organization: any
  data: {
    totalNPD: number
    finalizedNPD: number
    totalSP2D: number
    totalNilai: number
    avgPerformanceRate: number
    topPrograms: Array<{
      kode: string
      nama: string
      pagu: number
      realisasi: number
      persentase: number
    }>
    topAccounts: Array<{
      kode: string
      uraian: string
      pagu: number
      realisasi: number
      persentase: number
    }>
  }
}

interface EnhancedPDFOptions {
  format: 'A4' | 'Legal'
  orientation: 'portrait' | 'landscape'
  includeWatermark?: boolean
  includeSignatures?: boolean
  copyCount?: number
  quarterlyPeriod?: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  tahun?: number
}

export class EnhancedPDFGenerator {
  private browser: Browser | null = null

  async initializeBrowser(): Promise<void> {
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
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }

  private formatQuarterlyDate(tahun: number, periode: string): string {
    const months = {
      'Q1': [1, 2, 3],
      'Q2': [4, 5, 6],
      'Q3': [7, 8, 9],
      'Q4': [10, 11, 12]
    }

    const endMonth = months[periode][1]
    return \`Triwulan \${periode} (\${months[periode][0]} - \${endMonth}) \${tahun}\`
  }

  private async generateQuarterlyReportHTML(data: QuarterlyReportData, options: EnhancedPDFOptions): Promise<string> {
    return \`
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Laporan Triwulanan - \${this.formatQuarterlyDate(options.tahun || data.tahun, options.quarterlyPeriod || 'Q1')}</title>
  <style>
    @page {
      size: \${options.format};
      orientation: \${options.orientation};
      margin: 20px;
    }
    body {
      font-family: 'Arial', sans-serif;
      font-size: 12px;
      line-height: 1.6;
      margin: 0;
      padding: 0;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #000;
    }
    .logo {
      max-width: 80px;
      max-height: 80px;
      margin-bottom: 10px;
    }
    .kop-surat {
      font-family: 'Times New Roman', serif;
      font-size: 14px;
      font-weight: bold;
      white-space: pre-line;
      margin-bottom: 10px;
    }
    .report-title {
      font-size: 18px;
      font-weight: bold;
      text-align: center;
      margin: 30px 0;
      text-transform: uppercase;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    .summary-card {
      border: 1px solid #ddd;
      padding: 15px;
      text-align: center;
    }
    .summary-title {
      font-weight: bold;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .summary-value {
      font-size: 16px;
      font-weight: 600;
      color: #1976d2;
    }
    .section-title {
      font-size: 16px;
      font-weight: bold;
      margin: 30px 0 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #ddd;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .data-table th,
    .data-table td {
      border: 1px solid #000;
      padding: 8px;
      text-align: left;
    }
    .data-table th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
    .highlight {
      background-color: #fff3cd;
    }
    .amount {
      text-align: right;
      font-family: 'Courier New', monospace;
    }
    .footer {
      position: fixed;
      bottom: 20px;
      text-align: center;
      font-size: 10px;
      color: #666;
    }
    \${options.includeWatermark ? \`
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
    \` : ''}
  </style>
</head>
<body>
  <!-- Header -->
  <div class="header">
    \${data.organization?.pdfTemplateConfig?.logoUrl ? \`
      <img src="\${data.organization.pdfTemplateConfig.logoUrl}" alt="Logo" class="logo">
    \` : ''}
    \${data.organization?.pdfTemplateConfig?.kopSurat ? \`
      <div class="kop-surat">\${data.organization.pdfTemplateConfig.kopSurat}</div>
    \` : ''}
    <div class="kop-surat">\${data.organization?.name || 'ORGANISASI'}</div>
  </div>

  <!-- Report Title -->
  <div class="report-title">
    LAPORAN KINERJA TRIWULANAN<br>
    \${this.formatQuarterlyDate(options.tahun || data.tahun, options.quarterlyPeriod || 'Q1')}
  </div>

  <!-- Executive Summary -->
  <div class="section-title">RINGKASAN EKSEKUTIF</div>
  <div class="summary-grid">
    <div class="summary-card">
      <div class="summary-title">Total NPD</div>
      <div class="summary-value">\${data.data.totalNPD}</div>
    </div>
    <div class="summary-card">
      <div class="summary-title">NPD Selesai</div>
      <div class="summary-value">\${data.data.finalizedNPD}</div>
    </div>
    <div class="summary-card">
      <div class="summary-title">NPD Proses</div>
      <div class="summary-value">\${data.data.totalNPD - data.data.finalizedNPD}</div>
    </div>
    <div class="summary-card">
      <div class="summary-title">Total SP2D</div>
      <div class="summary-value">\${data.data.totalSP2D}</div>
    </div>
    <div class="summary-card">
      <div class="summary-title">Nilai SP2D</div>
      <div class="summary-value">\${formatCurrency(data.data.totalNilai)}</div>
    </div>
    <div class="summary-card">
      <div class="summary-title">Kinerja Rata-rata</div>
      <div class="summary-value">\${(data.data.avgPerformanceRate * 100).toFixed(1)}%</div>
    </div>
  </div>

  <!-- Top Programs -->
  <div class="section-title">PROGRAM TERATAS (TOP 10 BY PAGU)</div>
  <table class="data-table">
    <thead>
      <tr>
        <th>No</th>
        <th>Kode Program</th>
        <th>Nama Program</th>
        <th>Total Pagu</th>
        <th>Realisasi</th>
        <th>%</th>
      </tr>
    </thead>
    <tbody>
      \${data.data.topPrograms.slice(0, 10).map((program, index) => \`
        <tr>
          <td>\${index + 1}</td>
          <td>\${program.kode}</td>
          <td>\${program.nama}</td>
          <td class="amount">\${formatCurrency(program.pagu)}</td>
          <td class="amount">\${formatCurrency(program.realisasi)}</td>
          <td>\${(program.persentase * 100).toFixed(2)}%</td>
        </tr>
      \`).join('')}
    </tbody>
  </table>

  <!-- Top Accounts -->
  <div class="section-title">AKUN BELANJA TERATAS (TOP 10 BY REALISASI)</div>
  <table class="data-table">
    <thead>
      <tr>
        <th>No</th>
        <th>Kode Akun</th>
        <th>Uraian</th>
        <th>Total Pagu</th>
        <th>Realisasi</th>
        <th>Sisa Pagu</th>
        <th>%</th>
      </tr>
    </thead>
    <tbody>
      \${data.data.topAccounts.slice(0, 10).map((account, index) => \`
        <tr>
          <td>\${index + 1}</td>
          <td>\${account.kode}</td>
          <td>\${account.uraian}</td>
          <td class="amount">\${formatCurrency(account.pagu)}</td>
          <td class="amount">\${formatCurrency(account.realisasi)}</td>
          <td class="amount">\${formatCurrency(account.pagu - account.realisasi)}</td>
          <td>\${(account.persentase * 100).toFixed(2)}%</td>
        </tr>
      \`).join('')}
    </tbody>
  </table>

  <!-- Footer -->
  <div class="footer">
    Laporan ini dibangkit secara otomatis oleh sistem NPD Tracker pada \${new Date().toLocaleString('id-ID')}
  </div>

  \${options.includeWatermark ? '<div class="watermark">DRAFT</div>' : ''}
</body>
</html>\`
  }

  async generateQuarterlyReport(
    organizationId: Id<"organizations">,
    tahun: number,
    quarterlyPeriod: 'Q1' | 'Q2' | 'Q3' | 'Q4',
    options: EnhancedPDFOptions = {}
  ): Promise<{ url: string; size: number }> {
    try {
      await this.initializeBrowser()

      // Get data from backend
      const [summary, npdData, sp2dData, accountsData, performanceData] = await Promise.all([
        // Mock data - in production, replace with actual Convex calls
        new Promise(resolve => setTimeout(() => resolve({
          total: 0,
          byStatus: { final: 0, draft: 0, diajukan: 0, diverifikasi: 0 }
        }), 100)),
        new Promise(resolve => setTimeout(() => resolve([]), 100)),
        new Promise(resolve => setTimeout(() => resolve([]), 100)),
        new Promise(resolve => setTimeout(() => resolve([]), 100)),
        new Promise(resolve => setTimeout(() => resolve([]), 100))
      ])

      // Generate HTML content
      const htmlContent = await this.generateQuarterlyReportHTML({
        periode: quarterlyPeriod,
        tahun,
        organization: { name: 'ORGANISASI' },
        data: {
          totalNPD: summary?.total || 0,
          finalizedNPD: summary?.byStatus?.final || 0,
          totalSP2D: summary?.total || 0,
          totalNilai: summary?.totalNilai || 0,
          avgPerformanceRate: performanceData?.avgPerformanceRate || 0,
          topPrograms: accountsData?.slice(0, 10).map(acc => ({
            kode: acc.kode,
            nama: acc.uraian,
            pagu: acc.paguTahun,
            realisasi: acc.realisasiTahun,
            persentase: acc.paguTahun > 0 ? (acc.realisasiTahun / acc.paguTahun) * 100 : 0
          })) || [],
          topAccounts: accountsData?.slice(0, 10).map(acc => ({
            kode: acc.kode,
            uraian: acc.uraian,
            pagu: acc.paguTahun,
            realisasi: acc.realisasiTahun,
            persentase: acc.paguTahun > 0 ? (acc.realisasiTahun / acc.paguTahun) * 100 : 0
          })) || []
        }
      }, options)

      // Generate PDF
      const page = await this.browser!.newPage()
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

      await page.setContent(htmlContent, {
        waitUntil: 'networkidle'
      })

      const pdfBuffer = await page.pdf({
        ...pageSize,
        printBackground: true,
        preferCSSPageSize: true
      })

      return {
        url: \`quarterly-report-\${tahun}-\${quarterlyPeriod}.pdf\`,
        size: pdfBuffer.length
      }
    } catch (error) {
      console.error('Quarterly report generation error:', error)
      throw new Error(\`Failed to generate quarterly report: \${error instanceof Error ? error.message : 'Unknown error'}\`)
    } finally {
      await this.closeBrowser()
    }
  }
}
