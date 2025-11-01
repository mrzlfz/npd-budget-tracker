'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

export interface ExportButtonProps {
  data: any[]
  onExportCSV: () => void
  onExportExcel: () => void
  label?: string
  disabled?: boolean
  loading?: boolean
}

/**
 * Reusable export button with CSV and Excel options
 */
export function ExportButton({
  data,
  onExportCSV,
  onExportExcel,
  label = 'Export',
  disabled = false,
  loading = false
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExportCSV = async () => {
    if (data.length === 0) {
      toast.error('Tidak ada data untuk diekspor')
      return
    }

    setIsExporting(true)
    try {
      onExportCSV()
      toast.success(`${data.length} baris berhasil diekspor ke CSV`)
    } catch (error) {
      console.error('CSV export error:', error)
      toast.error('Gagal mengekspor data ke CSV')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportExcel = async () => {
    if (data.length === 0) {
      toast.error('Tidak ada data untuk diekspor')
      return
    }

    setIsExporting(true)
    try {
      onExportExcel()
      toast.success(`${data.length} baris berhasil diekspor ke Excel`)
    } catch (error) {
      console.error('Excel export error:', error)
      toast.error('Gagal mengekspor data ke Excel')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled || loading || isExporting || data.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? 'Mengekspor...' : label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Pilih Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExportCSV} disabled={isExporting}>
          <FileText className="mr-2 h-4 w-4" />
          Export ke CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportExcel} disabled={isExporting}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export ke Excel (.xlsx)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Simple CSV export button (no dropdown)
 */
export function ExportCSVButton({
  data,
  onExport,
  label = 'Export CSV',
  disabled = false
}: {
  data: any[]
  onExport: () => void
  label?: string
  disabled?: boolean
}) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (data.length === 0) {
      toast.error('Tidak ada data untuk diekspor')
      return
    }

    setIsExporting(true)
    try {
      onExport()
      toast.success(`${data.length} baris berhasil diekspor`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Gagal mengekspor data')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={disabled || isExporting || data.length === 0}
    >
      <FileText className="mr-2 h-4 w-4" />
      {isExporting ? 'Mengekspor...' : label}
    </Button>
  )
}

/**
 * Simple Excel export button (no dropdown)
 */
export function ExportExcelButton({
  data,
  onExport,
  label = 'Export Excel',
  disabled = false
}: {
  data: any[]
  onExport: () => void
  label?: string
  disabled?: boolean
}) {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    if (data.length === 0) {
      toast.error('Tidak ada data untuk diekspor')
      return
    }

    setIsExporting(true)
    try {
      onExport()
      toast.success(`${data.length} baris berhasil diekspor`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Gagal mengekspor data')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      variant="outline"
      onClick={handleExport}
      disabled={disabled || isExporting || data.length === 0}
    >
      <FileSpreadsheet className="mr-2 h-4 w-4" />
      {isExporting ? 'Mengekspor...' : label}
    </Button>
  )
}

