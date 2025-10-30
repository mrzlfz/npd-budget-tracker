'use client'

interface NPDData {
  documentNumber: string
  title: string
  jenis: string
  subkegiatanKode: string
  subkegiatanNama: string
  tahun: number
  createdAt: string
  lines: Array<{
    akunKode: string
    uraian: string
    jumlah: number
  }>
  createdBy: string
  verifiedBy?: string
  verifiedAt?: string
  finalizedBy?: string
  finalizedAt?: string
  organization: {
    name: string
    alamat?: string
    telepon?: string
    email?: string
    logo?: string
  }
}

interface NPDTemplateProps {
  data: NPDData
  preview?: boolean
}

// Template HTML untuk NPD document (simplified version)
const generateNPHTML = (data: NPDData): string => {
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

  return `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NOTA PENCAIRAN DANA (NPD) - ${data.documentNumber}</title>
    <style>
        @page {
            size: A4;
            margin: 20px 20px 40px 20px;
        }

        @media print {
            body { -webkit-print-color-adjust: exact; }
            .page { margin: 0; }
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

        .footer {
            position: fixed;
            bottom: 20px;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
    </style>
</head>
<body>
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
                    <th>Volume</th>
                    <th>Harga Satuan</th>
                    <th>Jumlah</th>
                </tr>
            </thead>
            <tbody>
                ${data.lines.map((line, index) => `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${line.akunKode}</td>
                        <td>${line.uraian}</td>
                        <td>-</td>
                        <td>-</td>
                        <td>-</td>
                        <td style="text-align: right;">${formatCurrency(line.jumlah)}</td>
                    </tr>
                `).join('')}
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="4" style="text-align: right; border-top: 2px solid #000; padding-top: 8px;">
                        <strong>Jumlah Total: ${formatCurrency(data.lines.reduce((sum, line) => sum + line.jumlah, 0))}</strong>
                    </td>
                </tr>
            </tfoot>
        </table>
    </div>

    <!-- Persetujuan -->
    ${data.verifiedBy ? `
    <div class="content">
        <h2>Verifikasi</h2>
        <table class="info-table">
            <tr>
                <td><strong>Diverifikasi Oleh:</strong></td>
                <td>${data.verifiedBy}</td>
                <td><strong>Tanggal Verifikasi:</strong></td>
                <td>${formatDate(data.verifiedAt || 0)}</td>
            </tr>
        </table>
    </div>
    ` : ''}

    ${data.finalizedBy ? `
    <div class="content">
        <h2>Finalisasi</h2>
        <table class="info-table">
            <tr>
                <td><strong>Difinalisasi Oleh:</strong></td>
                <td>${data.finalizedBy}</td>
                <td><strong>Tanggal Finalisasi:</strong></td>
                <td>${formatDate(data.finalizedAt || 0)}</td>
            </tr>
        </table>
    </div>
    ` : ''}

    <!-- Tanda Tangan -->
    <div class="signature-area">
        <div class="signature">
            ${data.finalizedBy ? data.finalizedBy : '_________________________'}
        </div>
        <div style="margin-top: 20px; font-size: 10px;">
            ${data.finalizedBy ? `(${new Date().getFullYear()})` : ''}
        </div>
    </div>

    <!-- Footer -->
    <div class="footer">
        <p>Dokumen ini dicetak secara otomatis dan sah</p>
        <p>Generate oleh NPD Tracker System</p>
    </div>

</body>
</html>
  `
}

export default function NPDTemplate({ data, preview = false }: NPDTemplateProps) {
  const htmlContent = generateNPHTML(data)

  if (preview) {
    return (
      <div style={{
        width: '100%',
        height: '600px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        overflow: 'auto',
        background: '#fff',
      }}>
        <div
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </div>
    )
  }

  // For actual PDF generation, you would use a library like puppeteer
  const generatePDF = async () => {
    // This would integrate with puppeteer to convert HTML to PDF
    console.log('PDF generation would be implemented here')
    return htmlContent
  }

  return (
    <div>
      {generatePDF && (
        <button
          onClick={generatePDF}
          style={{
            padding: '10px 20px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Generate PDF
        </button>
      )}
    </div>
  )
}