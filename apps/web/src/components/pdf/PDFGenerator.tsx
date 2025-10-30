'use client'

import { useState } from 'react'
import { Button, Group, Modal, Stack, Title, Text, Select, Switch, NumberInput } from '@mantine/core'
import { IconFileDownload, IconPrinter } from '@tabler/icons-react'
import { notifications } from '@mantine/notifications'
import NPDTemplate from './NPDTemplate'

interface PDFGeneratorProps {
  data: any
  type: 'npd' | 'sp2d' | 'performance'
  onGenerate?: (blob: Blob) => void
}

export default function PDFGenerator({ data, type, onGenerate }: PDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState({
    format: 'A4' as 'A4' | 'Legal',
    orientation: 'portrait' as 'portrait' | 'landscape',
    includeWatermark: true,
    includeSignatures: true,
    copyCount: 1,
    margin: 20,
  })

  const generatePDF = async () => {
    setIsGenerating(true)

    try {
      // Initialize Playwright browser
      const { chromium } = await import('playwright')
      const browser = await chromium.launch({ headless: true })
      const page = await browser.newPage()

      // Set page size based on settings
      const pageSize = {
        format: settings.format.toLowerCase(),
        orientation: settings.orientation,
        margin: {
          top: `${settings.margin}px`,
          bottom: `${settings.margin}px`,
          left: `${settings.margin}px`,
          right: `${settings.margin}px`,
        },
      }

      // Generate HTML content
      let htmlContent = ''

      switch (type) {
        case 'npd':
          // Get the HTML from NPDTemplate component
          const tempDiv = document.createElement('div')
          tempDiv.innerHTML = generateNPHTMLContent(data, settings)
          document.body.appendChild(tempDiv)
          htmlContent = tempDiv.innerHTML
          document.body.removeChild(tempDiv)
          break
        // Add other cases for sp2d and performance
        default:
          throw new Error('Unsupported document type')
      }

      // Set page content
      await page.setContent(htmlContent, {
        waitUntil: 'networkidle',
      })

      // Generate PDF
      const pdf = await page.pdf({
        ...pageSize,
        printBackground: true,
        preferCSSPageSize: true,
      })

      await browser.close()

      // Create blob and trigger download
      const blob = new Blob([pdf], { type: 'application/pdf' })

      // Auto-download
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${type}-${data.documentNumber || data.id}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // Callback with blob
      onGenerate?.(blob)

      notifications.show({
        title: 'PDF Generated',
        message: 'Document successfully generated and downloaded',
        color: 'green',
      })
    } catch (error) {
      console.error('PDF generation error:', error)
      notifications.show({
        title: 'Generation Failed',
        message: error instanceof Error ? error.message : 'Failed to generate PDF',
        color: 'red',
      })
    } finally {
      setIsGenerating(false)
      setShowSettings(false)
    }
  }

  const generateNPHTMLContent = (data: any, settings: any): string => {
    const formatDate = (timestamp: number) => {
      return new Date(timestamp).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: '2-digit'
      })
    }

    const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR'
      }).format(amount)
    }

    // Enhanced template with options
    return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NOTA PENCAIRAN DANA (NPD) - ${data.documentNumber}</title>
    <style>
        @page {
            size: ${settings.format} ${settings.orientation};
            margin: ${settings.margin}px;
        }

        @media print {
            body { -webkit-print-color-adjust: exact; }
            .no-print { display: none; }
        }

        body {
            font-family: 'Times New Roman', serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
        }

        .kop-surat {
            border: 2px solid #000;
            padding: 20px;
            margin-bottom: 20px;
            text-align: center;
        }

        .header {
            text-align: center;
            font-weight: bold;
            margin-bottom: 10px;
        }

        .content {
            margin-bottom: 30px;
        }

        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }

        .info-table th,
        .info-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }

        .info-table th {
            background-color: #f0f0f0;
            font-weight: bold;
        }

        .signature-area {
            margin-top: 50px;
            text-align: center;
        }

        .signature {
            border-bottom: 1px solid #000;
            width: 200px;
            margin: 0 20px;
        }

        ${settings.includeWatermark ? `
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 72px;
            color: rgba(0, 0, 0, 0.1);
            z-index: -1;
            white-space: nowrap;
        }
        ` : ''}

        .footer {
            position: fixed;
            bottom: 20px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10px;
            color: #666;
        }

        .page-number {
            position: fixed;
            bottom: 10px;
            right: 20px;
            font-size: 10px;
        }
    </style>
</head>
<body>
    ${settings.includeWatermark ? '<div class="watermark">CONTOH</div>' : ''}

    <!-- Kop Surat -->
    <div class="kop-surat">
        <div class="header">
            PEMERINTAH KABUPATEN/KOTA ${data.organization.name.toUpperCase()}
        </div>
        <div>
            Alamat: ${data.organization.alamat || 'Jl. [Alamat lengkap]'}
        </div>
        <div>
            Telepon: ${data.organization.telepon || '[Nomor Telepon]'}
        </div>
        <div>
            Email: ${data.organization.email}
        </div>
    </div>

    <!-- Header Dokumen -->
    <div class="header">
        <h1>NOTA PENCAIRAN DANA (NPD)</h1>
        <p>No. Dokumen: ${data.documentNumber}</p>
        <p>Tanggal: ${formatDate(data.createdAt)}</p>
    </div>

    <!-- Informasi NPD -->
    <div class="content">
        <h2>Informasi NPD</h2>
        <table class="info-table">
            <tr>
                <td><strong>Jenis NPD:</strong></td>
                <td>${data.jenis}</td>
            </tr>
            <tr>
                <td><strong>Sub Kegiatan:</strong></td>
                <td>${data.subkegiatanKode} - ${data.subkegiatanNama}</td>
            </tr>
            <tr>
                <td><strong>Tahun Anggaran:</strong></td>
                <td>${data.tahun}</td>
            </tr>
            <tr>
                <td><strong>Dibuat Oleh:</strong></td>
                <td>${data.createdBy}</td>
            </tr>
        </table>
    </div>

    <!-- Rincian Akun -->
    <div class="content">
        <h2>Rincian Akun</h2>
        <table class="info-table">
            <thead>
                <tr>
                    <th>No</th>
                    <th>Kode Akun</th>
                    <th>Uraian</th>
                    <th>Jumlah</th>
                </tr>
            </thead>
            <tbody>
                ${data.lines?.map((line: any, index: number) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${line.akunKode}</td>
                        <td>${line.uraian}</td>
                        <td style="text-align: right;">${formatCurrency(line.jumlah)}</td>
                    </tr>
                `).join('') || ''}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="3" style="text-align: right; border-top: 2px solid #000; padding-top: 8px;">
                        <strong>Jumlah Total: ${formatCurrency(data.lines?.reduce((sum: number, line: any) => sum + line.jumlah, 0) || 0)}</strong>
                    </td>
                </tr>
            </tfoot>
        </table>
    </div>

    ${settings.includeSignatures ? `
    <!-- Tanda Tangan -->
    <div class="signature-area">
        <div class="signature">
            ${data.finalizedBy ? data.finalizedBy : '_________________________'}
        </div>
        <div style="margin-top: 20px; font-size: 10px;">
            ${data.finalizedBy ? `(${new Date().getFullYear()})` : ''}
        </div>
    </div>
    ` : ''}

    <!-- Footer -->
    <div class="footer">
        <p>Dokumen ini dicetak secara otomatis dan sah</p>
        <p>Generate oleh NPD Tracker System</p>
    </div>

    <!-- Page Number -->
    <div class="page-number">Halaman <span class="page-num"></span></div>
</body>
</html>
    `
  }

  return (
    <>
      <Group>
        <Button
          leftSection={<IconFileDownload size={16} />}
          onClick={generatePDF}
          loading={isGenerating}
          disabled={!data}
        >
          Generate PDF
        </Button>

        <Button
          variant="outline"
          leftSection={<IconPrinter size={16} />}
          onClick={() => setShowSettings(true)}
        >
          PDF Settings
        </Button>
      </Group>

      {/* PDF Settings Modal */}
      <Modal
        opened={showSettings}
        onClose={() => setShowSettings(false)}
        title="PDF Generation Settings"
        size="md"
      >
        <Stack>
          <Select
            label="Page Format"
            data={[
              { value: 'A4', label: 'A4 (210 x 297 mm)' },
              { value: 'Legal', label: 'Legal (216 x 356 mm)' },
            ]}
            value={settings.format}
            onChange={(value) => setSettings(prev => ({ ...prev, format: value as 'A4' | 'Legal' }))}
          />

          <Select
            label="Orientation"
            data={[
              { value: 'portrait', label: 'Portrait' },
              { value: 'landscape', label: 'Landscape' },
            ]}
            value={settings.orientation}
            onChange={(value) => setSettings(prev => ({ ...prev, orientation: value as 'portrait' | 'landscape' }))}
          />

          <NumberInput
            label="Margin (px)"
            value={settings.margin}
            onChange={(value) => setSettings(prev => ({ ...prev, margin: value || 20 }))}
            min={10}
            max={50}
          />

          <NumberInput
            label="Copy Count"
            value={settings.copyCount}
            onChange={(value) => setSettings(prev => ({ ...prev, copyCount: value || 1 }))}
            min={1}
            max={10}
          />

          <Switch
            label="Include Watermark"
            checked={settings.includeWatermark}
            onChange={(e) => setSettings(prev => ({ ...prev, includeWatermark: e.currentTarget.checked }))}
          />

          <Switch
            label="Include Signatures"
            checked={settings.includeSignatures}
            onChange={(e) => setSettings(prev => ({ ...prev, includeSignatures: e.currentTarget.checked }))}
          />

          <Group justify="flex-end">
            <Button
              variant="outline"
              onClick={() => setShowSettings(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={generatePDF}
              loading={isGenerating}
            >
              Generate PDF
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}