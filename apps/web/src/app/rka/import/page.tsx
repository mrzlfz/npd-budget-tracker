"use client";

import React, { useState } from "react";
import { Container, Title, Stack, Button, Group } from "@mantine/core";
import { IconUpload, IconArrowLeft } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { RKAImportModal } from "@/components/rka/RKAImportModal";
import { useOrganization } from "@/hooks/useOrganization";

export default function RKAImportPage() {
  const router = useRouter();
  const { organization, isLoading: orgLoading } = useOrganization();
  const [importModalOpened, setImportModalOpened] = useState(false);

  if (orgLoading) {
    return <div>Loading...</div>;
  }

  if (!organization) {
    return <div>Organization not found</div>;
  }

  return (
    <Container size="lg" py="md">
      <Stack>
        {/* Header */}
        <Group justify="space-between" mb="md">
          <Title order={2}>Import Data RKA</Title>
          <Button
            variant="outline"
            leftSection={<IconArrowLeft size="16" />}
            onClick={() => router.back()}
          >
            Kembali
          </Button>
        </Group>

        {/* Main Import Area */}
        <Stack
          p="xl"
          style={{
            border: "2px dashed #dee2e6",
            borderRadius: "8px",
            backgroundColor: "#f8f9fa",
            textAlign: "center",
          }}
        >
          <IconUpload size={64} color="#6366f1" style={{ marginBottom: "16px" }} />
          <Title order={3} mb="sm">
            Import Data RKA dari CSV
          </Title>
          <div style={{ color: "#6c757d", marginBottom: "24px" }}>
            Upload file CSV berisi data Program, Kegiatan, Sub Kegiatan, dan Akun Belanja.
            Format harus sesuai template yang tersedia.
          </div>

          <Group justify="center">
            <Button
              size="lg"
              onClick={() => setImportModalOpened(true)}
              leftSection={<IconUpload size="20" />}
            >
              Mulai Import
            </Button>
          </Group>
        </Stack>

        {/* Instructions */}
        <Stack mt="xl">
          <Title order={4} mb="md">
            Petunjuk Import:
          </Title>

          <ol style={{ paddingLeft: "20px", lineHeight: "1.6" }}>
            <li style={{ marginBottom: "12px" }}>
              <strong>Download Template:</strong> Gunakan template CSV yang telah disediakan untuk memastikan format yang benar.
            </li>
            <li style={{ marginBottom: "12px" }}>
              <strong>Isi Data:</strong> Lengkapi semua field yang wajib diisi (ditandai dengan *).
            </li>
            <li style={{ marginBottom: "12px" }}>
              <strong>Format Kode:</strong> Pastikan format kode mengikuti pola X.XX.XX.XX.XXX (contoh: 5.1.01.01.001).
            </li>
            <li style={{ marginBottom: "12px" }}>
              <strong>Validasi:</strong> Sistem akan memvalidasi struktur data sebelum proses import.
            </li>
            <li style={{ marginBottom: "12px" }}>
              <strong>Proses Batch:</strong> Import dilakukan secara batch untuk mencegah timeout.
            </li>
            <li style={{ marginBottom: "12px" }}>
              <strong>Monitor Progress:</strong> Pantau progress import secara real-time.
            </li>
            <li style={{ marginBottom: "12px" }}>
              <strong>Review Hasil:</strong> Periksa hasil import dan error yang terjadi.
            </li>
          </ol>
        </Stack>
      </Stack>

      {/* Import Modal */}
      <RKAImportModal
        opened={importModalOpened}
        onClose={() => setImportModalOpened(false)}
        organizationId={organization._id}
      />
    </Container>
  );
}