'use client'

import { useState, useEffect } from 'react'
import {
  Container,
  Title,
  Card,
  Table,
  ActionIcon,
  Group,
  Text,
  Badge,
  Button,
  Select,
  TextInput,
  NumberInput,
  LoadingOverlay,
  Alert,
  Modal,
  Stack,
  SimpleGrid,
  Divider,
} from '@mantine/core'
import {
  IconPlus,
  IconFileText,
  IconSearch,
  IconFilter,
  IconEye,
  IconCurrency,
  IconCalendar,
  IconCheck,
  IconRefresh,
} from '@tabler/icons-react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { usePermissions } from '@/hooks/usePermissions'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/format'
import { notifications } from '@mantine/notifications'

interface SP2DRecord {
  _id: string
  npdId: string
  noSPM?: string
  noSP2D: string
  tglSP2D: number
  nilaiCair: number
  catatan?: string
  createdAt: number
  updatedAt: number
  npd?: {
    documentNumber: string
    title: string
    status: string
    subkegiatan?: {
      kode: string
      nama: string
    }
  }
  createdByUser?: {
    name?: string
    email: string
    role?: string
  }
}

function StatusBadge({ status }: { status: string }) {
  const colors = {
    draft: 'gray',
    diajukan: 'blue',
    diverifikasi: 'yellow',
    final: 'green',
  }

  const labels = {
    draft: 'Draft',
    diajukan: 'Diajukan',
    diverifikasi: 'Diverifikasi',
    final: 'Final',
  }

  return (
    <Badge color={colors[status as keyof typeof colors] || 'gray'}>
      {labels[status as keyof typeof labels] || status}
    </Badge>
  )
}

export default function SP2DPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [currentPage, setCurrentPage] = useState(1)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [selectedNPD, setSelectedNPD] = useState<string | null>(null)

  const { canCreateSP2D } = usePermissions()

  // Get SP2D records
  const { data: sp2dRecords = [], isLoading } = useQuery({
    queryKey: ['sp2dRecords', status, tahun],
    queryFn: () => api.sp2d.list({
      status: status || undefined,
      tahun: tahun || undefined,
      paginationOpts: {
        numItems: 20,
        page: currentPage - 1,
      },
    }),
  })

  // Create SP2D mutation
  const createSP2D = useMutation(api.sp2d.create)

  // Filter data based on search
  const filteredData = sp2dRecords?.filter(record =>
    record.noSP2D.toLowerCase().includes(search.toLowerCase()) ||
    record.npd?.title.toLowerCase().includes(search.toLowerCase()) ||
    record.npd?.documentNumber.toLowerCase().includes(search.toLowerCase())
  ) || []

  const handleCreate = () => {
    setCreateModalOpen(true)
  }

  const handleView = (id: string) => {
    window.location.href = `/sp2d/${id}`
  }

  const handleCreateSP2D = async (npdId: string, data: any) => {
    try {
      await createSP2D({
        npdId,
        noSPM: data.noSPM,
        noSP2D: data.noSP2D,
        tglSP2D: data.tglSP2D.getTime(),
        nilaiCair: data.nilaiCair,
        catatan: data.catatan,
      })

      notifications.show({
        title: 'Berhasil',
        message: 'SP2D berhasil dibuat',
        color: 'green',
      })

      setCreateModalOpen(false)
      setSelectedNPD(null)
    } catch (error) {
      console.error('Error creating SP2D:', error)
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Gagal membuat SP2D',
        color: 'red',
      })
    }
  }

  // Generate fiscal years
  const fiscalYears = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i
    return { value: year, label: year.toString() }
  })

  return (
    <Container size="xl" py="md">
      <LoadingOverlay visible={isLoading} />

      {/* Header */}
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>Manajemen SP2D</Title>
          <Text color="dimmed" size="sm">
            Monitoring SP2D dan realisasi anggaran
          </Text>
        </div>

        {canCreateSP2D && (
          <Button
            onClick={handleCreate}
            leftSection={<IconPlus size={16} />}
          >
            SP2D Baru
          </Button>
        )}
      </Group>

      {/* Filters */}
      <SimpleGrid cols={{ base: 1, md: 4 }} spacing="md" mb="lg">
        <TextInput
          placeholder="Cari berdasarkan nomor SP2D atau judul NPD..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftSection={<IconSearch size={16} />}
          style={{ gridColumn: 'span 2' }}
        />

        <Select
          placeholder="Filter Status"
          data={[
            { value: '', label: 'Semua Status' },
            { value: 'draft', label: 'Draft' },
            { value: 'diajukan', label: 'Diajukan' },
            { value: 'diverifikasi', label: 'Diverifikasi' },
            { value: 'final', label: 'Final' },
          ]}
          value={status}
          onChange={(value) => setStatus(value || '')}
          clearable
          style={{ gridColumn: 'span 1' }}
        />

        <Select
          placeholder="Tahun Anggaran"
          data={fiscalYears}
          value={tahun}
          onChange={(value) => setTahun(value || null)}
          clearable
          style={{ gridColumn: 'span 1' }}
        />

        <Button
          variant="light"
          leftSection={<IconRefresh size={16} />}
          onClick={() => setCurrentPage(1)}
        >
          Refresh
        </Button>
      </SimpleGrid>

      {/* Results Summary */}
      <Group justify="space-between" mb="md">
        <Text size="sm" color="dimmed">
          Menampilkan {filteredData.length} dari {sp2dRecords?.length || 0} SP2D records
        </Text>
      </Group>

      {/* SP2D Table */}
      <Card p="md" withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Nomor SP2D</Table.Th>
              <Table.Th>Nomor NPD</Table.Th>
              <Table.Th>Judul NPD</Table.Th>
              <Table.Th>Status NPD</Table.Th>
              <Table.Th>Tanggal SP2D</Table.Th>
              <Table.Th>Nilai Cair</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Aksi</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredData.map((record) => (
              <Table.Tr key={record._id}>
                <Table.Td>
                  <Text size="sm" weight={600}>{record.noSP2D}</Text>
                </Table.Td>
                <Table.Td>
                  <Group gap="sm">
                    <div>
                      <Text size="sm" weight={500}>{record.npd?.title}</Text>
                      <Text size="xs" color="dimmed">
                        ({record.npd?.documentNumber})
                      </Text>
                    </div>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Group gap="sm">
                    <div>
                      <Text size="sm" weight={500}>{record.npd?.subkegiatan?.nama}</Text>
                      <Text size="xs" color="dimmed">
                        ({record.npd?.subkegiatan?.kode})
                      </Text>
                    </div>
                  </Group>
                </Table.Td>
                <Table.Td>
                  <StatusBadge status={record.npd?.status || 'unknown'} />
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{formatDate(record.tglSP2D)}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" weight={600}>{formatCurrency(record.nilaiCair)}</Text>
                </Table.Td>
                <Table.Td>
                  <StatusBadge status="draft" />
                </Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    <ActionIcon
                      variant="subtle"
                      color="blue"
                      onClick={() => handleView(record._id)}
                      title="Lihat Detail"
                    >
                      <IconEye size={16} />
                    </ActionIcon>
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Card>

      {/* Create SP2D Modal */}
      <Modal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Buat SP2D Baru"
        size="md"
      >
        <Stack gap="md">
          <Alert color="blue" title="Penting">
            <Text size="sm">
              Pilih NPD yang sudah <strong>Final</strong> untuk membuat SP2D.
              Nominal SP2D akan didistribusikan secara otomatis ke NPD lines.
            </Text>
          </Alert>

          <Select
            label="Pilih NPD"
            placeholder="Pilih NPD yang sudah final"
            data={sp2dRecords
              ?.filter(record => record.npd?.status === 'final')
              .map(record => ({
                value: record.npdId,
                label: `${record.npd?.documentNumber} - ${record.npd?.title}`,
              })) || []}
            value={selectedNPD}
            onChange={setSelectedNPD}
            searchable
            required
          />

          {selectedNPD && (
            <SimpleGrid cols={2} spacing="md">
              <NumberInput
                label="Nomor SP2D"
                placeholder="Masukkan nomor SP2D"
                required
              />

              <TextInput
                label="Nomor SPM (opsional)"
                placeholder="Masukkan nomor SPM"
              />

              <NumberInput
                label="Tanggal SP2D"
                placeholder="Pilih tanggal"
                required
                value={selectedNPD ? undefined : new Date().toISOString().split('T')[0]}
                render={({ field }) => (
                  <input
                    {...field}
                    type="date"
                  />
                )}
              />

              <NumberInput
                label="Nilai Cair"
                placeholder="Masukkan nominal yang dicairkan"
                required
                thousandSeparator="."
                precision={0}
              />

              <TextInput
                label="Catatan (opsional)"
                placeholder="Masukkan catatan"
                minRows={3}
              />
            </SimpleGrid>
          )}

          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              onClick={() => setCreateModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={() => selectedNPD && handleCreateSP2D(selectedNPD, {
                noSP2D: 'SP2D-' + Date.now().toString().slice(-6),
                tglSP2D: Date.now(),
                nilaiCair: 0, // Will be calculated from NPD total
              })}
              disabled={!selectedNPD}
              loading={createSP2D.isLoading}
            >
              Buat SP2D
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Development Notice */}
      {process.env.NODE_ENV === 'development' && (
        <Alert color="blue" title="Mode Pengembangan" mt="lg">
          <Text size="sm">
            Halaman SP2D menggunakan data dari Convex development environment.
            Dalam produksi, semua data akan real-time synchronization.
          </Text>
        </Alert>
      )}
    </Container>
  )
}