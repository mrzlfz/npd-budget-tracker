'use client'

import { useState, useEffect } from 'react'
import {
  Container,
  Title,
  Group,
  Card,
  Text,
  Badge,
  Button,
  Table,
  Stack,
  SimpleGrid,
  Divider,
  Alert,
  LoadingOverlay,
  Modal,
  TextInput,
  NumberInput,
} from '@mantine/core'
import {
  IconArrowLeft,
  IconEye,
  IconCurrency,
  IconFileText,
  IconCalendar,
  IconCalculator,
  IconDistribute,
  IconEdit,
} from '@tabler/icons-react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
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

interface NPDLine {
  _id: string
  npdId: string
  accountId: string
  uraian: string
  jumlah: number
  createdAt: number
  updatedAt: number
  account: {
    kode: string
    uraian: string
    paguTahun: number
    realisasiTahun: number
    sisaPagu: number
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
    <Badge color={colors[status as keyof typeof colors] || 'gray'} size="lg">
      {labels[status as keyof typeof labels] || status}
    </Badge>
  )
}

export default function SP2DDetailPage() {
  const params = useParams()
  const router = useRouter()
  const sp2dId = params.id as string

  const [distributeModalOpen, setDistributeModalOpen] = useState(false)
  const [distributionMap, setDistributionMap] = useState<Record<string, number>>({})

  // Get SP2D record
  const { data: sp2d, isLoading } = useQuery({
    queryKey: ['sp2dDetail', sp2dId],
    queryFn: () => api.sp2d.getByNPD({ npdId: sp2dId }),
  })

  // Get NPD details including lines
  const { data: npdDetail } = useQuery({
    queryKey: ['npdWithLines', sp2d?.npdId],
    queryFn: () => sp2d?.npdId ? api.npd.getNPDWithLines({ npdId: sp2d?.npdId }) : null,
    enabled: !!sp2d?.npdId,
  })

  const handleBack = () => {
    router.push('/sp2d')
  }

  const handleDistribute = () => {
    if (!npdDetail?.lines || npdDetail.lines.length === 0) {
      notifications.show({
        title: 'Error',
        message: 'NPD tidak memiliki baris untuk didistribusikan',
        color: 'red',
      })
      return
    }

    // Initialize distribution with current NPD lines
    const initialDistribution = npdDetail.lines.reduce((acc, line) => {
      acc[line._id] = 0 // Start with 0, user will adjust
      return acc
    }, {} as Record<string, number>)

    setDistributionMap(initialDistribution)
    setDistributeModalOpen(true)
  }

  const handleDistributionChange = (lineId: string, amount: number) => {
    const line = npdDetail?.lines?.find(l => l._id === lineId)
    if (!line) return

    // Check if amount exceeds available budget
    if (amount > line.account.sisaPagu) {
      notifications.show({
        title: 'Error',
        message: `Melebihi sisa pagu. Available: ${formatCurrency(line.account.sisaPagu)}, Requested: ${formatCurrency(amount)}`,
        color: 'red',
      })
      return
    }

    setDistributionMap(prev => ({
      ...prev,
      [lineId]: amount,
    }))
  }

  const executeDistribution = async () => {
    if (!npdDetail || !sp2d) {
      notifications.show({
        title: 'Error',
        message: 'Data SP2D atau NPD tidak lengkap',
        color: 'red',
      })
      return
    }

    // Validate total distribution matches SP2D amount
    const totalDistribution = Object.values(distributionMap).reduce((sum, amount) => sum + amount, 0)
    if (totalDistribution !== sp2d.nilaiCair) {
      notifications.show({
        title: 'Error',
        message: `Total distribusi (${formatCurrency(totalDistribution)}) harus sama dengan nilai cair SP2D (${formatCurrency(sp2d.nilaiCair)})`,
        color: 'red',
      })
      return
    }

    try {
      // Execute distribution mutation
      await api.sp2d.distributeToRealizations({
        sp2dId: sp2d._id,
        distributionMap,
      })

      notifications.show({
        title: 'Berhasil',
        message: 'Realisasi berhasil didistribusikan',
        color: 'green',
      })

      setDistributeModalOpen(false)
      setDistributionMap({})

      // Refresh data
      window.location.reload()
    } catch (error) {
      console.error('Error distributing SP2D:', error)
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Gagal mendistribusikan realisasi',
        color: 'red',
      })
    }
  }

  const getTotalDistributed = () => {
    return Object.values(distributionMap).reduce((sum, amount) => sum + amount, 0)
  }

  const getRemainingAmount = () => {
    return sp2d ? sp2d.nilaiCair - getTotalDistributed() : 0
  }

  if (isLoading) {
    return <LoadingOverlay visible />
  }

  if (!sp2d) {
    return (
      <Container size="xl" py="md">
        <Alert color="red" title="SP2D Tidak Ditemukan">
          SP2D yang anda cari tidak ditemukan atau anda tidak memiliki akses.
        </Alert>
      </Container>
    )
  }

  return (
    <Container size="xl" py="md">
      {/* Header */}
      <Group justify="space-between" mb="lg">
        <Group>
          <Button
            variant="outline"
            leftSection={<IconArrowLeft size={16} />}
            onClick={handleBack}
          >
            Kembali
          </Button>
          <div>
            <Title order={2}>Detail SP2D</Title>
            <Text color="dimmed" size="sm">
              {sp2d.noSP2D} • {formatDate(sp2d.tglSP2D)}
            </Text>
          </div>
        </Group>
      </Group>

      {/* SP2D Information */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mb="lg">
        <Card p="md" withBorder>
          <Title order={4} mb="md">Informasi SP2D</Title>
          <Stack gap="sm">
            <Group>
              <Text size="sm" weight={600}>Nomor SP2D:</Text>
              <Text size="lg" weight={600} color="blue">{sp2d.noSP2D}</Text>
            </Group>
            {sp2d.noSPM && (
              <Group>
                <Text size="sm" weight={600}>Nomor SPM:</Text>
                <Text size="lg">{sp2d.noSPM}</Text>
              </Group>
            )}
            <Group>
              <Text size="sm" weight={600}>Tanggal SP2D:</Text>
              <Text size="lg">{formatDate(sp2d.tglSP2D)}</Text>
            </Group>
            <Group>
              <Text size="sm" weight={600}>Nilai Cair:</Text>
              <Text size="lg" color="green">{formatCurrency(sp2d.nilaiCair)}</Text>
            </Group>
            {sp2d.catatan && (
              <Text>
                <Text size="sm" weight={600}>Catatan:</Text>
                <Text size="sm">{sp2d.catatan}</Text>
              </Text>
            )}
            <Group>
              <Text size="sm" weight={600}>Status:</Text>
              <StatusBadge status="draft" />
            </Group>
          </Stack>
        </Card>

        {/* NPD Reference */}
        {npdDetail && (
          <Card p="md" withBorder>
            <Title order={4} mb="md">Referensi NPD</Title>
            <Stack gap="sm">
              <Group>
                <Text size="sm" weight={600}>Nomor NPD:</Text>
                <Text size="lg" weight={600}>{npdDetail.title}</Text>
              </Group>
              <Group>
                <Text size="sm" weight={600}>Judul NPD:</Text>
                <Text size="lg">{npdDetail.title}</Text>
              </Group>
              <Group>
                <Text size="sm" weight={600}>Status NPD:</Text>
                <StatusBadge status={npdDetail.status || 'unknown'} />
              </Group>
              {npdDetail.subkegiatan && (
                <Group>
                  <Text size="sm" weight={600}>Sub Kegiatan:</Text>
                  <Text size="lg">{npdDetail.subkegiatan.nama}</Text>
                  <Text size="sm" color="dimmed">({npdDetail.subkegiatan.kode})</Text>
                </Group>
              )}
            </Stack>
          </Card>
        )}

        {/* Distribution Calculator */}
        {npdDetail && (
          <Card p="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={4}>Distribusi Realisasi</Title>
              <Button
                variant="filled"
                leftSection={<IconDistribute size={16} />}
                onClick={handleDistribute}
                disabled={!npdDetail.lines || npdDetail.lines.length === 0}
              >
                {distributeModalOpen ? 'Batal Distribusi' : 'Mulai Distribusi'}
              </Button>
            </Group>

            {npdDetail.lines && npdDetail.lines.length > 0 && (
              <Text size="sm" color="dimmed">
                Bagi nominal SP2D ({formatCurrency(sp2d.nilaiCair)}) ke {npdDetail.lines.length} baris NPD.
                Alokasikan nominal untuk setiap baris di bawah.
              </Text>
            )}
          </Card>
        )}
      </SimpleGrid>

      {/* NPD Lines Table */}
      {npdDetail && npdDetail.lines && npdDetail.lines.length > 0 && (
        <Card p="md" withBorder>
          <Title order={4} mb="md">Baris NPD untuk Distribusi</Title>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Akun</Table.Th>
                <Table.Th>Uraian NPD</Table.Th>
                <Table.Th>Pagu Tahun</Table.Th>
                <Table.Th>Sisa Pagu</Table.Th>
                <Table.Th>Alokasi</Table.Th>
                <Table.Th>Sisa Setelah</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {npdDetail.lines.map((line) => (
                <Table.Tr key={line._id}>
                  <Table.Td>
                    <Text size="sm" weight={600}>{line.account.kode}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{line.uraian}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">{formatCurrency(line.account.paguTahun)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" color="green">{formatCurrency(line.account.sisaPagu)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <NumberInput
                      size="sm"
                      thousandSeparator="."
                      precision={0}
                      value={distributionMap[line._id] || 0}
                      onChange={(value) => handleDistributionChange(line._id, value || 0)}
                      min={0}
                      max={line.account.sisaPagu}
                      style={{ width: '120px' }}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" color="blue">
                      {formatCurrency(line.account.sisaPagu - (distributionMap[line._id] || 0))}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Card>
      )}

      {/* Distribution Summary */}
      {distributeModalOpen && npdDetail && (
        <Card p="md" withBorder>
          <Title order={4} mb="md">Ringkasan Distribusi</Title>
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="lg" weight={600}>Total SP2D:</Text>
              <Text size="lg" color="green">{formatCurrency(sp2d.nilaiCair)}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="lg" weight={600}>Total Dialokasikan:</Text>
              <Text size="lg" color="blue">{formatCurrency(getTotalDistributed())}</Text>
            </Group>
            <Group justify="space-between">
              <Text size="lg" weight={600}>Sisa:</Text>
              <Text size="lg" color="orange">{formatCurrency(getRemainingAmount())}</Text>
            </Group>
          </Stack>
        </Card>
      )}

      {/* Distribution Execution */}
      {distributeModalOpen && npdDetail && (
        <Modal
          opened={distributeModalOpen}
          onClose={() => setDistributeModalOpen(false)}
          title="Konfirmasi Distribusi Realisasi"
          size="md"
        >
          <Stack gap="md">
            <Alert color="yellow" title="Konfirmasi">
              <Text size="sm">
                Anda akan mendistribusikan realisasi sebesar <strong>{formatCurrency(getTotalDistributed())}</strong> dari SP2D {sp2d.noSP2D}.
                Aksi ini akan memperbarui sisa pagu akun dan menambahkan ke realisasi tahunan.
              </Text>
            </Alert>

            <Group justify="flex-end" mt="md">
              <Button
                variant="outline"
                onClick={() => setDistributeModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                color="green"
                onClick={executeDistribution}
              >
                Ya, Distribusikan
              </Button>
            </Group>
          </Stack>
        </Modal>
      )}

      {/* Development Notice */}
      {process.env.NODE_ENV === 'development' && (
        <Alert color="blue" title="Mode Pengembangan" mt="lg">
          <Text size="sm">
            Halaman detail SP2D menggunakan data dari Convex development environment.
            Dalam produksi, semua data akan real-time synchronization.
          </Text>
        </Alert>
      )}
    </Container>
  )
}