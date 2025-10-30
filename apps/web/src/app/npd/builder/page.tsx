'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Container,
  Title,
  Group,
  Card,
  Stack,
  TextInput,
  NumberInput,
  Select,
  Button,
  Grid,
  Divider,
  Text,
  Alert,
  Badge,
  LoadingOverlay,
} from '@mantine/core';
import { useForm } from '@mantine/hooks';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import {
  IconPlus,
  IconTrash,
  IconFileUpload,
  IconCheck,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { z } from 'zod';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { env } from '@/env';
import { formatCurrency } from '@/lib/utils/format';
import { useFileUpload } from '@/hooks/useFileUpload';

// Zod schema for NPD creation
const npdSchema = z.object({
  title: z.string().min(1, 'Judul NPD harus diisi'),
  description: z.string().optional(),
  jenis: z.enum(['UP', 'GU', 'TU', 'LS'], {
    required_error: 'Jenis NPD harus dipilih',
  }),
  subkegiatanId: z.string({
    required_error: 'Sub kegiatan harus dipilih',
  }),
  tahun: z.number({
    required_error: 'Tahun anggaran harus diisi',
  }),
  catatan: z.string().optional(),
});

type NPDFormData = z.infer<typeof npdSchema>;

// Mock data for development
const mockSubkegiatans = [
  { _id: '1', kode: '1.01.01.01', nama: 'Pengembangan Sarana dan Prasarana' },
  { _id: '2', kode: '1.01.01.02', nama: 'Pemeliharaan dan Penataan Guru' },
];

const mockAccounts = [
  { _id: '1', kode: '5.1.01.001', uraian: 'Belanja Honorarium Guru', sisaPagu: 100000000 },
  { _id: '2', kode: '5.1.01.002', uraian: 'Belanja ATK Guru', sisaPagu: 50000000 },
];

export default function NPDBuilder() {
  const router = useRouter();
  const form = useForm<NPDFormData>({
    initialValues: {
      title: '',
      description: '',
      jenis: 'UP',
      subkegiatanId: '',
      tahun: new Date().getFullYear(),
      catatan: '',
    },
    validate: {
      onBlur: (values) => {
        const result = npdSchema.safeParse(values);
        if (!result.success) {
          return result.error.format();
        }
        return undefined;
      },
    },
  });

  // Queries for data
  const { data: subkegiatans = [], isLoading: subkegiatansLoading } = useQuery({
    queryKey: ['subkegiatans', form.watch().tahun],
    queryFn: () => api.rkaAccounts.getSubkegiatans({
      fiscalYear: form.watch().tahun,
    }),
  });

  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts', form.watch().subkegiatanId],
    queryFn: () => {
        const formValues = form.watch();
        if (!formValues.subkegiatanId) return [];
        return api.rkaAccounts.getAccountsBySubkegiatan(formValues.subkegiatanId);
      },
  });

  const [selectedAccounts, setSelectedAccounts] = useState<Array<{
    accountId: string;
    uraian: string;
    jumlah: number;
  }>>([]);

  const [totalJumlah, setTotalJumlah] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdNpdId, setCreatedNpdId] = useState<string | null>(null);
  const [budgetWarnings, setBudgetWarnings] = useState<string[]>([]);

  // File upload functionality
  const {
    files: uploadedFiles,
    isUploading,
    addFiles,
    removeFile,
    clearFiles,
    formatFileSize,
  } = useFileUpload({
    npdId: createdNpdId || undefined,
    onSuccess: (files) => {
      console.log('Files uploaded successfully:', files);
    },
    onError: (error) => {
      console.error('File upload error:', error);
    },
  });

  // Calculate total and check budget constraints when selected accounts change
  useEffect(() => {
    const total = selectedAccounts.reduce((sum, acc) => sum + acc.jumlah, 0);
    setTotalJumlah(total);

    // Check budget constraints
    const warnings: string[] = [];
    const accountMap = new Map(accounts.map(acc => [acc._id, acc]));

    selectedAccounts.forEach(selectedAccount => {
      const account = accountMap.get(selectedAccount.accountId);
      if (account && selectedAccount.jumlah > account.sisaPagu) {
        warnings.push(
          `Akun ${account.kode} melebihi sisa pagu. Available: ${formatCurrency(account.sisaPagu)}, Requested: ${formatCurrency(selectedAccount.jumlah)}`
        );
      }
    });

    setBudgetWarnings(warnings);
  }, [selectedAccounts, accounts]);

  const handleSubmit = async (values: NPDFormData) => {
    try {
      setIsSubmitting(true);

      // Validate accounts
      if (selectedAccounts.length === 0) {
        notifications.show({
          title: 'Error',
          message: 'Minimal satu akun harus dipilih',
          color: 'red',
        });
        return;
      }

      // Check budget constraints
      if (budgetWarnings.length > 0) {
        notifications.show({
          title: 'Error',
          message: 'Terdapat pelanggaran batasan anggaran. Silakan periksa kembali akun yang dipilih.',
          color: 'red',
        });
        return;
      }

      // Create NPD using actual Convex mutation
      const npdId = await api.npd.create(values);
      setCreatedNpdId(npdId);

      // Add all selected accounts as lines
      for (const account of selectedAccounts) {
        await api.npd.addLine({
          npdId,
          accountId: account.accountId,
          uraian: account.uraian,
          jumlah: account.jumlah,
        });
      }

      notifications.show({
        title: 'Berhasil',
        message: 'NPD berhasil dibuat sebagai draft. Silakan upload lampiran.',
        color: 'green',
      });

      // Don't reset form yet - allow file uploads
      // Don't redirect yet - let user upload files first
    } catch (error) {
      console.error('Error creating NPD:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Gagal membuat NPD. Silakan coba lagi.',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmit = async (values: NPDFormData) => {
    try {
      setIsSubmitting(true);

      if (!createdNpdId) {
        throw new Error('NPD belum dibuat');
      }

      // Submit NPD after files are uploaded
      await api.npd.submit({ npdId: createdNpdId });

      notifications.show({
        title: 'Berhasil',
        message: 'NPD dan lampiran berhasil disimpan. Mengalihkan ke daftar NPD...',
        color: 'green',
      });

      // Reset everything and redirect
      form.reset();
      setSelectedAccounts([]);
      setTotalJumlah(0);
      clearFiles();
      setCreatedNpdId(null);

      // Redirect to NPD list
      router.push('/npd');
    } catch (error) {
      console.error('Error in final submission:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Gagal menyimpan NPD. Silakan coba lagi.',
        color: 'red',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addAccount = () => {
    if (accountsLoading || !accounts || accounts.length === 0) return;

    const availableAccounts = accounts.filter(account =>
      !selectedAccounts.some(selected => selected.accountId === account._id)
    );

    if (availableAccounts.length === 0) {
      notifications.show({
        title: 'Info',
        message: 'Tidak ada akun yang tersedia',
        color: 'yellow',
      });
      return;
    }

    // For now, just add the first available account
    const accountToAdd = availableAccounts[0];
    setSelectedAccounts([...selectedAccounts, {
      accountId: accountToAdd._id,
      uraian: accountToAdd.uraian,
      jumlah: 0, // User will input this
    }]);
  };

  const removeAccount = (accountIdToRemove: string) => {
    setSelectedAccounts(selectedAccounts.filter(acc => acc.accountId !== accountIdToRemove));
  };

  const updateAccountAmount = (accountId: string, jumlah: number) => {
    setSelectedAccounts(selectedAccounts.map(acc =>
      acc.accountId === accountId ? { ...acc, jumlah } : acc
    ));
  };

  if (subkegiatansLoading || accountsLoading) {
    return (
      <LoadingOverlay visible />
    );
  }

  return (
    <Container size="xl" py="md">
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>Buat NPD Baru</Title>
          <Text color="dimmed">Buat Nota Pencairan Dana (NPD) untuk sub kegiatan terkait</Text>
        </div>
        <Button
          variant="outline"
          leftSection={<IconPlus size={16} />}
          onClick={() => router.push('/npd')}
        >
          Kembali ke Daftar NPD
        </Button>
      </Group>

      <Grid>
        <Grid.Col span={12}>
          <Card p="md" withBorder>
            <Card.Section>
              <Text weight={600} mb="md">Informasi NPD</Text>
            </Card.Section>

            <Card.Section withBorder inheritPadding={false}>
              <Stack gap="md">
                <Select
                  label="Jenis NPD"
                  placeholder="Pilih jenis NPD"
                  data={[
                    { value: 'UP', label: 'Uang Persediaan' },
                    { value: 'GU', label: 'Ganti Uang' },
                    { value: 'TU', label: 'Tunjangan Uang' },
                    { value: 'LS', label: 'Lanjutan Surat' },
                  ]}
                  {...form.getInputProps('jenis')}
                />

                <Select
                  label="Sub Kegiatan"
                  placeholder="Pilih sub kegiatan"
                  data={subkegiatans.map(sk => ({
                    value: sk._id,
                    label: `${sk.kode} - ${sk.nama}`,
                  }))}
                  {...form.getInputProps('subkegiatanId')}
                  searchable
                />

                <TextInput
                  label="Judul NPD"
                  placeholder="Masukkan judul NPD"
                  {...form.getInputProps('title')}
                />

                <NumberInput
                  label="Tahun Anggaran"
                  placeholder="Contoh: 2025"
                  thousandSeparator="."
                  {...form.getInputProps('tahun')}
                />

                <DateInput
                  label="Tanggal"
                  placeholder="Pilih tanggal"
                  valueFormat="DD MMMM YYYY"
                  {...form.getInputProps('tanggal', { type: 'default' })}
                />

                <TextInput
                  label="Catatan (opsional)"
                  placeholder="Tambahkan catatan jika diperlukan"
                  {...form.getInputProps('catatan')}
                />
              </Stack>
            </Card.Section>
          </Card>

          <Card p="md" withBorder>
            <Card.Section>
              <Group justify="space-between" mb="md">
                <Text weight={600}>Akun RKA</Text>
                <Button
                  variant="light"
                  size="sm"
                  leftSection={<IconPlus size={14} />}
                  onClick={addAccount}
                  disabled={selectedAccounts.length >= 5}
                >
                  Tambah Akun
                </Button>
              </Group>

              <Stack gap="sm">
                {selectedAccounts.length === 0 ? (
                  <Text color="dimmed" size="sm">
                    Pilih minimal satu akun RKA untuk dimasukkan dalam NPD
                  </Text>
                ) : (
                  selectedAccounts.map((account, index) => (
                    <Group key={account.accountId} gap="sm">
                      <NumberInput
                        size="sm"
                        thousandSeparator="."
                        precision={0}
                        value={account.jumlah}
                        onChange={(value) => updateAccountAmount(account.accountId, value || 0)}
                        hideControls
                        leftSection={
                          <TextInput
                            size="sm"
                            value={account.uraian}
                            readOnly
                            style={{ width: 200 }}
                          />
                        }
                        rightSection={
                          <Button
                            variant="light"
                            size="sm"
                            color="red"
                            onClick={() => removeAccount(account.accountId)}
                          >
                            <IconTrash size={14} />
                          </Button>
                        }
                      />

                      <Text size="xs" color="dimmed">
                        {account.uraian}
                      </Text>
                    </Group>
                  ))
                )}
              </Stack>

              <Divider />

              <Group justify="space-between">
                <div>
                  <Text weight={600}>Total Nilai: {formatCurrency(totalJumlah)}</Text>
                  {budgetWarnings.length > 0 && (
                    <Text size="xs" color="red" mt="xs">
                      {budgetWarnings.map((warning, index) => (
                        <div key={index}>⚠️ {warning}</div>
                      ))}
                    </Text>
                  )}
                </div>
                <Badge
                  color={totalJumlah > 0 ? 'green' : 'gray'}
                  variant="light"
                >
                  {selectedAccounts.length} Akun
                </Badge>
              </Group>
            </Card.Section>
          </Card>
        </Grid.Col>

        <Grid.Col span={12}>
          <Card p="md" withBorder>
            <Card.Section>
              <Group justify="space-between" mb="md">
                <Text weight={600}>Catatan & Lampiran</Text>
                <Badge
                  color={uploadedFiles.length > 0 ? 'green' : 'gray'}
                  variant="light"
                >
                  {uploadedFiles.length} File
                </Badge>
              </Group>
            </Card.Section>

            <Card.Section withBorder inheritPadding={false}>
              <TextInput
                label="Catatan"
                placeholder="Tambahkan catatan jika diperlukan"
                minRows={4}
                {...form.getInputProps('catatan')}
              />

              {/* File Upload Component */}
              <FileUpload
                value={uploadedFiles}
                onChange={setUploadedFiles}
                disabled={!createdNpdId || isSubmitting}
                maxFiles={5}
                maxSize={10 * 1024 * 1024} // 10MB
                className="mt-4"
              />

              <Group mt="md">
                <Button
                  variant="light"
                  leftSection={<IconFileUpload size={14} />}
                  rightSection={<IconCheck size={14} />}
                  disabled={!createdNpdId || isSubmitting || uploadedFiles.length === 0}
                  loading={isUploading}
                  onClick={() => {
                    if (createdNpdId && !isSubmitting && uploadedFiles.length > 0) {
                      // Final submission with files
                      handleFinalSubmit();
                    }
                  }}
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan NPD dengan Lampiran'}
                </Button>

                <Button
                  variant="outline"
                  disabled={!createdNpdId || isSubmitting}
                  onClick={clearFiles}
                >
                  Hapus Semua File
                </Button>
              </Group>

              <Alert icon={<IconAlertTriangle size={16} />} color="yellow">
                <Text size="sm">
                  <strong>Info:</strong> Upload lampiran wajib (RAB, BAST, Kontrak, dll) sesuai jenis NPD.
                  Pastikan semua file dalam kondisi terbaca dan tidak rusak.
                </Text>
              </Alert>
            </Card.Section>
          </Card>
        </Grid.Col>
      </Grid>

      <Group justify="flex-end" mt="xl">
        <Button
          size="lg"
          onClick={form.onSubmit(handleSubmit)}
          loading={isSubmitting}
          disabled={selectedAccounts.length === 0 || !createdNpdId}
          leftSection={<IconCheck size={18} />}
        >
          {isSubmitting
            ? 'Menyimpan...'
            : createdNpdId
              ? 'Simpan sebagai Final'
              : 'Simpan sebagai Draft'
          }
        </Button>
      </Group>
    </Container>
  );
}