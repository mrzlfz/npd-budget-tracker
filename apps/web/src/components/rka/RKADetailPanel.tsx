'use client'

import React, { useState } from 'react'
import {
  Card,
  Stack,
  Group,
  Title,
  Text,
  Badge,
  Button,
  Divider,
  Progress,
  Tooltip,
  ActionIcon,
  Grid,
  SimpleGrid,
} from '@mantine/core'
import {
  IconEdit,
  IconTrash,
  IconFileText,
  IconCurrency,
  IconPlus,
  IconChartLine,
  IconDownload,
  IconEye,
} from '@tabler/icons-react'
import { formatCurrency } from '@/lib/utils/format'
import { usePermissions } from '@/hooks/usePermissions'
import type { RKANode } from './RKATree'

interface RKADetailPanelProps {
  node: RKANode | null
  onClose?: () => void
  onEdit?: (node: RKANode) => void
  onDelete?: (node: RKANode) => void
  onCreateNPD?: (node: RKANode) => void
}

export function RKADetailPanel({ node, onClose, onEdit, onDelete, onCreateNPD }: RKADetailPanelProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'children' | 'npd'>('info')
  const { canCreateNPD, canUpdateRKA, canDeleteRKA } = usePermissions()

  if (!node) {
    return (
      <Card p="lg" withBorder style={{ minHeight: 400 }}>
        <Stack align="center" justify="center" h={400}>
          <Text color="dimmed">Pilih node untuk melihat detail</Text>
          <Button onClick={onClose} variant="light">
            Tutup
          </Button>
        </Stack>
      </Card>
    )
  }

  const getProgressColor = (pagu: number, realisasi: number) => {
    const percentage = pagu > 0 ? (realisasi / pagu) * 100 : 0
    if (percentage >= 100) return 'red'
    if (percentage >= 80) return 'yellow'
    if (percentage >= 50) return 'blue'
    return 'green'
  }

  const getProgressPercentage = (pagu: number, realisasi: number) => {
    return pagu > 0 ? Math.round((realisasi / pagu) * 100) : 0
  }

  const renderInfoTab = () => {
    return (
      <Stack gap="md">
        {/* Header Info */}
        <Group justify="space-between" mb="md">
          <div>
            <Title order={4}>Informasi {node.type === 'program' ? 'Program' : node.type === 'kegiatan' ? 'Kegiatan' : node.type === 'subkegiatan' ? 'Sub Kegiatan' : 'Akun'}</Title>
            <Badge
              color={node.status === 'active' ? 'green' : 'gray'}
              variant="light"
              size="lg"
            >
              {node.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
            </Badge>
          </div>
          <Group>
            {canUpdateRKA && (
              <Tooltip label="Edit">
                <ActionIcon
                  size="lg"
                  variant="light"
                  onClick={() => onEdit?.(node)}
                >
                  <IconEdit size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            {canDeleteRKA && (
              <Tooltip label="Hapus">
                <ActionIcon
                  size="lg"
                  variant="light"
                  color="red"
                  onClick={() => onDelete?.(node)}
                >
                  <IconTrash size={16} />
                </ActionIcon>
              </Tooltip>
            )}
            <Button onClick={onClose} variant="outline">
              Tutup
            </Button>
          </Group>
        </Group>

        {/* Kode and Nama */}
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <div>
            <Text size="sm" color="dimmed" mb={4}>Kode</Text>
            <Text size="lg" weight={600}>{node.kode}</Text>
          </div>
          <div>
            <Text size="sm" color="dimmed" mb={4}>
              {node.type === 'account' ? 'Uraian' : 'Nama'}
            </Text>
            <Text size="lg" weight={600}>
              {node.nama || node.uraian}
            </Text>
          </div>
        </SimpleGrid>

        {/* Description */}
        {'uraian' in node && node.uraian && (
          <div>
            <Text size="sm" color="dimmed" mb={4}>Deskripsi</Text>
            <Text>{node.uraian}</Text>
          </div>
        )}

        {/* Budget Information */}
        <Divider />
        <Title order={5}>Informasi Anggaran</Title>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <div>
            <Text size="sm" color="dimmed" mb={4}>Total Pagu</Text>
            <Text size="lg" weight={600} color="blue">
              {formatCurrency(node.totalPagu || node.paguTahun || 0)}
            </Text>
          </div>
          <div>
            <Text size="sm" color="dimmed" mb={4}>Realisasi</Text>
            <Text size="lg" weight={600} color="green">
              {formatCurrency(node.totalRealisasi || node.realisasiTahun || 0)}
            </Text>
          </div>
          <div>
            <Text size="sm" color="dimmed" mb={4}>Sisa Pagu</Text>
            <Text size="lg" weight={600} color="orange">
              {formatCurrency(node.totalSisa || node.sisaPagu || 0)}
            </Text>
          </div>
        </SimpleGrid>

        {/* Progress Bar */}
        <div>
          <Text size="sm" color="dimmed" mb={8}>Progress Realisasi</Text>
          <Progress
            value={getProgressPercentage(node.totalPagu || node.paguTahun || 0, node.totalRealisasi || node.realisasiTahun || 0)}
            color={getProgressColor(node.totalPagu || node.paguTahun || 0, node.totalRealisasi || node.realisasiTahun || 0)}
            size="md"
            radius="md"
          />
          <Group justify="space-between" mt={4}>
            <Text size="sm" color="dimmed">
              {getProgressPercentage(node.totalPagu || node.paguTahun || 0, node.totalRealisasi || node.realisasiTahun || 0)}%
            </Text>
            <Badge
              color={getProgressColor(node.totalPagu || node.paguTahun || 0, node.totalRealisasi || node.realisasiTahun || 0)}
              variant="light"
            >
              {getProgressPercentage(node.totalPagu || node.paguTahun || 0, node.totalRealisasi || node.realisasiTahun || 0) >= 100 ? 'Over Budget' :
               getProgressPercentage(node.totalPagu || node.paguTahun || 0, node.totalRealisasi || node.realisasiTahun || 0) >= 80 ? 'High Utilization' : 'Normal'}
            </Badge>
          </Group>
        </div>

        {/* Additional Info for specific types */}
        {node.type === 'subkegiatan' && (
          <>
            <Divider />
            <Title order={5}>Indikator Output</Title>
            <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
              <div>
                <Text size="sm" color="dimmed" mb={4}>Target Output</Text>
                <Text size="lg" weight={600}>
                  {(node as any).targetOutput || '-'}
                </Text>
              </div>
              <div>
                <Text size="sm" color="dimmed" mb={4}>Satuan Output</Text>
                <Text size="lg" weight={600}>
                  {(node as any).satuanOutput || '-'}
                </Text>
              </div>
              <div>
                <Text size="sm" color="dimmed" mb={4}>Indikator Output</Text>
                <Text size="md">
                  {(node as any).indikatorOutput || '-'}
                </Text>
              </div>
            </SimpleGrid>
          </>
        )}

        {node.type === 'account' && (
          <>
            <Divider />
            <Title order={5}>Detail Akun</Title>
            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
              <div>
                <Text size="sm" color="dimmed" mb={4}>Satuan</Text>
                <Text size="lg" weight={600}>
                  {(node as any).satuan || '-'}
                </Text>
              </div>
              <div>
                <Text size="sm" color="dimmed" mb={4}>Volume</Text>
                <Text size="lg" weight={600}>
                  {(node as any).volume || 0}
                </Text>
              </div>
              <div>
                <Text size="sm" color="dimmed" mb={4}>Harga Satuan</Text>
                <Text size="lg" weight={600}>
                  {formatCurrency((node as any).hargaSatuan || 0)}
                </Text>
              </div>
            </SimpleGrid>
          </>
        )}
      </Stack>
    )
  }

  const renderChildrenTab = () => {
    const children = 'kegiatans' in node ? node.kegiatans :
                     'subkegiatans' in node ? node.subkegiatans :
                     'accounts' in node ? node.accounts : []

    return (
      <Stack gap="md">
        <Group justify="space-between" mb="md">
          <Title order={4}>Child Items</Title>
          <Button onClick={onClose} variant="outline">
            Tutup
          </Button>
        </Group>

        {children.length === 0 ? (
          <Text color="dimmed" align="center">
            Tidak ada child items untuk {node.type} ini.
          </Text>
        ) : (
          <Stack gap="sm">
            {children.map((child) => (
              <Card key={child._id} p="md" withBorder>
                <Group justify="space-between" align="flex-start">
                  <div style={{ flex: 1 }}>
                    <Text weight={600} mb={4}>
                      {child.kode} - {child.nama || child.uraian}
                    </Text>
                    {'uraian' in child && child.uraian && (
                      <Text size="sm" color="dimmed">
                        {child.uraian}
                      </Text>
                    )}
                  </div>
                  <Group>
                    <Badge
                      color={child.status === 'active' ? 'green' : 'gray'}
                      variant="light"
                    >
                      {child.status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                    </Badge>
                    <Text size="sm" color="dimmed">
                      {formatCurrency(child.totalPagu || child.paguTahun || 0)}
                    </Text>
                  </Group>
                </Group>
              </Card>
            ))}
          </Stack>
        )}
      </Stack>
    )
  }

  const renderNPDTab = () => {
    return (
      <Stack gap="md">
        <Group justify="space-between" mb="md">
          <Title order={4}>NPD Documents</Title>
          <Button onClick={onClose} variant="outline">
            Tutup
          </Button>
        </Group>

        <Text color="dimmed" align="center" mb="lg">
          NPD documents untuk {node.type} ini akan segera tersedia.
        </Text>

        <Group justify="center">
          {canCreateNPD && (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => onCreateNPD?.(node)}
            >
              Buat NPD
            </Button>
          )}
        </Group>
      </Stack>
    )
  }

  return (
    <Card p="lg" withBorder style={{ minHeight: 500 }}>
      {/* Tabs */}
      <Group mb="md">
        <Button
          variant={activeTab === 'info' ? 'filled' : 'light'}
          onClick={() => setActiveTab('info')}
          leftSection={<IconEye size={16} />}
        >
          Informasi
        </Button>
        <Button
          variant={activeTab === 'children' ? 'filled' : 'light'}
          onClick={() => setActiveTab('children')}
          leftSection={<IconFileText size={16} />}
        >
          Child Items
        </Button>
        {node.type !== 'account' && (
          <Button
            variant={activeTab === 'npd' ? 'filled' : 'light'}
            onClick={() => setActiveTab('npd')}
            leftSection={<IconCurrency size={16} />}
          >
            NPD
          </Button>
        )}
      </Group>

      <Divider />

      {/* Tab Content */}
      {activeTab === 'info' && renderInfoTab()}
      {activeTab === 'children' && renderChildrenTab()}
      {activeTab === 'npd' && renderNPDTab()}
    </Card>
  )
}