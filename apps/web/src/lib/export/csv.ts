/**
 * Comprehensive CSV Export Utilities
 * Supports NPD, SP2D, Performance, and RKA data export
 */

export interface CSVExportOptions {
  filename?: string
  encoding?: string
  separator?: ',' | ';' | '\t'
  includeHeaders?: boolean
  dateFormat?: 'id' | 'iso' | 'timestamp'
  numberFormat?: 'id' | 'en'
  currencyFormat?: 'symbol' | 'code' | 'none'
  filter?: {
    dateRange?: { start: Date; end: Date }
    status?: string[]
    userId?: string
    organizationId?: string
  }
  columns?: string[]
}

export interface CSVColumn {
  key: string
  label: string
  formatter?: (value: any, row: any) => string
  type?: 'text' | 'number' | 'currency' | 'date' | 'boolean' | 'object'
}

/**
 * Format number according to locale
 */
function formatNumber(value: number, locale: 'id' | 'en'): string {
  return new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-US').format(value)
}

/**
 * Format currency according to locale and preference
 */
function formatCurrency(
  value: number,
  format: 'symbol' | 'code' | 'none',
  locale: 'id' | 'en'
): string {
  if (format === 'none') return formatNumber(value, locale)

  const options: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }

  if (format === 'code') {
    return `IDR ${formatNumber(value, locale)}`
  }

  return new Intl.NumberFormat(locale === 'id' ? 'id-ID' : 'en-US', options).format(value)
}

/**
 * Format date according to preference
 */
function formatDate(value: number | string, format: 'id' | 'iso' | 'timestamp'): string {
  const date = typeof value === 'string' ? new Date(value) : new Date(value)

  switch (format) {
    case 'id':
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    case 'iso':
      return date.toISOString()
    case 'timestamp':
      return date.getTime().toString()
    default:
      return date.toLocaleDateString()
  }
}

/**
 * Escape CSV field values
 */
function escapeCSVValue(value: string, separator: ',' | ';' | '\t'): string {
  // If value contains separator, newline, or quotes, wrap in quotes and escape quotes
  if (value.includes(separator) || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV<T>(
  data: T[],
  columns: CSVColumn[],
  options: CSVExportOptions
): string {
  const separator = options.separator || ','
  const includeHeaders = options.includeHeaders !== false

  let csv = ''

  // Add headers
  if (includeHeaders) {
    const headers = columns.map(col => escapeCSVValue(col.label, separator))
    csv += headers.join(separator) + '\n'
  }

  // Add data rows
  for (const row of data) {
    const values = columns.map(col => {
      let value = getNestedValue(row, col.key)

      // Apply formatter if provided
      if (col.formatter) {
        value = col.formatter(value, row)
      } else {
        // Apply default formatting based on type
        switch (col.type) {
          case 'currency':
            value = formatCurrency(
              Number(value) || 0,
              options.currencyFormat || 'symbol',
              options.numberFormat || 'id'
            )
            break
          case 'number':
            value = formatNumber(Number(value) || 0, options.numberFormat || 'id')
            break
          case 'date':
            value = formatDate(value, options.dateFormat || 'id')
            break
          case 'boolean':
            value = value ? 'Ya' : 'Tidak'
            break
          case 'object':
            value = JSON.stringify(value)
            break
          default:
            value = String(value || '')
        }
      }

      return escapeCSVValue(String(value), separator)
    })

    csv += values.join(separator) + '\n'
  }

  return csv
}

/**
 * Get nested object value by key path (e.g., 'user.name')
 */
function getNestedValue(obj: any, key: string): any {
  return key.split('.').reduce((current, keyPart) => {
    return current?.[keyPart]
  }, obj)
}

/**
 * NPD Export Configuration
 */
export const NPD_EXPORT_COLUMNS: CSVColumn[] = [
  { key: 'documentNumber', label: 'No. Dokumen', type: 'text' },
  { key: 'title', label: 'Judul NPD', type: 'text' },
  { key: 'jenis', label: 'Jenis NPD', type: 'text' },
  { key: 'subkegiatanKode', label: 'Kode Sub Kegiatan', type: 'text' },
  { key: 'subkegiatanNama', label: 'Nama Sub Kegiatan', type: 'text' },
  { key: 'tahun', label: 'Tahun', type: 'number' },
  { key: 'createdAt', label: 'Tanggal Dibuat', type: 'date' },
  { key: 'createdBy', label: 'Dibuat Oleh', type: 'text' },
  {
    key: 'totalAmount',
    label: 'Total NPD',
    type: 'currency',
    formatter: (value: any, row: any) => {
      const total = row.lines?.reduce((sum: number, line: any) => sum + line.jumlah, 0) || 0
      return formatCurrency(total, 'symbol', 'id')
    }
  },
  {
    key: 'status',
    label: 'Status',
    type: 'text',
    formatter: (value: string) => {
      const statusMap: Record<string, string> = {
        draft: 'Draft',
        diajukan: 'Diajukan',
        diverifikasi: 'Diverifikasi',
        final: 'Final',
        ditolak: 'Ditolak'
      }
      return statusMap[value] || value
    }
  },
  { key: 'verifiedBy', label: 'Diverifikasi Oleh', type: 'text' },
  { key: 'verifiedAt', label: 'Tanggal Verifikasi', type: 'date' },
  { key: 'finalizedBy', label: 'Difinalisasi Oleh', type: 'text' },
  { key: 'finalizedAt', label: 'Tanggal Finalisasi', type: 'date' },
  {
    key: 'organization.name',
    label: 'Organisasi',
    type: 'text'
  }
]

/**
 * SP2D Export Configuration
 */
export const SP2D_EXPORT_COLUMNS: CSVColumn[] = [
  { key: 'noSP2D', label: 'No. SP2D', type: 'text' },
  { key: 'noSPM', label: 'No. SPM', type: 'text' },
  { key: 'tglSP2D', label: 'Tanggal SP2D', type: 'date' },
  { key: 'nilaiCair', label: 'Nilai Cair', type: 'currency' },
  { key: 'catatan', label: 'Catatan', type: 'text' },
  { key: 'createdAt', label: 'Tanggal Dibuat', type: 'date' },
  {
    key: 'npd.documentNumber',
    label: 'No. NPD Referensi',
    type: 'text'
  },
  {
    key: 'npd.title',
    label: 'Judul NPD',
    type: 'text'
  },
  {
    key: 'npd.subkegiatan.kode',
    label: 'Kode Sub Kegiatan',
    type: 'text'
  },
  {
    key: 'totalRealizations',
    label: 'Total Realisasi',
    type: 'currency',
    formatter: (value: any, row: any) => {
      // This would be calculated from realizations data
      return formatCurrency(row.nilaiCair, 'symbol', 'id')
    }
  },
  {
    key: 'organization.name',
    label: 'Organisasi',
    type: 'text'
  }
]

/**
 * Performance Export Configuration
 */
export const PERFORMANCE_EXPORT_COLUMNS: CSVColumn[] = [
  { key: 'indikatorNama', label: 'Nama Indikator', type: 'text' },
  { key: 'subkegiatan.kode', label: 'Kode Sub Kegiatan', type: 'text' },
  { key: 'subkegiatan.nama', label: 'Nama Sub Kegiatan', type: 'text' },
  { key: 'target', label: 'Target', type: 'number' },
  { key: 'realisasi', label: 'Realisasi', type: 'number' },
  { key: 'satuan', label: 'Satuan', type: 'text' },
  { key: 'persenCapaian', label: '% Capaian', type: 'number' },
  { key: 'periode', label: 'Periode', type: 'text' },
  { key: 'createdAt', label: 'Tanggal Dibuat', type: 'date' },
  { key: 'approvedBy', label: 'Disetujui Oleh', type: 'text' },
  { key: 'approvedAt', label: 'Tanggal Persetujuan', type: 'date' },
  {
    key: 'status',
    label: 'Status',
    type: 'text',
    formatter: (value: string) => {
      const statusMap: Record<string, string> = {
        draft: 'Draft',
        approved: 'Disetujui',
        rejected: 'Ditolak'
      }
      return statusMap[value] || value
    }
  }
]

/**
 * RKA Export Configuration
 */
export const RKA_EXPORT_COLUMNS: CSVColumn[] = [
  { key: 'documentNumber', label: 'No. Dokumen', type: 'text' },
  { key: 'title', label: 'Judul RKA', type: 'text' },
  { key: 'tahun', label: 'Tahun Anggaran', type: 'number' },
  { key: 'subkegiatan.kode', label: 'Kode Sub Kegiatan', type: 'text' },
  { key: 'subkegiatan.nama', label: 'Nama Sub Kegiatan', type: 'text' },
  {
    key: 'totalPagu',
    label: 'Total Pagu',
    type: 'currency',
    formatter: (value: any, row: any) => {
      const total = row.lines?.reduce((sum: number, line: any) => sum + line.pagu, 0) || 0
      return formatCurrency(total, 'symbol', 'id')
    }
  },
  {
    key: 'totalRealisasi',
    label: 'Total Realisasi',
    type: 'currency',
    formatter: (value: any, row: any) => {
      // This would be calculated from realizations
      return formatCurrency(0, 'symbol', 'id')
    }
  },
  {
    key: 'sisaPagu',
    label: 'Sisa Pagu',
    type: 'currency',
    formatter: (value: any, row: any) => {
      const totalPagu = row.lines?.reduce((sum: number, line: any) => sum + line.pagu, 0) || 0
      return formatCurrency(totalPagu, 'symbol', 'id')
    }
  },
  { key: 'createdAt', label: 'Tanggal Dibuat', type: 'date' },
  { key: 'status', label: 'Status', type: 'text' },
  {
    key: 'organization.name',
    label: 'Organisasi',
    type: 'text'
  }
]

/**
 * Main export function
 */
export async function exportToCSV<T>(
  data: T[],
  columns: CSVColumn[],
  options: CSVExportOptions = {}
): Promise<void> {
  // Apply filters
  let filteredData = data
  if (options.filter) {
    filteredData = data.filter((item: any) => {
      // Date range filter
      if (options.filter!.dateRange) {
        const itemDate = new Date(item.createdAt)
        if (itemDate < options.filter!.dateRange!.start ||
            itemDate > options.filter!.dateRange!.end) {
          return false
        }
      }

      // Status filter
      if (options.filter!.status && options.filter!.status.length > 0) {
        if (!options.filter!.status.includes(item.status)) {
          return false
        }
      }

      // User filter
      if (options.filter!.userId && item.createdBy !== options.filter!.userId) {
        return false
      }

      // Organization filter
      if (options.filter!.organizationId &&
          item.organizationId !== options.filter!.organizationId) {
        return false
      }

      return true
    })
  }

  // Apply column selection
  let selectedColumns = columns
  if (options.columns && options.columns.length > 0) {
    selectedColumns = columns.filter(col =>
      options.columns!.includes(col.key)
    )
  }

  // Generate CSV
  const csv = arrayToCSV(filteredData, selectedColumns, options)

  // Create download
  const blob = new Blob(['\ufeff' + csv], {
    type: `text/csv;charset=${options.encoding || 'utf-8'}`
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = options.filename || `export-${new Date().toISOString().split('T')[0]}.csv`

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}

/**
 * Preset export functions for common use cases
 */
export const exportNPDToCSV = (data: any[], options?: CSVExportOptions) =>
  exportToCSV(data, NPD_EXPORT_COLUMNS, {
    filename: `npd-export-${new Date().toISOString().split('T')[0]}.csv`,
    ...options
  })

export const exportSP2DToCSV = (data: any[], options?: CSVExportOptions) =>
  exportToCSV(data, SP2D_EXPORT_COLUMNS, {
    filename: `sp2d-export-${new Date().toISOString().split('T')[0]}.csv`,
    ...options
  })

export const exportPerformanceToCSV = (data: any[], options?: CSVExportOptions) =>
  exportToCSV(data, PERFORMANCE_EXPORT_COLUMNS, {
    filename: `performance-export-${new Date().toISOString().split('T')[0]}.csv`,
    ...options
  })

export const exportRKAToCSV = (data: any[], options?: CSVExportOptions) =>
  exportToCSV(data, RKA_EXPORT_COLUMNS, {
    filename: `rka-export-${new Date().toISOString().split('T')[0]}.csv`,
    ...options
  })