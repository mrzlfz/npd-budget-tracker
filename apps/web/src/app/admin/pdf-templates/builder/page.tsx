'use client';

import { useState } from 'react';
import { Container, Title, Group, Card, Stack, Alert } from '@mantine/core';
import { IconArrowLeft, IconSettings } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { usePermissions } from '@/hooks/usePermissions';
import { TemplateBuilder } from '@/components/pdf/TemplateBuilder';
import { TemplatePreview } from '@/components/pdf/TemplatePreview';

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

export default function PDFTemplateBuilder() {
  const router = useRouter();
  const { canManageUsers } = usePermissions();

  // Mock organization ID - in production, get from auth context
  const [organizationId] = useState<'organizations'>('mock-org-id' as any);

  const { data: currentConfig, isLoading } = useQuery(api.pdfTemplates.getTemplateConfig, {
    organizationId,
  });

  const [templateConfig, setTemplateConfig] = useState<TemplateConfig>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Initialize template config with current data
  useState(() => {
    if (currentConfig) {
      setTemplateConfig(currentConfig);
    }
  });

  if (!canManageUsers) {
    return (
      <Container size="md" py="md">
        <Alert color="red">
          Anda tidak memiliki akses ke halaman ini. Hubungi administrator untuk informasi lebih lanjut.
        </Alert>
      </Container>
    );
  }

  const handleSave = (config: TemplateConfig) => {
    console.log('Template saved:', config);
    setTemplateConfig(config);
  };

  const handlePreview = (config: TemplateConfig) => {
    setTemplateConfig(config);
    setIsPreviewOpen(true);
  };

  const handleGeneratePDF = (config: TemplateConfig) => {
    console.log('Generating PDF with config:', config);
    // Implement actual PDF generation
    setIsPreviewOpen(false);
  };

  if (isLoading) {
    return (
      <Container size="md" py="md">
        <Stack>
          <Title order={2}>Loading...</Title>
          <Card p="md" withBorder>
            Memuat template konfigurasi...
          </Card>
        </Stack>
      </Container>
    );
  }

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>PDF Template Builder</Title>
          <p style={{ color: '#666', marginTop: '4px' }}>
            Konfigurasi template PDF NPD untuk organisasi Anda
          </p>
        </div>
        <Group>
          <button
            onClick={() => router.push('/admin')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: '#f1f3f5',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              color: '#64748b',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            <IconArrowLeft size={16} />
            Kembali
          </button>
        </Group>
      </Group>

      <Stack gap="lg">
        <Alert icon={<IconSettings size={16} />} color="blue">
          <strong>Informasi:</strong> Template yang Anda konfigurasi di sini akan digunakan
          untuk generate PDF NPD otomatis. Pastikan semua informasi sudah benar sebelum menyimpan.
        </Alert>

        <TemplateBuilder
          organizationId={organizationId}
          onSave={handleSave}
          onPreview={handlePreview}
        />

        <TemplatePreview
          organizationId={organizationId}
          config={templateConfig}
          opened={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          onGeneratePDF={handleGeneratePDF}
        />
      </Stack>
    </Container>
  );
}