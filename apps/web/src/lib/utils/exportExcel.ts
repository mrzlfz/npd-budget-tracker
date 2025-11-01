/**
 * Excel Export Utility
 * 
 * Provides functions to export data to Excel (.xlsx) format with formatting,
 * multiple sheets, and Indonesian locale support.
 * 
 * Uses exceljs library for secure and feature-rich Excel generation
 */

import ExcelJS from 'exceljs'

export interface ExcelColumn {
  key: string
  label: string
  width?: number
  format?: 'currency' | 'number' | 'date' | 'percentage' | 'text'
}

export interface ExcelSheet {
  name: string
  columns: ExcelColumn[]
  data: any[]
  title?: string
}

export interface ExcelExportOptions {
  filename: string
  sheets: ExcelSheet[]
  includeTimestamp?: boolean
  creator?: string
}

/**
 * Format a cell value based on the column type
 */
function formatCellValue(value: any, format?: string): any {
  if (value === null || value === undefined) {
    return ''
  }

  switch (format) {
    case 'currency':
      return Number(value)
    
    case 'number':
      return Number(value)
    
    case 'date':
      if (typeof value === 'number') {
        return new Date(value)
      }
      return new Date(value)
    
    case 'percentage':
      return Number(value) / 100
    
    case 'text':
    default:
      return String(value)
  }
}

/**
 * Get Excel number format string based on column format
 */
function getNumberFormat(format?: string): string {
  switch (format) {
    case 'currency':
      return '"Rp"#,##0'
    
    case 'number':
      return '#,##0'
    
    case 'date':
      return 'dd mmm yyyy'
    
    case 'percentage':
      return '0.00%'
    
    case 'text':
    default:
      return '@'
  }
}

/**
 * Create a worksheet from sheet data
 */
function createWorksheet(workbook: ExcelJS.Workbook, sheet: ExcelSheet): ExcelJS.Worksheet {
  const { columns, data, title, name } = sheet

  // Add worksheet
  const worksheet = workbook.addWorksheet(name)

  let currentRow = 1

  // Add title row if provided
  if (title) {
    const titleRow = worksheet.getRow(currentRow)
    titleRow.getCell(1).value = title
    titleRow.getCell(1).font = { bold: true, size: 16 }
    titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
    
    // Merge title across all columns
    worksheet.mergeCells(currentRow, 1, currentRow, columns.length)
    
    currentRow += 2 // Skip a row for spacing
  }

  // Add header row
  const headerRow = worksheet.getRow(currentRow)
  columns.forEach((col, idx) => {
    const cell = headerRow.getCell(idx + 1)
    cell.value = col.label
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  })
  currentRow++

  // Add data rows
  data.forEach((row) => {
    const dataRow = worksheet.getRow(currentRow)
    columns.forEach((col, idx) => {
      const cell = dataRow.getCell(idx + 1)
      const value = formatCellValue(row[col.key], col.format)
      cell.value = value
      cell.numFmt = getNumberFormat(col.format)
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
      
      // Align numbers to the right
      if (col.format === 'currency' || col.format === 'number' || col.format === 'percentage') {
        cell.alignment = { horizontal: 'right' }
      }
    })
    currentRow++
  })

  // Set column widths
  columns.forEach((col, idx) => {
    worksheet.getColumn(idx + 1).width = col.width || 15
  })

  // Auto-filter on header row
  const headerRowNum = title ? 3 : 1
  worksheet.autoFilter = {
    from: { row: headerRowNum, column: 1 },
    to: { row: headerRowNum, column: columns.length }
  }

  return worksheet
}

/**
 * Export data to Excel file
 * 
 * @param options Export configuration with multiple sheets
 * 
 * @example
 * ```typescript
 * exportToExcel({
 *   filename: 'laporan-lengkap',
 *   sheets: [
 *     {
 *       name: 'NPD',
 *       title: 'Laporan NPD',
 *       columns: [...],
 *       data: npdList
 *     },
 *     {
 *       name: 'SP2D',
 *       title: 'Laporan SP2D',
 *       columns: [...],
 *       data: sp2dList
 *     }
 *   ]
 * })
 * ```
 */
export async function exportToExcel(options: ExcelExportOptions): Promise<void> {
  const { filename, sheets, includeTimestamp = true, creator = 'NPD Tracker' } = options

  // Create workbook
  const workbook = new ExcelJS.Workbook()
  
  // Set workbook properties
  workbook.creator = creator
  workbook.created = new Date()
  workbook.modified = new Date()
  workbook.lastPrinted = new Date()

  // Add each sheet to workbook
  sheets.forEach(sheet => {
    createWorksheet(workbook, sheet)
  })

  // Generate filename with timestamp
  let finalFilename = filename
  if (includeTimestamp) {
    const timestamp = new Date().toISOString().split('T')[0]
    finalFilename = `${filename}_${timestamp}`
  }
  
  // Ensure .xlsx extension
  if (!finalFilename.endsWith('.xlsx')) {
    finalFilename += '.xlsx'
  }

  // Write file to browser download
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  })
  
  // Create download link
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = finalFilename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

/**
 * Export NPD list to Excel with multiple sheets
 */
export async function exportNPDReportToExcel(
  npdList: any[], 
  npdLines: any[], 
  filename = 'laporan-npd'
): Promise<void> {
  const sheets: ExcelSheet[] = [
    {
      name: 'Daftar NPD',
      title: 'LAPORAN NOTA PENCAIRAN DANA (NPD)',
      columns: [
        { key: 'documentNumber', label: 'Nomor NPD', width: 20, format: 'text' },
        { key: 'jenis', label: 'Jenis', width: 10, format: 'text' },
        { key: 'programName', label: 'Program', width: 30, format: 'text' },
        { key: 'kegiatanName', label: 'Kegiatan', width: 30, format: 'text' },
        { key: 'subKegiatanName', label: 'Sub Kegiatan', width: 30, format: 'text' },
        { key: 'totalJumlah', label: 'Total Jumlah (Rp)', width: 18, format: 'currency' },
        { key: 'status', label: 'Status', width: 15, format: 'text' },
        { key: 'createdAt', label: 'Tanggal Dibuat', width: 18, format: 'date' },
        { key: 'finalizedAt', label: 'Tanggal Finalisasi', width: 18, format: 'date' }
      ],
      data: npdList
    }
  ]

  // Add lines sheet if data provided
  if (npdLines && npdLines.length > 0) {
    sheets.push({
      name: 'Rincian NPD',
      title: 'RINCIAN ITEM NPD',
      columns: [
        { key: 'npdNumber', label: 'Nomor NPD', width: 20, format: 'text' },
        { key: 'kodeRekening', label: 'Kode Rekening', width: 18, format: 'text' },
        { key: 'uraian', label: 'Uraian', width: 35, format: 'text' },
        { key: 'jumlah', label: 'Jumlah (Rp)', width: 18, format: 'currency' },
        { key: 'keterangan', label: 'Keterangan', width: 30, format: 'text' }
      ],
      data: npdLines
    })
  }

  await exportToExcel({ filename, sheets })
}

/**
 * Export SP2D report to Excel with distribution details
 */
export async function exportSP2DReportToExcel(
  sp2dList: any[], 
  distributions: any[], 
  filename = 'laporan-sp2d'
): Promise<void> {
  const sheets: ExcelSheet[] = [
    {
      name: 'Daftar SP2D',
      title: 'LAPORAN SURAT PERINTAH PENCAIRAN DANA (SP2D)',
      columns: [
        { key: 'noSP2D', label: 'Nomor SP2D', width: 20, format: 'text' },
        { key: 'noSPM', label: 'Nomor SPM', width: 20, format: 'text' },
        { key: 'tglSP2D', label: 'Tanggal SP2D', width: 18, format: 'date' },
        { key: 'npdDocumentNumber', label: 'Nomor NPD', width: 20, format: 'text' },
        { key: 'nilaiCair', label: 'Nilai Cair (Rp)', width: 18, format: 'currency' },
        { key: 'programName', label: 'Program', width: 30, format: 'text' },
        { key: 'createdAt', label: 'Tanggal Dibuat', width: 18, format: 'date' }
      ],
      data: sp2dList
    }
  ]

  // Add distributions sheet if data provided
  if (distributions && distributions.length > 0) {
    sheets.push({
      name: 'Distribusi',
      title: 'RINCIAN DISTRIBUSI SP2D',
      columns: [
        { key: 'sp2dNumber', label: 'Nomor SP2D', width: 20, format: 'text' },
        { key: 'accountCode', label: 'Kode Rekening', width: 18, format: 'text' },
        { key: 'accountName', label: 'Nama Rekening', width: 35, format: 'text' },
        { key: 'npdAmount', label: 'Jumlah NPD (Rp)', width: 18, format: 'currency' },
        { key: 'distributedAmount', label: 'Jumlah Cair (Rp)', width: 18, format: 'currency' },
        { key: 'percentage', label: 'Persentase', width: 12, format: 'percentage' }
      ],
      data: distributions
    })
  }

  await exportToExcel({ filename, sheets })
}

/**
 * Export RKA accounts to Excel
 */
export async function exportRKAToExcel(accounts: any[], filename = 'rka-accounts'): Promise<void> {
  const sheets: ExcelSheet[] = [
    {
      name: 'Rekening',
      title: 'RENCANA KERJA DAN ANGGARAN (RKA)',
      columns: [
        { key: 'kode', label: 'Kode Rekening', width: 18, format: 'text' },
        { key: 'uraian', label: 'Uraian', width: 40, format: 'text' },
        { key: 'programName', label: 'Program', width: 30, format: 'text' },
        { key: 'kegiatanName', label: 'Kegiatan', width: 30, format: 'text' },
        { key: 'subkegiatanName', label: 'Sub Kegiatan', width: 30, format: 'text' },
        { key: 'paguTahun', label: 'Pagu Tahun (Rp)', width: 18, format: 'currency' },
        { key: 'realisasiTahun', label: 'Realisasi (Rp)', width: 18, format: 'currency' },
        { key: 'sisaPagu', label: 'Sisa Pagu (Rp)', width: 18, format: 'currency' },
        { key: 'persentaseRealisasi', label: '% Realisasi', width: 12, format: 'percentage' }
      ],
      data: accounts
    }
  ]

  await exportToExcel({ filename, sheets })
}

/**
 * Export dashboard summary to Excel
 */
export async function exportDashboardToExcel(
  summary: any,
  npdList: any[],
  sp2dList: any[],
  filename = 'dashboard-summary'
): Promise<void> {
  const sheets: ExcelSheet[] = [
    {
      name: 'Ringkasan',
      title: 'RINGKASAN DASHBOARD',
      columns: [
        { key: 'indicator', label: 'Indikator', width: 30, format: 'text' },
        { key: 'value', label: 'Nilai', width: 20, format: 'number' }
      ],
      data: [
        { indicator: 'Total NPD', value: summary.totalNPD },
        { indicator: 'NPD Difinalisasi', value: summary.finalizedNPD },
        { indicator: 'Total SP2D', value: summary.totalSP2D },
        { indicator: 'Nilai SP2D (Rp)', value: summary.totalSP2DValue },
        { indicator: 'Total Pagu (Rp)', value: summary.totalPagu },
        { indicator: 'Total Realisasi (Rp)', value: summary.totalRealisasi },
        { indicator: 'Persentase Realisasi', value: summary.persentaseRealisasi }
      ]
    },
    {
      name: 'NPD',
      title: 'DAFTAR NPD',
      columns: [
        { key: 'documentNumber', label: 'Nomor', width: 20, format: 'text' },
        { key: 'status', label: 'Status', width: 15, format: 'text' },
        { key: 'totalJumlah', label: 'Jumlah (Rp)', width: 18, format: 'currency' },
        { key: 'createdAt', label: 'Tanggal', width: 18, format: 'date' }
      ],
      data: npdList
    },
    {
      name: 'SP2D',
      title: 'DAFTAR SP2D',
      columns: [
        { key: 'noSP2D', label: 'Nomor', width: 20, format: 'text' },
        { key: 'nilaiCair', label: 'Nilai Cair (Rp)', width: 18, format: 'currency' },
        { key: 'tglSP2D', label: 'Tanggal', width: 18, format: 'date' }
      ],
      data: sp2dList
    }
  ]

  await exportToExcel({ filename, sheets })
}
