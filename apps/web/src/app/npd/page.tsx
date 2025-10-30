'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Title,
  Tabs,
  Table,
  ActionIcon,
  Group,
  Text,
  Badge,
  Button,
  Pagination,
  Stack,
  Card,
  TextInput,
  Select,
  LoadingOverlay,
  Alert,
  Flex,
} from '@mantine/core'
import {
  IconEye,
  IconEdit,
  IconCheck,
  IconX,
  IconRefresh,
  IconSearch,
  IconFilter,
} from '@tabler/icons-react'
import { useQuery } from 'convex/react'
import { api } from '../../../convex/_generated/api'
import { usePermissions } from '@/hooks/usePermissions'
import { formatCurrency, formatDate } from '@/lib/utils/format'
import { notifications } from '@mantine/notifications'

interface NPDItem {
  _id: string
  title: string
  documentNumber: string
  jenis: string
  status: 'draft' | 'diajukan' | 'diverifikasi' | 'final'
  tahun: number
  createdAt: number
  updatedAt: number
  createdByUser?: {
    name?: string
    email: string
  }
  subkegiatan?: {
    kode: string
    nama: string
  }
  // Line items total
  totalNilai?: number
}

interface TabPanelProps {
  status: string
  canView: boolean
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

function JenisBadge({ jenis }: { jenis: string }) {
  const colors = {
    UP: 'blue',
    GU: 'green',
    TU: 'orange',
    LS: 'purple',
  }

  return (
    <Badge color={colors[jenis as keyof typeof colors] || 'gray'} variant="outline">
      {jenis}
    </Badge>
  )
}

function NPDTable({
  data,
  onView,
  onEdit,
  onSubmit,
  onVerify,
  onFinalize,
  onReject,
  loading = false
}: {
  data: NPDItem[]
  onView: (id: string) => void
  onEdit?: (id: string) => void
  onSubmit?: (id: string) => void
  onVerify?: (id: string) => void
  onFinalize?: (id: string) => void
  onReject?: (id: string) => void
  loading?: boolean
}) {
  const { canCreateNPD, canVerifyNPD, canApproveNPD } = usePermissions()

  const getActionButtons = (npd: NPDItem) => {
    const buttons = []

    // View button for all
    buttons.push(
      <ActionIcon
        key="view"
        variant="subtle"
        color="blue"
        onClick={() => onView(npd._id)}
        title="Lihat Detail"
      >
        <IconEye size={16} />
      </ActionIcon>
    )

    // Edit button for draft
    if (npd.status === 'draft' && canCreateNPD && onEdit) {
      buttons.push(
        <ActionIcon
          key="edit"
          variant="subtle"
          color="yellow"
          onClick={() => onEdit(npd._id)}
          title="Edit"
        >
          <IconEdit size={16} />
        </ActionIcon>
      )
    }

    // Submit button for draft
    if (npd.status === 'draft' && canCreateNPD && onSubmit) {
      buttons.push(
        <ActionIcon
          key="submit"
          variant="subtle"
          color="blue"
          onClick={() => onSubmit(npd._id)}
          title="Ajukan"
        >
          <IconCheck size={16} />
        </ActionIcon>
      )
    }

    // Verify button for submitted
    if (npd.status === 'diajukan' && canVerifyNPD && onVerify) {
      buttons.push(
        <ActionIcon
          key="verify"
          variant="subtle"
          color="yellow"
          onClick={() => onVerify(npd._id)}
          title="Verifikasi"
        >
          <IconCheck size={16} />
        </ActionIcon>
      )
    }

    // Finalize button for verified
    if (npd.status === 'diverifikasi' && canApproveNPD && onFinalize) {
      buttons.push(
        <ActionIcon
          key="finalize"
          variant="subtle"
          color="green"
          onClick={() => onFinalize(npd._id)}
          title="Finalisasi"
        >
          <IconCheck size={16} />
        </ActionIcon>
      )
    }

    // Reject button for submitted/verified
    if ((npd.status === 'diajukan' || npd.status === 'diverifikasi') && canVerifyNPD && onReject) {
      buttons.push(
        <ActionIcon
          key="reject"
          variant="subtle"
          color="red"
          onClick={() => onReject(npd._id)}
          title="Tolak"
        >
          <IconX size={16} />
        </ActionIcon>
      )
    }

    return buttons
  }

  if (loading) {
    return <LoadingOverlay visible />
  }

  if (data.length === 0) {
    return (
      <Alert color="gray" title="Tidak ada data">
        Tidak ada NPD dengan status ini yang ditemukan.
      </Alert>
    )
  }

  return (
    <Table striped highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Nomor NPD</Table.Th>
          <Table.Th>Judul</Table.Th>
          <Table.Th>Jenis</Table.Th>
          <Table.Th>Sub Kegiatan</Table.Th>
          <Table.Th>Status</Table.Th>
          <Table.Th>Tahun</Table.Th>
          <Table.Th>Dibuat</Table.Th>
          <Table.Th>Aksi</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {data.map((npd) => (
          <Table.Tr key={npd._id}>
            <Table.Td>
              <Text size="sm" weight={600}>{npd.documentNumber}</Text>
            </Table.Td>
            <Table.Td>
              <Text size="sm">{npd.title}</Text>
            </Table.Td>
            <Table.Td>
              <JenisBadge jenis={npd.jenis} />
            </Table.Td>
            <Table.Td>
              <Stack gap={0}>
                <Text size="sm" weight={500}>
                  {npd.subkegiatan?.nama}
                </Text>
                <Text size="xs" c="dimmed">
                  {npd.subkegiatan?.kode}
                </Text>
              </Stack>
            </Table.Td>
            <Table.Td>
              <StatusBadge status={npd.status} />
            </Table.Td>
            <Table.Td>
              <Text size="sm">{npd.tahun}</Text>
            </Table.Td>
            <Table.Td>
              <Text size="xs">{formatDate(npd.createdAt)}</Text>
            </Table.Td>
            <Table.Td>
              <Group gap="xs">
                {getActionButtons(npd)}
              </Group>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}

function TabPanel({ status, canView }: TabPanelProps) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [tahun, setTahun] = useState<number | null>(new Date().getFullYear())
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['npds', status, tahun],
    queryFn: () => {
      if (!canView) return []
      return api.npd.list({
        status,
        tahun: tahun || undefined,
        paginationOpts: {
          numItems: 20,
          page: currentPage - 1,
        },
      })
    },
  })

  // Filter data based on search
  const filteredData = data?.filter(npd =>
    npd.title.toLowerCase().includes(search.toLowerCase()) ||
    npd.documentNumber.toLowerCase().includes(search.toLowerCase()) ||
    npd.subkegiatan?.nama.toLowerCase().includes(search.toLowerCase())
  ) || []

  const handleView = (id: string) => {
    router.push(`/npd/${id}`)
  }

  const handleEdit = (id: string) => {
    router.push(`/npd/builder?id=${id}`)
  }

  const handleSubmit = async (id: string) => {
    try {
      setLoading(true)
      await api.npd.submit({ npdId: id })
      notifications.show({
        title: 'Berhasil',
        message: 'NPD berhasil diajukan',
        color: 'green',
      })
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Gagal mengajukan NPD',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (id: string) => {
    try {
      setLoading(true)
      await api.npd.verify({ npdId: id })
      notifications.show({
        title: 'Berhasil',
        message: 'NPD berhasil diverifikasi',
        color: 'green',
      })
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Gagal memverifikasi NPD',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFinalize = async (id: string) => {
    try {
      setLoading(true)
      await api.npd.finalize({ npdId: id })
      notifications.show({
        title: 'Berhasil',
        message: 'NPD berhasil difinalisasi',
        color: 'green',
      })
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Gagal memfinalisasi NPD',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async (id: string) => {
    // TODO: Open reject modal with reason input
    const reason = prompt('Alasan penolakan:')
    if (!reason) return

    try {
      setLoading(true)
      await api.npd.reject({ npdId: id, catatanPenolakan: reason })
      notifications.show({
        title: 'Berhasil',
        message: 'NPD berhasil ditolak',
        color: 'green',
      })
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'Gagal menolak NPD',
        color: 'red',
      })
    } finally {
      setLoading(false)
    }
  }

  if (!canView) {
    return (
      <Alert color="red" title="Akses Ditolak">
        Anda tidak memiliki izin untuk melihat NPD dengan status ini.
      </Alert>
    )
  }

  return (
    <Stack gap="md">
      {/* Search and Filter */}
      <Flex gap="md" align="center">
        <TextInput
          placeholder="Cari berdasarkan judul atau nomor NPD..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftSection={<IconSearch size={16} />}
          style={{ flex: 1 }}
        />
        <Select
          placeholder="Tahun"
          data={Array.from({ length: 5 }, (_, i) => {
            const year = new Date().getFullYear() - i
            return { value: year, label: year.toString() }
          })}
          value={tahun}
          onChange={(value) => setTahun(value)}
          w={120}
          clearable
        />
        <Button
          variant="light"
          leftSection={<IconRefresh size={16} />}
          onClick={() => {
            // Refetch data
            setCurrentPage(1)
          }}
          loading={loading}
        >
          Refresh
        </Button>
      </Flex>

      {/* Results Summary */}
      <Group justify="space-between">
        <Text size="sm" c="dimmed">
          Menampilkan {filteredData.length} dari {data?.length || 0} NPD
        </Text>
      </Group>

      {/* Table */}
      <NPDTable
        data={filteredData}
        loading={isLoading}
        onView={handleView}
        onEdit={handleEdit}
        onSubmit={handleSubmit}
        onVerify={handleVerify}
        onFinalize={handleFinalize}
        onReject={handleReject}
      />

      {/* Pagination */}
      {filteredData.length > 20 && (
        <Group justify="center">
          <Pagination
            total={Math.ceil(filteredData.length / 20)}
            value={currentPage}
            onChange={setCurrentPage}
          />
        </Group>
      )}
    </Stack>
  )
}

export default function NPDListPage() {
  const router = useRouter()
  const { canCreateNPD } = usePermissions()

  const handleCreateNew = () => {
    router.push('/npd/builder')
  }

  // Define tabs based on roles
  const getTabs = () => {
    const { canVerifyNPD, canApproveNPD } = usePermissions()

    const allTabs = [
      { value: 'draft', label: 'Draft', canView: true },
      { value: 'diajukan', label: 'Diajukan', canView: canVerifyNPD },
      { value: 'diverifikasi', label: 'Diverifikasi', canView: canApproveNPD },
      { value: 'final', label: 'Final', canView: true },
    ]

    return allTabs.filter(tab => tab.canView)
  }

  const tabs = getTabs()

  return (
    <Container size="xl" py="md">
      <LoadingOverlay visible={false} />

      {/* Header */}
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>Daftar NPD</Title>
          <Text color="dimmed" size="sm">
            Kelola Nota Pencairan Dana (NPD) anda
          </Text>
        </div>

        {canCreateNPD && (
          <Button
            onClick={handleCreateNew}
            leftSection={<IconEdit size={16} />}
          >
            NPD Baru
          </Button>
        )}
      </Group>

      {/* Main Content */}
      <Card p="md" withBorder>
        <Tabs defaultValue={tabs[0]?.value}>
          <Tabs.List>
            {tabs.map((tab) => (
              <Tabs.Tab key={tab.value} value={tab.value}>
                {tab.label}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          {tabs.map((tab) => (
            <Tabs.Panel key={tab.value} value={tab.value}>
              <TabPanel status={tab.value} canView={tab.canView} />
            </Tabs.Panel>
          ))}
        </Tabs>
      </Card>

      {/* Development Notice */}
      {process.env.NODE_ENV === 'development' && (
        <Alert color="blue" title="Mode Pengembangan" mt="lg">
          <Text size="sm">
            Halaman ini menggunakan data dari Convex development environment.
            Dalam produksi, data akan real-time synchronization.
          </Text>
        </Alert>
      )}
    </Container>
  )
}