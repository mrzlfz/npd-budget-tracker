'use client';

import React, { useState } from 'react';
import {
  Card,
  Title,
  Text,
  Stack,
  Group,
  Checkbox,
  Button,
  Divider,
  Badge,
  Alert
} from '@mantine/core';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { notifications } from '@mantine/notifications';

interface ChecklistItem {
  id: string;
  category: string;
  question: string;
  required: boolean;
  notes?: string;
}

interface VerificationChecklistProps {
  documentId: string;
  documentType: string; // 'UP', 'GU', 'TU', 'LS'
  onComplete: (results: { [key: string]: any }, notes: string) => void;
}

const NPD_CHECKLIST: ChecklistItem[] = [
  // Dokumen Kelengkapan
  {
    id: 'dokumen_utama',
    category: 'Dokumen Utama',
    question: 'NPD Formulir lengkap dengan tanda tangan PPTK?',
    required: true,
    notes: 'Pastikan nomor NPD, tanggal, dan mata anggaran sudah terisi dengan benar'
  },
  {
    id: 'rka_reference',
    category: 'Dokumen Pendukung',
    question: 'RKA/SKPD terkait sudah dilampirkan?',
    required: true,
    notes: 'RKA harus sesuai dengan sub kegiatan yang akan dibiayani'
  },
  {
    id: 'surat_permohonan',
    category: 'Dokumen Pendukung',
    question: 'Surat permohonan pencairan dana dari atasan langsung?',
    required: true,
  },

  // Kelengkapan Administratif
  {
    id: 'identitas_pptk',
    category: 'Administrasi',
    question: 'Identitas PPTK (nama, NIP, jabatan) jelas?',
    required: true,
    notes: 'Verifikasi data PPTK dengan database kepegawaian'
  },
  {
    id: 'bukti_fisik',
    category: 'Administrasi',
    question: 'Bukti fisik pendukung (foto, kwitansi) tersedia?',
    required: true,
  },

  // Kelengkapan Teknis
  {
    id: 'perhitungan',
    category: 'Validasi Teknis',
    question: 'Perhitungan jumlah sesuai pagu yang tersedia?',
    required: true,
    notes: 'Cek sisa pagu dan validasi perhitungan'
  },
  {
    id: 'breakdown_akun',
    category: 'Validasi Teknis',
    question: 'Breakdown per akun belanja (5.xx) sudah detail?',
    required: true,
    notes: 'Setiap akun harus ada uraian, volume, dan harga satuan'
  },
  {
    id: 'kesesuaian_jenis',
    category: 'Validasi Jenis',
    question: 'Jenis NPD sesuai kebutuhan (UP/GU/TU/LS)?',
    required: true,
    notes: 'UP untuk biaya rutin, GU untuk kegiatan, TU untuk perjalanan dinas, LS untuk pemeliharaan'
  },

  // Kepatuhan Regulasi
  {
    id: 'sesuai_sop',
    category: 'Kepatuhan Regulasi',
    question: 'Proses sesuai SOP yang berlaku?',
    required: true,
    notes: 'Ikuti alur dan prosedur verifikasi yang ditetapkan'
  },
  {
    id: 'tanggal_efektif',
    category: 'Kepatuhan Regulasi',
    question: 'Tanggal efektif pencairan sesuai jadwal?',
    required: false,
  },
  {
    id: 'mata_anggaran_tersedia',
    category: 'Kepatuhan Regulasi',
    question: 'Mata anggaran yang akan digunakan masih tersedia?',
    required: true,
    notes: 'Pastikan tidak ada overbooking pada mata anggaran'
  },
];

const GU_CHECKLIST: ChecklistItem[] = [
  // Fokus pada kelengkapan dan kepatuhan prosedur
  {
    id: 'dokumen_lengkap',
    category: 'Dokumen',
    question: 'Dokumen NPD lengkap (formulir, lampiran)',
    required: true,
  },
  {
    id: 'approval_pimpinan',
    category: 'Approval',
    question: 'Approval dari atasan langsung/pejabat berwenang?',
    required: true,
  },
  {
    id: 'validasi_anggaran',
    category: 'Validasi',
    question: 'Validasi ketersediaan pagu',
    required: true,
  },
  {
    id: 'kesesuaian_format',
    category: 'Format',
    question: 'Format dan penulisan sesuai ketentuan?',
    required: true,
  },
];

const TU_CHECKLIST: ChecklistItem[] = [
  // Fokus pada perjalanan dinas dan biaya operasional
  {
    id: 'surat_tugas',
    category: 'Dokumen Perjalanan',
    question: 'Surat tugas/perintah perjalanan dinas?',
    required: true,
  },
  {
    id: 'rincian_biaya',
    category: 'Dokumen Perjalanan',
    question: 'Rincian biaya yang akan dibiayani (perincian)',
    required: true,
  },
  {
    id: 'approval_ppk',
    category: 'Approval',
    question: 'Approval dari Pimpinan PKK?',
    required: true,
  },
];

const LS_CHECKLIST: ChecklistItem[] = [
  // Fokus pada pemeliharaan barang/jasa
  {
    id: 'dokumen_kontrak',
    category: 'Dokumen Kontrak',
    question: 'Dokumen kontrak/HPS untuk pemeliharaan?',
    required: true,
  },
  {
    id: 'spesifikasi_teknis',
    category: 'Dokumen Kontrak',
    question: 'Spesifikasi teknis dan gambar rencana?',
    required: true,
  },
  {
    id: 'hps_daftar',
    category: 'Dokumen Pendukung',
    question: 'HPS (Daftar Barang) sesuai kebutuhan?',
    required: true,
  },
  {
    id: 'validasi_ketersediaan',
    category: 'Validasi',
    question: 'Validasi ketersediaan dana',
    required: true,
  },
];

const getChecklistByType = (jenis: string) => {
  switch (jenis) {
    case 'UP': return NPD_CHECKLIST;
    case 'GU': return GU_CHECKLIST;
    case 'TU': return TU_CHECKLIST;
    case 'LS': return LS_CHECKLIST;
    default: return NPD_CHECKLIST;
  }
};

export default function VerificationChecklist({ documentId, documentType, onComplete }: VerificationChecklistProps) {
  const [checklistResults, setChecklistResults] = useState<{ [key: string]: boolean }>({});
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checklist = getChecklistByType(documentType);

  const handleCheckboxChange = (itemId: string, checked: boolean) => {
    setChecklistResults(prev => ({ ...prev, [itemId]: checked }));
  };

  // Computed: Check incomplete required items
  const requiredItems = checklist.filter(item => item.required);
  const incompleteRequired = requiredItems.filter(item => !checklistResults[item.id]);

  const handleSubmit = async () => {
    // Validasi semua required items
    if (incompleteRequired.length > 0) {
      notifications.show({
        title: 'Validasi Gagal',
        message: `${incompleteRequired.length} item wajib belum dicentang: ${incompleteRequired.map(i => i.question).join(', ')}`,
        color: 'red',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simpan hasil verifikasi
      await onComplete(checklistResults, notes);

      notifications.show({
        title: 'Verifikasi Berhasil',
        message: 'Dokumen telah diverifikasi dan disimpan',
        color: 'green',
      });

      // Reset form
      setChecklistResults({});
      setNotes('');
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Gagal menyimpan hasil verifikasi',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const completionPercentage = Object.values(checklistResults).filter(Boolean).length / checklist.length * 100;

  return (
    <Card shadow="sm" padding="xl">
      <Title order={3}>Checklist Verifikasi - {documentType}</Title>

      <Stack gap="md" mb="lg">
        {/* Progress Overview */}
        <Card padding="md" withBorder>
          <Group justify="space-between" mb="md">
            <Text fw="bold">Progress Verifikasi</Text>
            <Badge
              size="lg"
              color={completionPercentage === 100 ? 'green' : completionPercentage >= 50 ? 'yellow' : 'red'}
            >
              {Math.round(completionPercentage)}%
            </Badge>
          </Group>

          <div style={{ backgroundColor: '#f5f5f5', borderRadius: '8px', padding: '8px' }}>
            <div
              style={{
                backgroundColor: completionPercentage === 100 ? '#52c41a' : '#e9ecef',
                height: '8px',
                borderRadius: '4px',
                transition: 'all 0.3s ease'
              }}
            />
          </div>
        </Card>

        {/* Checklist Categories */}
        {checklist.map((category) => {
          const categoryItems = checklist.filter(item => item.category === category.category);
          const categoryCompleted = categoryItems.filter(item => checklistResults[item.id]).length;
          const categoryPercentage = categoryCompleted / categoryItems.length * 100;

          return (
            <Card key={category.category} padding="md" withBorder mt="md">
              <Group justify="space-between" mb="sm">
                <Text fw="bold">{category.category}</Text>
                <Badge
                  color={categoryPercentage === 100 ? 'green' : categoryPercentage >= 50 ? 'yellow' : 'red'}
                  variant="light"
                >
                  {categoryCompleted}/{categoryItems.length}
                </Badge>
              </Group>

              <Stack gap="sm">
                {categoryItems.map((item) => (
                  <Group key={item.id} gap="sm" p="sm">
                    <Checkbox
                      label={
                        <Group>
                          <Text size="sm">{item.question}</Text>
                          {item.required && <Text size="xs" c="red">*</Text>}
                        </Group>
                      }
                      checked={checklistResults[item.id] || false}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) => handleCheckboxChange(item.id, event.currentTarget.checked)}
                      disabled={isSubmitting}
                    />

                    {item.notes && (
                      <Text size="xs" c="dimmed" mt="xs">
                        Catatan: {item.notes}
                      </Text>
                    )}
                  </Group>
                ))}
              </Stack>
            </Card>
          );
        })}
      </Stack>

      {/* Notes Section */}
      <Card padding="md" withBorder mt="lg">
        <Text fw="bold" mb="sm">Catatan Verifikasi</Text>
        <textarea
          placeholder="Tambahkan catatan verifikasi jika diperlukan..."
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
          disabled={isSubmitting}
          rows={4}
          style={{
            width: '100%',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            padding: '12px',
            fontSize: '14px'
          }}
        />
      </Card>

      {/* Action Buttons */}
      <Group mt="xl">
        <Button
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isSubmitting}
        >
          Kembali
        </Button>

        <Button
          color={completionPercentage === 100 ? 'green' : undefined}
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={incompleteRequired.length > 0}
        >
          {completionPercentage === 100 ? 'Selesai Verifikasi' : 'Simpan Progress'}
        </Button>
      </Group>
    </Card>
  );
}