'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Group,
  Title,
  Text,
  Button,
  Modal,
  Stack,
  Badge,
  ScrollArea,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { IconX, IconDownload, IconPrinter } from '@tabler/icons-react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from 'convex/values';

interface TemplateConfig {
  logoUrl?: string;
  kopSurat?: string;
  footerText?: string;
  signatures?: Array<{
    id: string;
    name: string;
    title: string;
    position?: string;
  }>;
  customStyles?: {
    headerColor?: string;
    headerFont?: string;
    bodyFont?: string;
    watermark?: string;
  };
}

interface TemplatePreviewProps {
  organizationId: Id<'organizations'>;
  config: TemplateConfig;
  onClose: () => void;
  opened: boolean;
  onGeneratePDF?: (config: TemplateConfig) => void;
}

interface MockNPDData {
  documentNumber: string;
  jenis: 'UP' | 'GU' | 'TU' | 'LS';
  tanggal: string;
  tahun: number;
  subkegiatan: string;
  catatan?: string;
  lines: Array<{
    no: number;
    kodeAkun: string;
    uraian: string;
    jumlah: string;
  }>;
  total: string;
}

export function TemplatePreview({
  organizationId,
  config,
  onClose,
  opened,
  onGeneratePDF,
}: TemplatePreviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<'UP' | 'GU' | 'TU' | 'LS'>('UP');

  // Generate PDF mutation (mock for now)
  const generatePDF = useMutation(api.pdfTemplates.generateNPDPDF);

  // Mock NPD data for preview
  const mockData: MockNPDData = {
    documentNumber: 'NPD-001/2025',
    jenis: selectedVariant,
    tanggal: new Date().toLocaleDateString('id-ID'),
    tahun: 2025,
    subkegiatan: '1.01.01.01.01 - Pengembangan Sarana dan Prasarana',
    catatan: 'Contoh catatan untuk preview',
    lines: [
      {
        no: 1,
        kodeAkun: '5.1.01.01.01.001',
        uraian: 'Belanja Honorarium Guru Honorer',
        jumlah: 'Rp 50.000.000',
      },
      {
        no: 2,
        kodeAkun: '5.1.02.01.01.002',
        uraian: 'Belanja ATK Kantor',
        jumlah: 'Rp 15.000.000',
      },
      {
        no: 3,
        kodeAkun: '5.1.03.01.01.003',
        uraian: 'Belanja Pemeliharaan Kendaraan',
        jumlah: 'Rp 35.000.000',
      },
    ],
    total: 'Rp 100.000.000',
  };

  const handleGeneratePDF = async () => {
    try {
      setIsLoading(true);

      // Mock PDF generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log('PDF generated with config:', config);
      onGeneratePDF?.(config);

      // In production, this would call the actual PDF generation
      // const result = await generatePDF({
      //   npdId: 'mock-npd-id',
      //   templateOptions: {
      //     includeWatermark: true,
      //     includeSignatures: true,
      //   },
      // });
    } catch (error) {
      console.error('PDF generation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTemplateTitle = (jenis: string) => {
    const titles = {
      UP: 'Nota Pencairan Dana - Uang Persediaan',
      GU: 'Nota Pencairan Dana - Ganti Uang',
      TU: 'Nota Pencairan Dana - Tambahan Uang',
      LS: 'Nota Pencairan Dana - Lanjutan Surat',
    };
    return titles[jenis as keyof typeof titles] || 'Nota Pencairan Dana';
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="90%"
      title={
        <Group justify="space-between">
          <Title order={3}>Preview Template</Title>
          <ActionIcon variant="subtle" onClick={onClose}>
            <IconX size={18} />
          </ActionIcon>
        </Group>
      }
    >
      <Stack gap="md">
        {/* Variant Selector */}
        <Group>
          <Text fw={600}>Pilih Variants:</Text>
          <Group gap="xs">
            {(['UP', 'GU', 'TU', 'LS'] as const).map((variant) => (
              <Button
                key={variant}
                variant={selectedVariant === variant ? 'filled' : 'outline'}
                size="sm"
                onClick={() => setSelectedVariant(variant)}
              >
                {variant}
              </Button>
            ))}
          </Group>
        </Group>

        {/* Preview Area */}
        <Card p="md" withBorder style={{ background: '#f8f9fa' }}>
          <ScrollArea h="60vh">
            <div
              style={{
                fontFamily: config.customStyles?.bodyFont || 'Arial',
                fontSize: '12px',
                lineHeight: '1.4',
                padding: '20px',
                background: 'white',
                minHeight: '800px',
                position: 'relative',
              }}
            >
              {/* Watermark */}
              {config.customStyles?.watermark && (
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%) rotate(-45deg)',
                    fontSize: '72px',
                    opacity: 0.1,
                    color: '#000',
                    zIndex: -1,
                  }}
                >
                  {config.customStyles.watermark}
                </div>
              )}

              {/* Header */}
              <div
                style={{
                  textAlign: 'center',
                  marginBottom: '30px',
                  borderBottom: `2px solid ${config.customStyles?.headerColor || '#000'}`,
                  paddingBottom: '15px',
                }}
              >
                {config.logoUrl && (
                  <img
                    src={config.logoUrl}
                    alt="Logo"
                    style={{
                      maxWidth: '120px',
                      maxHeight: '80px',
                      marginBottom: '10px',
                    }}
                  />
                )}
                {config.kopSurat && (
                  <div
                    style={{
                      fontWeight: 'bold',
                      fontSize: '14px',
                      marginBottom: '5px',
                    }}
                  >
                    {config.kopSurat}
                  </div>
                )}
              </div>

              {/* Title */}
              <h1
                style={{
                  textAlign: 'center',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  margin: '20px 0',
                  textTransform: 'uppercase',
                  fontFamily: config.customStyles?.headerFont || 'Arial',
                }}
              >
                {getTemplateTitle(selectedVariant)}
              </h1>

              {/* Info Table */}
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  margin: '20px 0',
                  fontSize: '12px',
                }}
              >
                <tbody>
                  <tr>
                    <td
                      style={{
                        padding: '8px',
                        border: '1px solid #ddd',
                        fontWeight: 'bold',
                        width: '30%',
                        backgroundColor: '#f5f5f5',
                      }}
                    >
                      Nomor NPD
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {mockData.documentNumber}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: '8px',
                        border: '1px solid #ddd',
                        fontWeight: 'bold',
                        width: '30%',
                        backgroundColor: '#f5f5f5',
                      }}
                    >
                      Tanggal
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {mockData.tanggal}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: '8px',
                        border: '1px solid #ddd',
                        fontWeight: 'bold',
                        width: '30%',
                        backgroundColor: '#f5f5f5',
                      }}
                    >
                      Jenis
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {mockData.jenis}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: '8px',
                        border: '1px solid #ddd',
                        fontWeight: 'bold',
                        width: '30%',
                        backgroundColor: '#f5f5f5',
                      }}
                    >
                      Tahun Anggaran
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {mockData.tahun}
                    </td>
                  </tr>
                  <tr>
                    <td
                      style={{
                        padding: '8px',
                        border: '1px solid #ddd',
                        fontWeight: 'bold',
                        width: '30%',
                        backgroundColor: '#f5f5f5',
                      }}
                    >
                      Sub Kegiatan
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {mockData.subkegiatan}
                    </td>
                  </tr>
                  {mockData.catatan && (
                    <tr>
                      <td
                        style={{
                          padding: '8px',
                          border: '1px solid #ddd',
                          fontWeight: 'bold',
                          width: '30%',
                          backgroundColor: '#f5f5f5',
                        }}
                      >
                        Catatan
                      </td>
                      <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                        {mockData.catatan}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Rincian Table */}
              <h2
                style={{
                  fontSize: '14px',
                  margin: '20px 0 10px 0',
                }}
              >
                Rincian Akun
              </h2>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  margin: '20px 0',
                  fontSize: '12px',
                }}
              >
                <thead>
                  <tr>
                    <th
                      style={{
                        padding: '10px',
                        border: '1px solid #ddd',
                        textAlign: 'left',
                        backgroundColor: '#f2f2f2',
                        fontWeight: 'bold',
                      }}
                    >
                      No
                    </th>
                    <th
                      style={{
                        padding: '10px',
                        border: '1px solid #ddd',
                        textAlign: 'left',
                        backgroundColor: '#f2f2f2',
                        fontWeight: 'bold',
                      }}
                    >
                      Kode Akun
                    </th>
                    <th
                      style={{
                        padding: '10px',
                        border: '1px solid #ddd',
                        textAlign: 'left',
                        backgroundColor: '#f2f2f2',
                        fontWeight: 'bold',
                      }}
                    >
                      Uraian
                    </th>
                    <th
                      style={{
                        padding: '10px',
                        border: '1px solid #ddd',
                        textAlign: 'left',
                        backgroundColor: '#f2f2f2',
                        fontWeight: 'bold',
                      }}
                    >
                      Jumlah
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {mockData.lines.map((line) => (
                    <tr key={line.no}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        {line.no}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        {line.kodeAkun}
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        {line.uraian}
                      </td>
                      <td
                        style={{
                          padding: '10px',
                          border: '1px solid #ddd',
                          textAlign: 'right',
                        }}
                      >
                        {line.jumlah}
                      </td>
                    </tr>
                  ))}
                  <tr
                    style={{
                      fontWeight: 'bold',
                      backgroundColor: '#f9f9f9',
                    }}
                  >
                    <td
                      colSpan={3}
                      style={{
                        padding: '10px',
                        border: '1px solid #ddd',
                        textAlign: 'right',
                      }}
                    >
                      <strong>TOTAL</strong>
                    </td>
                    <td
                      style={{
                        padding: '10px',
                        border: '1px solid #ddd',
                        textAlign: 'right',
                      }}
                    >
                      <strong>{mockData.total}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures */}
              {config.signatures && config.signatures.length > 0 && (
                <div
                  style={{
                    marginTop: '50px',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  {config.signatures.map((signature, index) => (
                    <div
                      key={signature.id}
                      style={{
                        width: '45%',
                        textAlign: 'center',
                      }}
                    >
                      <div
                        style={{
                          borderTop: '1px solid #000',
                          margin: '40px 0 5px 0',
                        }}
                      />
                      <div>{signature.name}</div>
                      <div>{signature.title}</div>
                      {signature.position && (
                        <div>{signature.position}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Footer */}
              {config.footerText && (
                <div
                  style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '20px',
                    right: '20px',
                    textAlign: 'center',
                    fontSize: '10px',
                    color: '#666',
                  }}
                >
                  {config.footerText}
                </div>
              )}

              {/* Generation Info */}
              <div
                style={{
                  marginTop: '30px',
                  fontSize: '10px',
                  color: '#666',
                }}
              >
                Dibuat oleh: Admin (admin) pada {new Date().toLocaleString('id-ID')}
              </div>
            </div>
          </ScrollArea>
        </Card>

        {/* Action Buttons */}
        <Group justify="flex-end">
          <Button
            variant="outline"
            leftSection={<IconDownload size={16} />}
            onClick={handleGeneratePDF}
            loading={isLoading}
          >
            {isLoading ? 'Menghasilkan PDF...' : 'Generate PDF'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}