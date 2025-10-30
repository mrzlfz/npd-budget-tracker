'use client';

import React from 'react';
import { Container, Title, Text, Grid, Card, Badge, Button, Stack, Group } from '@mantine/core';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';
import { IconChecklist, IconClockHour4, IconFileText, IconEye } from '@tabler/icons-react';

interface VerificationStats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
}

export default function VerificationPage() {
  const router = useRouter();

  // Fetch verification statistics
  const { data: stats, isLoading } = useQuery<VerificationStats>({
    queryKey: ['verification-stats'],
    queryFn: async () => {
      // This would be a real API call to Convex
      return {
        total: 45,
        pending: 12,
        verified: 28,
        rejected: 5,
      };
    },
  });

  // Fetch documents pending verification
  const { data: pendingDocuments } = useQuery({
    queryKey: ['verification-pending'],
    queryFn: async () => {
      // Mock data - replace with real Convex call
      return [
        {
          id: '1',
          documentNumber: 'NPD-2025-001',
          title: 'Pengadaan ATK Kantor',
          jenis: 'UP',
          submittedBy: 'Ahmad Wijaya',
          submittedAt: '2025-10-28T10:00:00Z',
          status: 'diajukan',
          priority: 'high',
        },
        {
          id: '2',
          documentNumber: 'NPD-2025-002',
          title: 'Biaya Operasional',
          jenis: 'GU',
          submittedBy: 'Siti Nurhaliza',
          submittedAt: '2025-10-28T14:30:00Z',
          status: 'diajukan',
          priority: 'medium',
        },
      ];
    },
  });

  return (
    <Container size="xl" px="xs">
      <Title order={2}>Verifikasi Dokumen NPD</Title>
      <Text c="dimmed" mb="lg">
        Kelola dan verifikasi dokumen NPD yang diajukan oleh PPTK sebelum proses pencairan dana.
      </Text>

      {/* Statistics Overview */}
      <Grid>
        <Grid.Col span={12}>
          <Card shadow="sm" padding="lg" withBorder>
            <Group justify="space-between" mb="md">
              <div>
                <Text size="sm" c="dimmed">Total Menunggu Verifikasi</Text>
                <Text size="xl" fw="bold">12</Text>
              </div>
              <Badge size="lg" color="yellow" variant="light">
                Prioritas Tinggi
              </Badge>
            </Group>
          </Card>
        </Grid.Col>

        <Grid.Col span={6}>
          <Card shadow="sm" padding="lg" withBorder>
            <Stack align="center" gap="sm">
              <IconChecklist size={48} color="blue" />
              <Text size="lg" fw="bold">28</Text>
              <Text c="green">Terverifikasi</Text>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={6}>
          <Card shadow="sm" padding="lg" withBorder>
            <Stack align="center" gap="sm">
              <IconClockHour4 size={48} color="orange" />
              <Text size="lg" fw="bold">5</Text>
              <Text c="orange">Ditolak/Dikembalikan</Text>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      {/* Pending Documents List */}
      <Card shadow="sm" padding="lg" withBorder mt="xl">
        <Group justify="space-between" mb="lg">
          <Text size="lg" fw="bold">Dokumen Menunggu Verifikasi</Text>
          <Button
            variant="light"
            leftSection={<IconFileText size={16} />}
            onClick={() => router.push('/verification/queue')}
          >
            Lihat Antrian Lengkap
          </Button>
        </Group>

        <Stack gap="md">
          {pendingDocuments?.map((doc) => (
            <Card key={doc.id} shadow="xs" padding="md" withBorder>
              <Group justify="space-between" mb="sm">
                <div>
                  <Text fw="bold">{doc.title}</Text>
                  <Text size="sm" c="dimmed">{doc.documentNumber}</Text>
                </div>
                <Group gap="xs">
                  <Badge
                    color={doc.priority === 'high' ? 'red' : 'yellow'}
                    variant="light"
                  >
                    {doc.jenis}
                  </Badge>
                  <Badge color="blue" variant="light">
                    {doc.status}
                  </Badge>
                </Group>
              </Group>

              <Group justify="space-between" mt="sm">
                <Group gap="xs">
                  <Text size="sm" c="dimmed">
                    <IconFileText size={12} />
                    {doc.submittedBy}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {new Date(doc.submittedAt).toLocaleDateString('id-ID')}
                  </Text>
                </Group>
                <Button
                  variant="outline"
                  size="sm"
                  leftSection={<IconEye size={14} />}
                  onClick={() => router.push(`/verification/${doc.id}`)}
                >
                  Verifikasi Sekarang
                </Button>
              </Group>
            </Card>
          ))}
        </Stack>
      </Card>
    </Container>
  );
}