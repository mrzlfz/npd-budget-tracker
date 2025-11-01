/**
 * CSV Export Utility
 * 
 * Provides functions to export data to CSV format with proper formatting
 * for Indonesian locale (Rupiah currency, dates, etc.)
 */

export interface ExportColumn {
  key: string
  label: string
  format?: 'currency' | 'number' | 'date' | 'percentage' | 'text'
}

export interface ExportOptions {
  filename: string
  columns: ExportColumn[]
  data: any[]
  includeTimestamp?: boolean
}

/**
 * Format a value based on the column type
 */
function formatValue(value: any, format?: string): string {
  if (value === null || value === undefined) {
    return ''
  }

  switch (format) {
    case 'currency':
      // Indonesian Rupiah formatting
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(Number(value))

    case 'number':
      return new Intl.NumberFormat('id-ID').format(Number(value))

    case 'date':
      // Format date to Indonesian locale
      if (typeof value === 'number') {
        return new Date(value).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        })
      }
      return new Date(value).toLocaleDateString('id-ID')

    case 'percentage':
      return `${Number(value).toFixed(2)}%`

    case 'text':
    default:
      return String(value)
  }
}

/**
 * Escape CSV special characters
 */
function escapeCSV(value: string): string {
  // If value contains comma, quote, or newline, wrap in quotes
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    // Escape quotes by doubling them
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Convert data to CSV string
 */
function convertToCSV(columns: ExportColumn[], data: any[]): string {
  // Header row
  const headers = columns.map(col => escapeCSV(col.label)).join(',')
  
  // Data rows
  const rows = data.map(row => {
    return columns.map(col => {
      const value = row[col.key]
      const formatted = formatValue(value, col.format)
      return escapeCSV(formatted)
    }).join(',')
  })

  return [headers, ...rows].join('\n')
}

/**
 * Download CSV file
 */
function downloadCSV(csvContent: string, filename: string): void {
  // Add BOM for Excel UTF-8 compatibility
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

/**
 * Export data to CSV file
 * 
 * @param options Export configuration
 * 
 * @example
 * ```typescript
 * exportToCSV({
 *   filename: 'npd-report',
 *   columns: [
 *     { key: 'documentNumber', label: 'Nomor NPD', format: 'text' },
 *     { key: 'createdAt', label: 'Tanggal', format: 'date' },
 *     { key: 'totalAmount', label: 'Jumlah', format: 'currency' }
 *   ],
 *   data: npdList,
 *   includeTimestamp: true
 * })
 * ```
 */
export function exportToCSV(options: ExportOptions): void {
  const { filename, columns, data, includeTimestamp = true } = options

  // Generate CSV content
  const csvContent = convertToCSV(columns, data)

  // Generate filename with timestamp
  let finalFilename = filename
  if (includeTimestamp) {
    const timestamp = new Date().toISOString().split('T')[0]
    finalFilename = `${filename}_${timestamp}`
  }
  
  // Ensure .csv extension
  if (!finalFilename.endsWith('.csv')) {
    finalFilename += '.csv'
  }

  // Download file
  downloadCSV(csvContent, finalFilename)
}

/**
 * Export NPD list to CSV
 */
export function exportNPDListToCSV(npdList: any[], filename = 'laporan-npd'): void {
  const columns: ExportColumn[] = [
    { key: 'documentNumber', label: 'Nomor NPD', format: 'text' },
    { key: 'jenis', label: 'Jenis', format: 'text' },
    { key: 'programName', label: 'Program', format: 'text' },
    { key: 'kegiatanName', label: 'Kegiatan', format: 'text' },
    { key: 'subKegiatanName', label: 'Sub Kegiatan', format: 'text' },
    { key: 'totalJumlah', label: 'Total Jumlah (Rp)', format: 'currency' },
    { key: 'status', label: 'Status', format: 'text' },
    { key: 'createdAt', label: 'Tanggal Dibuat', format: 'date' },
    { key: 'finalizedAt', label: 'Tanggal Finalisasi', format: 'date' }
  ]

  exportToCSV({ filename, columns, data: npdList })
}

/**
 * Export SP2D list to CSV
 */
export function exportSP2DListToCSV(sp2dList: any[], filename = 'laporan-sp2d'): void {
  const columns: ExportColumn[] = [
    { key: 'noSP2D', label: 'Nomor SP2D', format: 'text' },
    { key: 'noSPM', label: 'Nomor SPM', format: 'text' },
    { key: 'tglSP2D', label: 'Tanggal SP2D', format: 'date' },
    { key: 'npdDocumentNumber', label: 'Nomor NPD', format: 'text' },
    { key: 'nilaiCair', label: 'Nilai Cair (Rp)', format: 'currency' },
    { key: 'programName', label: 'Program', format: 'text' },
    { key: 'kegiatanName', label: 'Kegiatan', format: 'text' },
    { key: 'createdAt', label: 'Tanggal Dibuat', format: 'date' }
  ]

  exportToCSV({ filename, columns, data: sp2dList })
}

/**
 * Export RKA accounts to CSV
 */
export function exportRKAAccountsToCSV(accounts: any[], filename = 'rka-accounts'): void {
  const columns: ExportColumn[] = [
    { key: 'kode', label: 'Kode Rekening', format: 'text' },
    { key: 'uraian', label: 'Uraian', format: 'text' },
    { key: 'programName', label: 'Program', format: 'text' },
    { key: 'kegiatanName', label: 'Kegiatan', format: 'text' },
    { key: 'subkegiatanName', label: 'Sub Kegiatan', format: 'text' },
    { key: 'paguTahun', label: 'Pagu Tahun (Rp)', format: 'currency' },
    { key: 'realisasiTahun', label: 'Realisasi Tahun (Rp)', format: 'currency' },
    { key: 'sisaPagu', label: 'Sisa Pagu (Rp)', format: 'currency' },
    { key: 'persentaseRealisasi', label: 'Persentase Realisasi', format: 'percentage' }
  ]

  exportToCSV({ filename, columns, data: accounts })
}

/**
 * Export budget realization summary to CSV
 */
export function exportRealizationSummaryToCSV(summary: any[], filename = 'realisasi-anggaran'): void {
  const columns: ExportColumn[] = [
    { key: 'period', label: 'Periode', format: 'text' },
    { key: 'totalPagu', label: 'Total Pagu (Rp)', format: 'currency' },
    { key: 'totalRealisasi', label: 'Total Realisasi (Rp)', format: 'currency' },
    { key: 'sisaPagu', label: 'Sisa Pagu (Rp)', format: 'currency' },
    { key: 'persentaseRealisasi', label: 'Persentase Realisasi', format: 'percentage' },
    { key: 'jumlahNPD', label: 'Jumlah NPD', format: 'number' },
    { key: 'jumlahSP2D', label: 'Jumlah SP2D', format: 'number' }
  ]

  exportToCSV({ filename, columns, data: summary })
}

/**
 * Export performance indicators to CSV
 */
export function exportPerformanceToCSV(performance: any[], filename = 'kinerja-indikator'): void {
  const columns: ExportColumn[] = [
    { key: 'indikatorNama', label: 'Nama Indikator', format: 'text' },
    { key: 'subkegiatanName', label: 'Sub Kegiatan', format: 'text' },
    { key: 'periode', label: 'Periode', format: 'text' },
    { key: 'target', label: 'Target', format: 'number' },
    { key: 'realisasi', label: 'Realisasi', format: 'number' },
    { key: 'satuan', label: 'Satuan', format: 'text' },
    { key: 'persentaseCapaian', label: 'Persentase Capaian', format: 'percentage' },
    { key: 'status', label: 'Status', format: 'text' },
    { key: 'createdAt', label: 'Tanggal', format: 'date' }
  ]

  exportToCSV({ filename, columns, data: performance })
}

