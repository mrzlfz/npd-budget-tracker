'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Container,
  Title,
  Group,
  Card,
  Stack,
  Text,
  Badge,
  Button,
  Table,
  Divider,
  Alert,
  LoadingOverlay,
  SimpleGrid,
  Timeline,
  ActionIcon,
  Modal,
  TextInput,
  ScrollArea,
} from '@mantine/core'
import {
  IconArrowLeft,
  IconDownload,
  IconCheck,
  IconX,
  IconFileText,
  IconClock,
  IconUser,
  IconCalendar,
  IconCurrency,
} from '@tabler/icons-react'
import { useQuery } from 'convex/react'
import { api } from '../../../../convex/_generated/api'
import { usePermissions } from '@/hooks/usePermissions'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils/format'
import { notifications } from '@mantine/notifications'

interface NPDLine {
  _id: string
  npdId: string
  accountId: string
  uraian: string
  jumlah: number
  createdAt: number
  account: {
    kode: string
    uraian: string
    paguTahun: number
    realisasiTahun: number
    sisaPagu: number
  }
}

interface Attachment {
  _id: string
  npdId: string
  jenis: string
  url: string
  namaFile: string
  ukuran: number
  tipeMime: string
  keterangan?: string
  createdAt: number
}

interface NPDWithDetails {
  _id: string
  title: string
  description?: string
  documentNumber: string
  jenis: 'UP' | 'GU' | 'TU' | 'LS'
  status: 'draft' | 'diajukan' | 'diverifikasi' | 'final'
  subkegiatanId: string
  organizationId: string
  createdBy: string
  verifiedBy?: string
  verifiedAt?: number
  finalizedBy?: string
  finalizedAt?: number
  catatan?: string
  tahun: number
  createdAt: number
  updatedAt: number
  lines: NPDLine[]
  subkegiatan?: {
    kode: string
    nama: string
    uraian?: string
  }
  attachments: Attachment[]
  createdByUser?: {
    name?: string
    email: string
    role?: string
  }
  verifiedByUser?: {
    name?: string
    email: string
    role?: string
  }
  finalizedByUser?: {
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
    <Badge color={colors[status as keyof typeof colors] || 'gray'} size="lg">
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

  const labels = {
    UP: 'Uang Persediaan',
    GU: 'Ganti Uang',
    TU: 'Tunjangan Uang',
    LS: 'Lanjutan Surat',
  }

  return (
    <Badge color={colors[jenis as keyof typeof colors] || 'gray'} variant="outline">
      {labels[jenis as keyof typeof labels] || jenis}
    </Badge>
  )
}

function ActionButtons({
  npd,
  onVerify,
  onFinalize,
  onReject,
}: {
  npd: NPDWithDetails
  onVerify?: () => void
  onFinalize?: () => void
  onReject?: () => void
}) {
  const { canVerifyNPD, canApproveNPD } = usePermissions()
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      notifications.show({
        title: 'Error',
        message: 'Alasan penolakan harus diisi',
        color: 'red',
      })
      return
    }

    try {
      setLoading(true)
      await api.npd.reject({
        npdId: npd._id,
        catatanPenolakan: rejectReason,
      })
      notifications.show({
        title: 'Berhasil',
        message: 'NPD berhasil ditolak',
        color: 'green',
      })
      setRejectModalOpen(false)
      setRejectReason('')
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

  const buttons = []

  if (npd.status === 'diajukan' && canVerifyNPD && onVerify) {
    buttons.push(
      <Button
        key="verify"
        leftSection={<IconCheck size={16} />}
        onClick={onVerify}
        loading={loading}
        variant="filled"
        color="yellow"
      >
        Verifikasi
      </Button>
    )
  }

  if (npd.status === 'diajukan' && canVerifyNPD) {
    buttons.push(
      <Button
        key="reject"
        leftSection={<IconX size={16} />}
        onClick={() => setRejectModalOpen(true)}
        loading={loading}
        variant="outline"
        color="red"
      >
        Tolak
      </Button>
    )
  }

  if (npd.status === 'diverifikasi' && canApproveNPD && onFinalize) {
    buttons.push(
      <Button
        key="finalize"
        leftSection={<IconCheck size={16} />}
        onClick={onFinalize}
        loading={loading}
        variant="filled"
        color="green"
      >
        Finalisasi
      </Button>
    )
  }

  if (npd.status === 'diverifikasi' && canApproveNPD) {
    buttons.push(
      <Button
        key="reject-verified"
        leftSection={<IconX size={16} />}
        onClick={() => setRejectModalOpen(true)}
        loading={loading}
        variant="outline"
        color="red"
      >
        Tolak
      </Button>
    )
  }

  return (
    <>
      <Group>{buttons}</Group>

      <Modal
        opened={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Tolak NPD"
        size="md"
      >
        <Stack gap="md">
          <Text size="sm">
            Masukkan alasan penolakan NPD ini. Alasan akan dicatat dalam audit trail.
          </Text>

          <TextInput
            label="Alasan Penolakan"
            placeholder="Masukkan alasan penolakan..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
            minRows={3}
            maxRows={5}
            autosize
          />

          <Group justify="flex-end">
            <Button
              variant="outline"
              onClick={() => setRejectModalOpen(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button
              color="red"
              onClick={handleReject}
              loading={loading}
              disabled={!rejectReason.trim()}
            >
              Tolak NPD
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}

export default function NPDDetailPage() {
  const params = useParams()
  const router = useRouter()
  const npdId = params.id as string

  const { data: npd, isLoading } = useQuery({
    queryKey: ['npdDetail', npdId],
    queryFn: () => api.npd.getNPDWithLines({ npdId }),
  })

  const handleBack = () => {
    router.push('/npd')
  }

  const handleVerify = async () => {
    try {
      await api.npd.verify({ npdId })
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
    }
  }

  const handleFinalize = async () => {
    try {
      await api.npd.finalize({ npdId })
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
    }
  }

  if (isLoading) {
    return <LoadingOverlay visible />
  }

  if (!npd) {
    return (
      <Container size="xl" py="md">
        <Alert color="red" title="NPD Tidak Ditemukan">
          NPD yang anda cari tidak ditemukan atau anda tidak memiliki akses.
        </Alert>
      </Container>
    )
  }

  const totalNilai = npd.lines.reduce((sum, line) => sum + line.jumlah, 0)

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
            <Title order={2}>{npd.title}</Title>
            <Text color="dimmed" size="sm">
              {npd.documentNumber} • {formatDate(npd.createdAt)}
            </Text>
          </div>
        </Group>

        <ActionButtons
          npd={npd}
          onVerify={handleVerify}
          onFinalize={handleFinalize}
        />
      </Group>

      <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md" mb="lg">
        {/* Status Card */}
        <Card p="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="sm" weight={600}>Status</Text>
            <StatusBadge status={npd.status} />
          </Group>
          <Text size="lg" weight={600}>
            {npd.jenis} • Tahun {npd.tahun}
          </Text>
        </Card>

        {/* Total Value Card */}
        <Card p="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="sm" weight={600}>Total Nilai</Text>
            <IconCurrency size={20} color="blue" />
          </Group>
          <Text size="lg" weight={600} color="blue">
            {formatCurrency(totalNilai)}
          </Text>
        </Card>

        {/* Sub Kegiatan Card */}
        <Card p="md" withBorder>
          <Group justify="space-between" mb="xs">
            <Text size="sm" weight={600}>Sub Kegiatan</Text>
            <IconFileText size={20} color="gray" />
          </Group>
          <Text size="sm" weight={500}>
            {npd.subkegiatan?.nama}
          </Text>
          <Text size="xs" color="dimmed">
            {npd.subkegiatan?.kode}
          </Text>
        </Card>
      </SimpleGrid>

      {/* Main Content */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md">
        {/* Left Column - NPD Details */}
        <Stack gap="md">
          {/* NPD Information */}
          <Card p="md" withBorder>
            <Title order={4} mb="md">Informasi NPD</Title>
            <Stack gap="sm">
              <Group>
                <IconFileText size={16} color="gray" />
                <Text size="sm">
                  <strong>Jenis:</strong> <JenisBadge jenis={npd.jenis} />
                </Text>
              </Group>
              {npd.description && (
                <Text size="sm">
                  <strong>Deskripsi:</strong> {npd.description}
                </Text>
              )}
              {npd.catatan && (
                <Text size="sm">
                  <strong>Catatan:</strong> {npd.catatan}
                </Text>
              )}
            </Stack>
          </Card>

          {/* Line Items */}
          <Card p="md" withBorder>
            <Title order={4} mb="md">Rincian Akun</Title>
            <Table striped>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Kode Akun</Table.Th>
                  <Table.Th>Uraian</Table.Th>
                  <Table.Th>Nilai</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {npd.lines.map((line) => (
                  <Table.Tr key={line._id}>
                    <Table.Td>
                      <Text size="sm" weight={600}>
                        {line.account.kode}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={0}>
                        <Text size="sm">{line.uraian}</Text>
                        <Text size="xs" color="dimmed">
                          {line.account.uraian}
                        </Text>
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" weight={600}>
                        {formatCurrency(line.jumlah)}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
                <Table.Tr>
                  <Table.Th colSpan={2} ta="right">
                    <Text weight={600}>Total:</Text>
                  </Table.Th>
                  <Table.Td>
                    <Text size="lg" weight={600} color="blue">
                      {formatCurrency(totalNilai)}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              </Table.Tbody>
            </Table>
          </Card>

          {/* Attachments */}
          {npd.attachments.length > 0 && (
            <Card p="md" withBorder>
              <Title order={4} mb="md">Lampiran</Title>
              <Stack gap="sm">
                {npd.attachments.map((attachment) => (
                  <Group key={attachment._id} justify="space-between">
                    <div>
                      <Text size="sm" weight={500}>
                        {attachment.namaFile}
                      </Text>
                      <Text size="xs" color="dimmed">
                        {attachment.jenis} • {(attachment.ukuran / 1024 / 1024).toFixed(2)} MB
                      </Text>
                    </div>
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={() => window.open(attachment.url, '_blank')}
                    >
                      <IconDownload size={16} />
                    </ActionIcon>
                  </Group>
                ))}
              </Stack>
            </Card>
          )}
        </Stack>

        {/* Right Column - Status Timeline */}
        <Stack gap="md">
          {/* Status Timeline */}
          <Card p="md" withBorder>
            <Title order={4} mb="md">Timeline Status</Title>
            <Timeline>
              <Timeline.Item
                bullet={<IconFileText size={12} />}
                title="Dibuat"
              >
                <Text size="sm">
                  {npd.createdByUser?.name || npd.createdByUser?.email}
                </Text>
                <Text size="xs" color="dimmed">
                  {formatDateTime(npd.createdAt)}
                </Text>
              </Timeline.Item>

              {npd.verifiedAt && npd.verifiedByUser && (
                <Timeline.Item
                  bullet={<IconCheck size={12} />}
                  title="Diverifikasi"
                  color="yellow"
                >
                  <Text size="sm">
                    {npd.verifiedByUser.name || npd.verifiedByUser.email}
                  </Text>
                  <Text size="xs" color="dimmed">
                    {formatDateTime(npd.verifiedAt)}
                  </Text>
                </Timeline.Item>
              )}

              {npd.finalizedAt && npd.finalizedByUser && (
                <Timeline.Item
                  bullet={<IconCheck size={12} />}
                  title="Difinalisasi"
                  color="green"
                  lineVariant="dashed"
                >
                  <Text size="sm">
                    {npd.finalizedByUser.name || npd.finalizedByUser.email}
                  </Text>
                  <Text size="xs" color="dimmed">
                    {formatDateTime(npd.finalizedAt)}
                  </Text>
                </Timeline.Item>
              )}
            </Timeline>
          </Card>

          {/* People Information */}
          <Card p="md" withBorder>
            <Title order={4} mb="md">Informasi Pelaku</Title>
            <Stack gap="md">
              {npd.createdByUser && (
                <Group>
                  <IconUser size={16} color="blue" />
                  <div>
                    <Text size="sm" weight={600}>
                      {npd.createdByUser.name || npd.createdByUser.email}
                    </Text>
                    <Text size="xs" color="dimmed">
                      Pembuat • {npd.createdByUser.role}
                    </Text>
                  </div>
                </Group>
              )}

              {npd.verifiedByUser && (
                <Group>
                  <IconUser size={16} color="yellow" />
                  <div>
                    <Text size="sm" weight={600}>
                      {npd.verifiedByUser.name || npd.verifiedByUser.email}
                    </Text>
                    <Text size="xs" color="dimmed">
                      Verifikator • {npd.verifiedByUser.role}
                    </Text>
                  </div>
                </Group>
              )}

              {npd.finalizedByUser && (
                <Group>
                  <IconUser size={16} color="green" />
                  <div>
                    <Text size="sm" weight={600}>
                      {npd.finalizedByUser.name || npd.finalizedByUser.email}
                    </Text>
                    <Text size="xs" color="dimmed">
                      Finalisator • {npd.finalizedByUser.role}
                    </Text>
                  </div>
                </Group>
              )}
            </Stack>
          </Card>
        </Stack>
      </SimpleGrid>

      {/* Development Notice */}
      {process.env.NODE_ENV === 'development' && (
        <Alert color="blue" title="Mode Pengembangan" mt="lg">
          <Text size="sm">
            Halaman detail NPD menggunakan data dari Convex development environment.
            Dalam produksi, semua data akan real-time synchronization.
          </Text>
        </Alert>
      )}
    </Container>
  )
}