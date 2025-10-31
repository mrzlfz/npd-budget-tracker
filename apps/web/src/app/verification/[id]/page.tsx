'use client';

import { useState } from 'react';
import { Container, Title, Group, Card, Grid, Button, Alert, Stack } from '@mantine/core';
import { IconArrowLeft, IconChecklist, IconHistory } from '@tabler/icons-react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { VerificationChecklist } from '@/components/verification/VerificationChecklist';
import { WorkflowManager } from '@/components/verification/WorkflowManager';
import { usePermissions } from '@/hooks/usePermissions';

export default function VerificationDetail() {
  const router = useRouter();
  const params = useParams();
  const { canVerifyNPD } = usePermissions();
  const npdId = params.id as string;

  const [activeTab, setActiveTab] = useState<'checklist' | 'workflow'>('checklist');

  // Get NPD details
  const { data: npd, isLoading } = useQuery(api.npd.getById, {
    npdId,
  });

  if (!canVerifyNPD) {
    return (
      <Container size="md" py="md">
        <Alert color="red">
          Anda tidak memiliki akses ke halaman verifikasi. Hubungi administrator.
        </Alert>
      </Container>
    );
  }

  if (isLoading) {
    return (
      <Container size="md" py="md">
        <Stack>
          <Title order={2}>Loading...</Title>
          <Card p="md" withBorder>
            Memuat data verifikasi...
          </Card>
        </Stack>
      </Container>
    );
  }

  if (!npd) {
    return (
      <Container size="md" py="md">
        <Alert color="red">
          NPD tidak ditemukan.
        </Alert>
      </Container>
    );
  }

  const handleBack = () => {
    router.push('/verification');
  };

  const handleCompleteVerification = (checklistId: string) => {
    console.log('Verification completed for checklist:', checklistId);
    // In production, this would handle completion logic
    setActiveTab('workflow');
  };

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>Verifikasi NPD</Title>
          <p style={{ color: '#666', marginTop: '4px' }}>
            Verifikasi Nota Pencairan Dana - {npd.documentNumber}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleBack}
        >
          <IconArrowLeft size={16} />
          Kembali ke Daftar
        </Button>
      </Group>

      {/* NPD Information Summary */}
      <Card p="md" withBorder mb="lg">
        <Title order={4} mb="md">Informasi NPD</Title>
        <Grid>
          <Grid.Col span={6}>
            <div>
              <strong>Nomor:</strong> {npd.documentNumber}
            </div>
          </Grid.Col>
          <Grid.Col span={6}>
            <div>
              <strong>Jenis:</strong> {npd.jenis}
            </div>
          </Grid.Col>
          <Grid.Col span={6}>
            <div>
              <strong>Tahun:</strong> {npd.tahun}
            </div>
          </Grid.Col>
          <Grid.Col span={6}>
            <div>
              <strong>Status:</strong>
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  backgroundColor:
                    npd.status === 'draft' ? '#e3f2fd' :
                    npd.status === 'diajukan' ? '#228be6' :
                    npd.status === 'diverifikasi' ? '#fbbf24' :
                    npd.status === 'final' ? '#10b981' : '#6c757d',
                  color: 'white',
                }}
              >
                {npd.status.toUpperCase()}
              </span>
            </div>
          </Grid.Col>
          {npd.subkegiatanId && (
            <Grid.Col span={12}>
              <div>
                <strong>Sub Kegiatan:</strong> {npd.subkegiatanId}
              </div>
            </Grid.Col>
          )}
          {npd.catatan && (
            <Grid.Col span={12}>
              <div>
                <strong>Catatan:</strong> {npd.catatan}
              </div>
            </Grid.Col>
          )}
        </Grid>
      </Card>

      {/* Tab Navigation */}
      <Card p="md" withBorder mb="lg">
        <Group>
          <Button
            variant={activeTab === 'checklist' ? 'filled' : 'outline'}
            leftSection={<IconChecklist size={16} />}
            onClick={() => setActiveTab('checklist')}
          >
            Checklist Verifikasi
          </Button>
          <Button
            variant={activeTab === 'workflow' ? 'filled' : 'outline'}
            leftSection={<IconHistory size={16} />}
            onClick={() => setActiveTab('workflow')}
          >
            Riwayat Workflow
          </Button>
        </Group>
      </Card>

      {/* Tab Content */}
      {activeTab === 'checklist' && (
        <VerificationChecklist
          npdId={npdId}
          onVerificationComplete={handleCompleteVerification}
        />
      )}

      {activeTab === 'workflow' && (
        <WorkflowManager
          npdId={npdId}
          onClose={handleBack}
        />
      )}

      {/* Instructions */}
      <Alert icon={<IconChecklist size={16} />} color="blue" mt="lg">
        <Stack gap="xs">
          <div>
            <strong>Proses Verifikasi:</strong>
          </div>
          <ol style={{ margin: '0', paddingLeft: '20px' }}>
            <li>Periksa kelengkapan dokumen sesuai checklist</li>
            <li>Validasi informasi dan nomor dokumen</li>
            <li>Pastikan semua required items telah dicentang</li>
            <li>Tambahkan catatan jika diperlukan</li>
          </ol>
          <div>
            <strong>Setelah verifikasi:</strong>
          </div>
          <ol style={{ margin: '0', paddingLeft: '20px' }}>
            <li>Klik "Setujui & Selesai" untuk menyetujui</li>
            <li>Klik "Tolak" jika ada masalah yang perlu diperbaiki</li>
            <li>Status NPD akan otomatis berubah menjadi "Diverifikasi"</li>
            <li>Notifikasi akan dikirim ke pembuat NPD</li>
          </ol>
        </Stack>
      </Alert>
    </Container>
  );
}