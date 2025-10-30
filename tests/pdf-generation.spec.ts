import { test, expect } from '@playwright/test'
import { generatePDF } from '../src/lib/services/pdfGenerator'

test.describe('PDF Generation', () => {
  test('should generate PDF with organization template', async ({ page }) => {
    // Mock organization data
    const mockOrganization = {
      _id: 'test-org',
      name: 'Test OPD',
      pdfTemplateConfig: {
        kopSurat: 'PEMERINTAH KABUPATEN TEST\nJalan Test No. 123\nTelpon: (021) 1234567',
        headerColor: '#1a365d',
        headerFont: 'Arial',
        bodyFont: 'Arial',
        watermark: 'CONFIDENTIAL',
        signatures: [
          {
            name: 'Ahmad Test',
            title: 'Kepala Dinas',
            position: 'Test'
          },
          {
            name: 'Budi Test',
            title: 'Sekretaris',
            position: 'Test'
          }
        ]
      }
    }

    // Mock NPD data
    const mockNPD = {
      _id: 'test-npd',
      title: 'Test NPD',
      documentNumber: 'NPD-TEST-001',
      jenis: 'GU',
      tahun: 2025,
      status: 'final',
      lines: [
        {
          account: {
            kode: '5.1.01.01.001',
            uraian: 'Belanja honorarium'
          },
          uraian: 'Honorarium bulan Januari 2025',
          jumlah: 15000000
        },
        {
          account: {
            kode: '5.1.01.01.002',
            uraian: 'Belanja barang'
          },
          uraian: 'Pengadaan ATK kantor',
          jumlah: 5000000
        }
      ]
    }

    const pdfBuffer = await generatePDF({
      npd: mockNPD,
      organization: mockOrganization,
      options: {
        format: 'A4',
        orientation: 'portrait',
        includeWatermark: true,
        includeSignatures: true,
        copyCount: 1
      }
    })

    expect(pdfBuffer).toBeInstanceOf(Buffer)
    expect(pdfBuffer.length).toBeGreaterThan(0)

    // Save PDF for inspection
    const testDir = './test-results'
    const fs = require('fs')
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir)
    }

    const fileName = `test-pdf-${Date.now()}.pdf`
    const filePath = `${testDir}/${fileName}`
    fs.writeFileSync(filePath, pdfBuffer)

    console.log(`PDF generated: ${filePath} (${pdfBuffer.length} bytes)`)
  })

  test('should handle error with missing organization', async ({ page }) => {
    try {
      await generatePDF({
        npd: {
          _id: 'test-npd',
          title: 'Test NPD'
        },
        organization: null,
        options: {
          format: 'A4',
          orientation: 'portrait',
          includeWatermark: true,
          includeSignatures: true,
          copyCount: 1
        }
      })
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect(error.message).toContain('organization')
    }
  })

  test('should validate PDF options', async ({ page }) => {
    const mockOrg = {
      _id: 'test',
      name: 'Test',
      pdfTemplateConfig: {}
    }

    const mockNPD = {
      _id: 'test',
      title: 'Test'
    }

    // Test invalid format
    await expect(async () => {
      await generatePDF({
        npd: mockNPD,
        organization: mockOrg,
        options: {
          format: 'INVALID' as any,
          orientation: 'portrait',
          includeWatermark: true,
          includeSignatures: true,
          copyCount: 1
        }
      })
    }).rejects.toThrow('Invalid PDF format')
  })
})