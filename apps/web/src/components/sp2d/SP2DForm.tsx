'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Stack,
  Group,
  Title,
  TextInput,
  NumberInput,
  DateInput,
  Select,
  Button,
  Divider,
  Text,
  Alert,
  SimpleGrid,
  LoadingOverlay,
  Tooltip,
} from '@mantine/core';
import {
  IconPlus,
  IconTrash,
  IconCalendar,
  IconFileDescription,
  IconCalculator,
  IconCurrency,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { Id } from 'convex/values';

interface SP2DLine {
  npdLineId: string;
  accountId: string;
  uraian: string;
  jumlah: number;
  jumlahDibayar: number;
  persentase: number;
}

interface SP2DFormProps {
  npdId: Id<'npdDocuments'>;
  onSuccess?: (sp2dId: Id<'sp2dRefs'>) => void;
  onClose?: () => void;
}

interface NPDLineInfo {
  _id: string;
  uraian: string;
  account: {
    _id: string;
    kode: string;
    uraian: string;
    sisaPagu: number;
  };
  jumlah: number;
}

export function SP2DForm({ npdId, onSuccess, onClose }: SP2DFormProps) {
  const [formData, setFormData] = useState({
    noSPM: '',
    noSP2D: '',
    tglSP2D: null as Date,
    nilaiCair: 0,
    catatan: '',
  });

  const [lines, setLines] = useState<SP2DLine[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [distributionType, setDistributionType] = useState<'proportional' | 'equal' | 'manual'>('proportional');

  // Get NPD details
  const { data: npd, isLoading: npdLoading } = useQuery(api.npd.getById, { npdId });

  // Get NPD lines
  const { data: npdLines, isLoading: linesLoading } = useQuery(api.npd.getLines, { npdId });

  // Create SP2D mutation
  const createSP2D = useMutation(api.sp2d.create);

  // Initialize lines when NPD data is loaded
  useEffect(() => {
    if (npd && npdLines && npdLines.length > 0 && lines.length === 0) {
      const initialLines: SP2DLine[] = npdLines.map(line => ({
        npdLineId: line._id,
        accountId: line.accountId,
        uraian: line.uraian,
        jumlah: line.jumlah,
        jumlahDibayar: 0,
        persentase: 0,
      }));

      setLines(initialLines);
    }
  }, [npd, npdLines, lines.length]);

  const calculateDistribution = () => {
    if (lines.length === 0) return;

    setIsCalculating(true);

    setTimeout(() => {
      const totalNilaiCair = formData.nilaiCair;
      const calculatedLines = lines.map(line => {
        let jumlahDibayar = 0;
        let persentase = 0;

        switch (distributionType) {
          case 'equal':
            // Equal distribution
            jumlahDibayar = totalNilaiCair / lines.length;
            persentase = 100 / lines.length;
            break;

          case 'proportional':
            // Proportional to line amount
            const totalJumlah = lines.reduce((sum, line) => sum + line.jumlah, 0);
            jumlahDibayar = (line.jumlah / totalJumlah) * totalNilaiCair;
            persentase = (line.jumlah / totalJumlah) * 100;
            break;

          case 'manual':
            // Keep manual values
            jumlahDibayar = line.jumlahDibayar;
            persentase = line.persentase;
            break;
        }

        return {
          ...line,
          jumlahDibayar,
          persentase: Number(persentase.toFixed(2)),
        };
      });

      setLines(calculatedLines);
      setIsCalculating(false);

      notifications.show({
        title: 'Perhitungan Selesai',
        message: 'Distribusi SP2D telah dihitung ulang',
        color: 'green',
      });
    }, 500);
  };

  const addLine = () => {
    if (!npdLines || npdLines.length === 0) return;

    const availableLines = npdLines.filter(
      npdLine => !lines.some(line => line.npdLineId === npdLine._id)
    );

    if (availableLines.length === 0) {
      notifications.show({
        title: 'Info',
        message: 'Semua baris NPD sudah ditambahkan',
        color: 'yellow',
      });
      return;
    }

    const lineToAdd = availableLines[0];
    const newLine: SP2DLine = {
      npdLineId: lineToAdd._id,
      accountId: lineToAdd.accountId,
      uraian: lineToAdd.uraian,
      jumlah: lineToAdd.jumlah,
      jumlahDibayar: 0,
      persentase: 0,
    };

    setLines([...lines, newLine]);
  };

  const removeLine = (indexToRemove: number) => {
    setLines(lines.filter((_, index) => index !== indexToRemove));
  };

  const updateLine = (indexToUpdate: number, field: 'jumlahDibayar' | 'persentase', value: number) => {
    const updatedLines = lines.map((line, index) => {
      if (index === indexToUpdate) {
        return { ...line, [field]: value };
      }
      return line;
    });

    setLines(updatedLines);
  };

  const validateForm = () => {
    const errors = [];

    if (!formData.noSPM || !formData.noSP2D || !formData.tglSP2D) {
      errors.push('Nomor SPM dan Nomor SP2D wajib diisi');
    }

    if (formData.nilaiCair <= 0) {
      errors.push('Nilai cair harus lebih dari 0');
    }

    if (lines.length === 0) {
      errors.push('Minimal satu baris NPD harus ditambahkan');
    }

    // Check if total distribution exceeds nilai cair
    const totalJumlahDibayar = lines.reduce((sum, line) => sum + (line.jumlahDibayar || 0), 0);
    if (totalJumlahDibayar > formData.nilaiCair) {
      errors.push('Total distribusi melebihi nilai cair');
    }

    return errors;
  };

  const handleSubmit = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      notifications.show({
        title: 'Validasi Gagal',
        message: errors.join(', '),
        color: 'red',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Create SP2D
      const sp2dId = await createSP2D({
        npdId,
        noSPM: formData.noSPM,
        noSP2D: formData.noSP2D,
        tglSP2D: formData.tglSP2D!.getTime(),
        nilaiCair: formData.nilaiCair,
        catatan: formData.catatan,
        distributionType,
      });

      // Create realization records
      // This would be handled by the SP2D creation backend

      notifications.show({
        title: 'Berhasil',
        message: 'SP2D berhasil dibuat',
        color: 'green',
      });

      onSuccess?.(sp2dId);
      onClose?.();
    } catch (error) {
      console.error('SP2D creation error:', error);
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Gagal membuat SP2D',
        color: 'red',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDistributionSummary = () => {
    const totalJumlah = lines.reduce((sum, line) => sum + line.jumlah, 0);
    const totalDibayar = lines.reduce((sum, line) => sum + (line.jumlahDibayar || 0), 0);
    const totalPersentase = lines.reduce((sum, line) => sum + (line.persentase || 0), 0);

    return {
      totalJumlah,
      totalDibayar,
      totalPersentase,
    };
  };

  if (npdLoading || linesLoading) {
    return (
      <Card p="md" withBorder h="400px">
        <LoadingOverlay visible />
      </Card>
    );
  }

  return (
    <Card p="md" withBorder>
      <Card.Section withBorder inheritPadding={false}>
        <Group justify="space-between" mb="md">
          <Title order={3}>Buat SP2D</Title>
          <Group>
            <Button
              variant="outline"
              onClick={onClose}
            >
              Tutup
            </Button>
          </Group>
        </Group>
      </Card.Section>

      {/* NPD Information */}
      <Card.Section withBorder inheritPadding={false}>
        <Title order={4}>Informasi NPD</Title>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <div>
            <Text fw={600}>Nomor NPD:</Text>
            <Text>{npd.documentNumber}</Text>
          </div>
          <div>
            <Text fw={600}>Jenis:</Text>
            <Text>{npd.jenis}</Text>
          </div>
          <div>
            <Text fw={600}>Total NPD:</Text>
            <Text>
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
              }).format(lines.reduce((sum, line) => sum + line.jumlah, 0))}
            </Text>
          </div>
        </SimpleGrid>
      </Card.Section>

      <Divider />

      {/* SP2D Form */}
      <Card.Section withBorder inheritPadding={false}>
        <Title order={4}>Informasi SP2D</Title>
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <TextInput
            label="Nomor SPM"
            placeholder="Masukkan nomor SPM"
            value={formData.noSPM}
            onChange={(e) => setFormData({ ...formData, noSPM: e.target.value })}
          />

          <TextInput
            label="Nomor SP2D"
            placeholder="Masukkan nomor SP2D"
            value={formData.noSP2D}
            onChange={(e) => setFormData({ ...formData, noSP2D: e.target.value })}
          />

          <DateInput
            label="Tanggal SP2D"
            placeholder="Pilih tanggal"
            value={formData.tglSP2D}
            onChange={(date) => setFormData({ ...formData, tglSP2D: date })}
            valueFormat="DD MMMM YYYY"
          />
        </SimpleGrid>

        <NumberInput
          label="Nilai Cair"
          placeholder="Masukkan nilai yang cair"
          thousandSeparator="."
          precision={0}
          value={formData.nilaiCair}
          onChange={(value) => setFormData({ ...formData, nilaiCair: value || 0 })}
          leftSection={<IconCurrency size={16} />}
        />

        <Textarea
          label="Catatan"
          placeholder="Masukkan catatan jika diperlukan"
          value={formData.catatan}
          onChange={(e) => setFormData({ ...formData, catatan: e.target.value })}
          minRows={2}
        />
      </Card.Section>

      {/* Distribution Type */}
      <Card.Section withBorder inheritPadding={false}>
        <Group mb="md">
          <Text fw={600}>Jenis Distribusi</Text>
          <Select
            value={distributionType}
            onChange={(value) => setDistributionType(value as 'proportional' | 'equal' | 'manual')}
            data={[
              { value: 'proportional', label: 'Proporsional (berdasarkan jumlah NPD)' },
              { value: 'equal', label: 'Rata-rata' },
              { value: 'manual', label: 'Manual' },
            ]}
          />
          <Button
            variant="outline"
            onClick={calculateDistribution}
            loading={isCalculating}
            disabled={lines.length === 0}
            leftSection={<IconCalculator size={16} />}
          >
            {isCalculating ? 'Menghitung...' : 'Hitung Distribusi'}
          </Button>
        </Group>
      </Card.Section>

      {/* NPD Lines Table */}
      <Card.Section withBorder inheritPadding={false}>
        <Group justify="space-between" mb="md">
          <Title order={4}>Baris NPD untuk Distribusi</Title>
          <Button
            variant="outline"
            size="sm"
            onClick={addLine}
            leftSection={<IconPlus size={14} />}
            disabled={lines.length >= (npdLines?.length || 0)}
          >
            Tambah Baris
          </Button>
        </Group>

        {lines.length === 0 ? (
          <Alert color="yellow">
            <Text>
              <strong>Info:</strong> Tambahkan baris NPD untuk memulai distribusi.
            </Text>
          </Alert>
        ) : (
          <Stack gap="sm">
            {lines.map((line, index) => (
              <Card key={index} p="sm" withBorder>
                <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="xs" align="center">
                  <div>
                    <Text size="xs" fw={600}>No</Text>
                  </div>
                  <div>
                    <Text size="xs" fw={600}>Kode</Text>
                  </div>
                  <div>
                    <Text size="xs" fw={600}>Uraian</Text>
                  </div>
                  <div>
                    <Text size="xs" fw={600}>Jumlah</Text>
                  </div>
                  <div>
                    <Text size="xs" fw={600}>Dibayar</Text>
                  </div>
                  <div>
                    <Text size="xs" fw={600}%</Text>
                  </div>
                  <div>
                    <Text size="xs" fw={600}>Aksi</Text>
                  </div>
                </SimpleGrid>

                <SimpleGrid cols={{ base: 1, sm: 4 }} spacing="xs" align="center">
                  <div>
                    <Text size="sm">{index + 1}</Text>
                  </div>
                  <div>
                    <Text size="sm">{line.account?.kode || '-'}</Text>
                  </div>
                  <div>
                    <Text size="sm">{line.uraian}</Text>
                  </div>
                  <div>
                    <Text size="sm">
                      {new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                      }).format(line.jumlah)}
                    </Text>
                  </div>
                  <div>
                    <NumberInput
                      size="sm"
                      thousandSeparator="."
                      precision={0}
                      value={line.jumlahDibayar || 0}
                      onChange={(value) => updateLine(index, 'jumlahDibayar', value || 0)}
                      disabled={distributionType !== 'manual'}
                    />
                  </div>
                  <div>
                    <Text size="sm">
                      {line.persentase || 0}%
                    </Text>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      color="red"
                      size="sm"
                      onClick={() => removeLine(index)}
                    >
                      <IconTrash size={12} />
                    </Button>
                  </div>
                </SimpleGrid>
              </Card>
            ))}

            {/* Distribution Summary */}
            <Card withBorder mt="md">
              <Title order={5}>Ringkasan Distribusi</Title>
              <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
                <div>
                  <Text fw={600}>Total Jumlah NPD:</Text>
                  <Text>
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                    }).format(getDistributionSummary().totalJumlah)}
                  </Text>
                </div>
                <div>
                  <Text fw={600}>Total Dibayar:</Text>
                  <Text>
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                    }).format(getDistributionSummary().totalDibayar)}
                  </Text>
                </div>
                <div>
                  <Text fw={600}>Nilai Cair:</Text>
                  <Text>
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                    }).format(formData.nilaiCair)}
                  </Text>
                </div>
                <div>
                  <Text fw={600}>Sisa:</Text>
                  <Text>
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                    }).format(formData.nilaiCair - getDistributionSummary().totalDibayar)}
                  </Text>
                </div>
              </SimpleGrid>
            </Card>
          </Stack>
        )}
      </Card.Section>

      <Card.Section withBorder inheritPadding={false}>
        <Group justify="flex-end">
          <Button
            variant="filled"
            color="green"
            onClick={handleSubmit}
            loading={isLoading}
            disabled={validateForm().length > 0}
          >
            {isLoading ? 'Menyimpan...' : 'Simpan SP2D'}
          </Button>
        </Group>
      </Card.Section>
    </Card>
  );
}