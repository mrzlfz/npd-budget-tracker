'use client'

import { useState, useEffect } from 'react'
import {
  Container,
  Title,
  Tabs,
  Card,
  Stack,
  Text,
  Button,
  SimpleGrid,
  Group,
  Badge,
  LoadingOverlay,
  Alert,
  NumberInput,
  TextInput,
  Select,
  ActionIcon,
  Progress,
  Table,
} from '@mantine/core'
import {
  IconPlus,
  IconBarChart,
  IconFileText,
  IconUpload,
  IconEdit,
  IconTrash,
  IconEye,
  IconCalendar,
  IconTarget,
  IconTrendingUp,
} from '@tabler/icons-react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { usePermissions } from '@/hooks/usePermissions'
import { formatCurrency, formatDate, formatNumber } from '@/lib/utils/format'
import { notifications } from '@mantine/notifications'

interface PerformanceLog {
  _id: string
  subkegiatanId: string
  indikatorNama: string
  target: number
  realisasi: number
  satuan: string
  periode: string
  buktiURL?: string
  buktiType?: string
  buktiName?: string
  keterangan?: string
  approvalStatus: string
  createdAt: number
  createdBy: string
}

interface PerformanceSummary {
  indikatorNama: string
  totalTarget: number
  totalRealisasi: number
  avgTarget: number
  avgRealisasi: number
  persenCapaian: number
  persenCapaianTerakhir: number
  jumlahLogs: number
}

interface SubkegiatanWithLogs {
  _id: string
  kode: string
  nama: string
  uraian?: string
  fiscalYear: number
  performanceLogs: PerformanceLog[]
  performanceSummary: PerformanceSummary[]
}

function ProgressRing({ percentage, color }: { percentage: number; color: string }) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-12 h-12 transform -rotate-90">
        <circle
          cx="24"
          cy="24"
          r="20"
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${2 * Math.PI * 20}`}
          strokeDashoffset={`${2 * Math.PI * 20} * (1 - percentage / 100)}`}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <Text size="sm" weight={600} c={color}>
          {Math.round(percentage)}%
        </Text>
      </div>
    </div>
  )
}

function LogStatusBadge({ status }: { status: string }) {
  const colors = {
    draft: 'gray',
    submitted: 'blue',
    approved: 'green',
  }

  const labels = {
    draft: 'Draft',
    submitted: 'Diajukan',
    approved: 'Disetujui',
  }

  return (
    <Badge color={colors[status as keyof typeof colors] || 'gray'} variant="outline">
      {labels[status as keyof typeof labels] || status}
    </Badge>
  )
}

export default function PerformancePage() {
  const [selectedSubkegiatan, setSelectedSubkegiatan] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [periode, setPeriode] = useState('')
  const [tahun, setTahun] = useState(new Date().getFullYear())

  const { canCreatePerformance } = usePermissions()

  // Get subkegiatan data
  const { data: subkegiatanList = [], isLoading: subkegiatanLoading } = useQuery({
    queryKey: ['subkegiatanList', tahun],
    queryFn: () => api.rkaAccounts.getSubkegiatans({
      fiscalYear: tahun,
    }),
  })

  // Get performance data for selected subkegiatan
  const { data: performanceData, isLoading: performanceLoading } = useQuery({
    queryKey: ['performanceData', selectedSubkegiatan, periode],
    queryFn: () => selectedSubkegiatan ?
      api.performance.getBySubkegiatan({
        subkegiatanId: selectedSubkegiatan,
        periode: periode || undefined,
        tahun: tahun || undefined,
      }) : null,
    enabled: !!selectedSubkegiatan,
  })

  // Generate fiscal years
  const fiscalYears = Array.from({ length: 5 }, (_, i) => {
    const year = new Date().getFullYear() - i
    return { value: year, label: year.toString() }
  })

  const periodeOptions = [
    { value: '', label: 'Semua Periode' },
    { value: 'TW1', label: 'Triwulan I' },
    { value: 'TW2', label: 'Triwulan II' },
    { value: 'TW3', label: 'Triwulan III' },
    { value: 'TW4', label: 'Triwulan IV' },
    { value: 'Bulan 1', label: 'Januari' },
    { value: 'Bulan 2', label: 'Februari' },
    // ... bisa tambahkan bulan lainnya
  ]

  const handleCreateLog = () => {
    if (!selectedSubkegiatan) {
      notifications.show({
        title: 'Info',
        message: 'Pilih sub kegiatan terlebih dahulu',
        color: 'yellow',
      })
      return
    }

    // Navigate to create log page
    window.location.href = `/performance/log/create?subkegiatanId=${selectedSubkegiatan}`
  }

  const handleViewEvidence = (url?: string) => {
    if (url) {
      window.open(url, '_blank')
    }
  }

  const handleEditLog = (logId: string) => {
    window.location.href = `/performance/log/${logId}/edit`
  }

  if (subkegiatanLoading) {
    return <LoadingOverlay visible />
  }

  return (
    <Container size="xl" py="md">
      {/* Header */}
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>Manajemen Kinerja</Title>
          <Text color="dimmed" size="sm">
            Monitoring dan evaluasi capaian kinerja sub kegiatan
          </Text>
        </div>
        {canCreatePerformance && (
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleCreateLog}
          >
            Log Kinerja Baru
          </Button>
        )}
      </Group>

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {/* Left Column - Sub Kegiatan Selection */}
        <Card p="md" withBorder>
          <Title order={4} mb="md">Sub Kegiatan</Title>
          <Stack gap="md">
            <Select
              label="Tahun Anggaran"
              placeholder="Pilih tahun"
              data={fiscalYears}
              value={tahun}
              onChange={(value) => setTahun(value || null)}
              w="100%"
            />

            <Select
              label="Sub Kegiatan"
              placeholder="Pilih sub kegiatan"
              data={subkegiatanList.map(sk => ({
                value: sk._id,
                label: `${sk.kode} - ${sk.nama}`,
              }))}
              value={selectedSubkegiatan}
              onChange={setSelectedSubkegiatan}
              w="100%"
              searchable
            />

            {selectedSubkegiatan && (
              <Button
                variant="outline"
                fullWidth
                onClick={() => setActiveTab('logs')}
                leftSection={<IconBarChart size={16} />}
              >
                Lihat Kinerja
              </Button>
            )}
          </Stack>
        </Card>

        {/* Right Column - Performance Data */}
        {selectedSubkegiatan && (
          <Card p="md" withBorder>
            <Group justify="space-between" mb="md">
              <Title order={4}>Kinerja: {subkegiatanList.find(sk => sk._id === selectedSubkegiatan)?.nama}</Title>
              <Select
                placeholder="Pilih periode"
                data={periodeOptions}
                value={periode}
                onChange={setPeriode}
                w={200}
                leftSection={<IconCalendar size={16} />}
              />
            </Group>

            <Tabs value={activeTab} onChange={setActiveTab}>
              <Tabs.List>
                <Tabs.Tab value="dashboard">Dashboard</Tabs.Tab>
                <Tabs.Tab value="logs">Log Details</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel value="dashboard">
                {performanceLoading ? (
                  <LoadingOverlay visible />
                ) : performanceData ? (
                  <Stack gap="md">
                    {/* Performance Summary Cards */}
                    <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mb="lg">
                      {performanceData.performanceSummary.map((summary, index) => (
                        <Card p="md" withBorder key={index}>
                          <Group justify="space-between" mb="xs">
                            <Text size="sm" weight={600}>{summary.indikatorNama}</Text>
                            <Badge
                              color={summary.persenCapaian >= 100 ? 'green' : summary.persenCapaian >= 80 ? 'yellow' : 'red'}
                            >
                              {Math.round(summary.persenCapaian)}%
                            </Badge>
                          </Group>

                          <Stack gap="xs">
                            <Group justify="space-between">
                              <Text size="xs" c="dimmed">Target vs Realisasi</Text>
                              <Text size="sm" weight={600}>
                                {formatNumber(summary.totalTarget)} / {formatNumber(summary.totalRealisasi)}
                              </Text>
                            </Group>

                            <Progress
                              value={summary.persenCapaian}
                              color={summary.persenCapaian >= 100 ? 'green' : summary.persenCapaian >= 80 ? 'yellow' : 'red'}
                              size="md"
                            />
                          </Stack>

                          <Group justify="space-between">
                            <Text size="xs" c="dimmed">Rata-rata</Text>
                            <Text size="sm" weight={600}>
                              {formatNumber(summary.avgTarget)} / {formatNumber(summary.avgRealisasi)}
                            </Text>
                          </Group>

                          <Text size="xs" c="dimmed">
                            {summary.jumlahLogs} log entries
                          </Text>

                          {summary.persenCapaianTerakhir !== undefined && (
                            <Text size="xs" color="dimmed" mt="sm">
                              Trend: {summary.persenCapaianTerakhir > 50 ? '📈' : '📉'} ({Math.round(summary.persenCapaianTerakhir - summary.persenCapaian)}%)
                            </Text>
                          )}
                        </Card>
                      ))}
                    </SimpleGrid>

                    {/* Visual Charts */}
                    <Card p="md" withBorder>
                      <Title order={5} mb="md">Visualisasi Capaian</Title>
                      <Text size="sm" color="dimmed" mb="lg">
                        Grafik pencapaian kinerja berdasarkan indikator yang tersedia
                      </Text>

                      {/* Placeholder for charts - akan diimplementasikan dengan Recharts */}
                      <Stack align="center" gap="md">
                        <Text size="lg" color="dimmed">
                          📊 Chart Component akan diimplementasikan
                        </Text>
                        <Text size="sm" color="dimmed">
                          Menggunakan data kinerja untuk visualisasi real-time
                        </Text>
                      </Stack>
                    </Card>
                  </Stack>
                ) : (
                  <Alert color="blue" title="Data Tidak Tersedia">
                    Pilih sub kegiatan untuk melihat data kinerja.
                  </Alert>
                )}
              </Tabs.Panel>

              <Tabs.Panel value="logs">
                {performanceLoading ? (
                  <LoadingOverlay visible />
                ) : performanceData && performanceData.performanceLogs.length > 0 ? (
                  <Card p="md" withBorder>
                    <Title order={5} mb="md">Log Kinerja Detail</Title>

                    <Table striped highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Indikator</Table.Th>
                          <Table.Th>Target</Table.Th>
                          <Table.Th>Realisasi</Table.Th>
                          <Table.Th>% Capaian</Table.Th>
                          <Table.Th>Periode</Table.Th>
                          <Table.Th>Status</Table.Th>
                          <Table.Th>Bukti</Table.Th>
                          <Table.Th>Aksi</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {performanceData.performanceLogs.map((log) => (
                          <Table.Tr key={log._id}>
                            <Table.Td>
                              <Text size="sm" weight={600}>{log.indikatorNama}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{formatNumber(log.target)} {log.satuan}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm" weight={600}>{formatNumber(log.realisasi)} {log.satuan}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm" weight={600}>
                                {Math.round((log.realisasi / log.target) * 100)}%
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{log.periode}</Text>
                            </Table.Td>
                            <Table.Td>
                              <LogStatusBadge status={log.approvalStatus} />
                            </Table.Td>
                            <Table.Td>
                              {log.buktiURL && (
                                <ActionIcon
                                  variant="light"
                                  color="blue"
                                  size="sm"
                                  onClick={() => handleViewEvidence(log.buktiURL)}
                                  title="Lihat Bukti"
                                >
                                  <IconEye size={14} />
                                </ActionIcon>
                              )}
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                <ActionIcon
                                  variant="subtle"
                                  color="yellow"
                                  size="sm"
                                  onClick={() => handleEditLog(log._id)}
                                  title="Edit"
                                >
                                  <IconEdit size={14} />
                                </ActionIcon>
                                {/* Delete button bisa ditambahkan */}
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Card>
                ) : (
                  <Alert color="yellow" title="Belum Ada Log">
                    Belum ada log kinerja untuk sub kegiatan yang dipilih.
                    Buat log kinerja pertama dengan klik tombol "Log Kinerja Baru".
                  </Alert>
                )}
              </Tabs.Panel>
            </Tabs>
          </Card>
        )}

        {/* State ketika belum ada sub kegiatan yang dipilih */}
        {!selectedSubkegiatan && (
          <Card p="md" withBorder>
            <Stack align="center" gap="md">
              <IconFileText size={64} color="gray" />
              <Text size="lg" color="dimmed" ta="center">
                Pilih Sub Kegiatan
              </Text>
              <Text size="sm" color="dimmed" ta="center">
                untuk memulai monitoring kinerja
              </Text>
            </Stack>
          </Card>
        )}
      </SimpleGrid>

      {/* Development Notice */}
      {process.env.NODE_ENV === 'development' && (
        <Alert color="blue" title="Mode Pengembangan" mt="lg">
          <Text size="sm">
            Halaman performance monitoring menggunakan data dari Convex development environment.
            Dalam produksi, semua data akan real-time synchronization.
          </Text>
        </Alert>
      )}
    </Container>
  )
}