'use client';

import { Card, Text, Title, Button, Stack } from '@mantine/core';
import { IconLock, IconUser } from '@tabler/icons-react';
import Link from 'next/link';

export default function UnauthorizedPage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f5f5f5'
    }}>
      <Card shadow="sm" padding="xl" radius="md" w={{ base: '400px', sm: '90%' }}>
        <Stack align="center" gap="md">
          <IconLock
            size={48}
            color="red"
            style={{ marginBottom: '1rem' }}
          />

          <Title order={3} ta="center" c="red.6">
            Akses Tidak Diizinkan
          </Title>

          <Text ta="center" size="sm" c="dimmed">
            Anda tidak memiliki izin yang cukup untuk mengakses halaman ini.
          </Text>

          <Text ta="center" size="sm" c="dimmed" style={{ marginBottom: '1.5rem' }}>
            Hubungi administrator OPD Anda untuk mendapatkan akses yang sesuai.
          </Text>

          <Button
            component={Link}
            href="/dashboard"
            fullWidth
            size="md"
          >
            Kembali ke Dashboard
          </Button>
        </Stack>
      </Card>
    </div>
  );
}