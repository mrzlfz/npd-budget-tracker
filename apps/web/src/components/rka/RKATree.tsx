'use client'

import React, { useState } from 'react'
import {
  Group,
  Text,
  ThemeIcon,
  Badge,
  Collapse,
  Box,
  Stack,
  ActionIcon,
  Tooltip,
} from '@mantine/core'
import {
  IconChevronRight,
  IconChevronDown,
  IconFolder,
  IconFolderOpen,
  IconFileText,
  IconCurrency,
  IconEdit,
  IconTrash,
  IconPlus,
} from '@tabler/icons-react'
import { formatCurrency } from '@/lib/utils/format'
import { usePermissions } from '@/hooks/usePermissions'

interface RKAAccountNode {
  _id: string
  type: 'account'
  kode: string
  uraian: string
  satuan?: string
  volume?: number
  hargaSatuan?: number
  paguTahun: number
  realisasiTahun: number
  sisaPagu: number
  status: string
}

interface RKASubkegiatanNode {
  _id: string
  type: 'subkegiatan'
  kode: string
  nama: string
  uraian?: string
  totalPagu: number
  totalRealisasi: number
  totalSisa: number
  status: string
  indikatorOutput?: string
  targetOutput?: number
  satuanOutput?: string
  accounts?: RKAAccountNode[]
}

interface RKAKegiatanNode {
  _id: string
  type: 'kegiatan'
  kode: string
  nama: string
  uraian?: string
  totalPagu: number
  totalRealisasi: number
  totalSisa: number
  status: string
  subkegiatans?: RKASubkegiatanNode[]
}

interface RKAProgramNode {
  _id: string
  type: 'program'
  kode: string
  nama: string
  uraian?: string
  totalPagu: number
  totalRealisasi: number
  totalSisa: number
  status: string
  fiscalYear: number
  kegiatans?: RKAKegiatanNode[]
}

type RKANode = RKAProgramNode | RKAKegiatanNode | RKASubkegiatanNode | RKAAccountNode

interface TreeNodeProps {
  node: RKANode
  level: number
  onEdit?: (node: RKANode) => void
  onDelete?: (node: RKANode) => void
  onCreate?: (parentNode: RKANode, type: string) => void
}

function TreeNode({ node, level, onEdit, onDelete, onCreate }: TreeNodeProps) {
  const [opened, setOpened] = useState(false)
  const { canUpdateRKA, canDeleteRKA } = usePermissions()

  const hasChildren = 'kegiatans' in node || 'subkegiatans' in node || 'accounts' in node
  const children = 'kegiatans' in node ? node.kegiatans :
                   'subkegiatans' in node ? node.subkegiatans :
                   'accounts' in node ? node.accounts : []

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

  const getNodeIcon = (nodeType: string, status: string) => {
    const color = status === 'active' ? 'blue' : 'gray'

    switch (nodeType) {
      case 'program':
        return opened ? <IconFolderOpen color={color} size={16} /> : <IconFolder color={color} size={16} />
      case 'kegiatan':
        return opened ? <IconFolderOpen color={color} size={14} /> : <IconFolder color={color} size={14} />
      case 'subkegiatan':
        return opened ? <IconFolderOpen color={color} size={12} /> : <IconFolder color={color} size={12} />
      case 'account':
        return <IconFileText color={color} size={12} />
      default:
        return <IconFileText color={color} size={12} />
    }
  }

  const formatNodeLabel = (node: RKANode) => {
    switch (node.type) {
      case 'program':
      case 'kegiatan':
      case 'subkegiatan':
        return `${node.kode} - ${node.nama}`
      case 'account':
        return `${node.kode} - ${node.uraian}`
      default:
        return node.nama || node.uraian || node.kode
    }
  }

  const handleToggle = () => {
    if (hasChildren) {
      setOpened(!opened)
    }
  }

  const renderBudgetInfo = (node: any) => {
    const progressColor = getProgressColor(node.totalPagu || node.paguTahun, node.totalRealisasi || node.realisasiTahun)
    const progressPercent = getProgressPercentage(node.totalPagu || node.paguTahun, node.totalRealisasi || node.realisasiTahun)

    return (
      <Group gap="md" justify="space-between" wrap="nowrap">
        <Text size="sm" color="dimmed">
          Pagu: {formatCurrency(node.totalPagu || node.paguTahun)}
        </Text>
        <Text size="sm" color="dimmed">
          Realisasi: {formatCurrency(node.totalRealisasi || node.realisasiTahun)}
        </Text>
        <Badge
          color={progressColor}
          variant="light"
          size="sm"
        >
          {progressPercent}%
        </Badge>
      </Group>
    )
  }

  const renderActions = () => {
    const canEdit = canUpdateRKA
    const canDelete = canDeleteRKA

    if (!canEdit && !canDelete) return null

    return (
      <Group gap="xs">
        {canEdit && (
          <Tooltip label="Edit">
            <ActionIcon
              size="sm"
              variant="subtle"
              onClick={() => onEdit?.(node)}
            >
              <IconEdit size={12} />
            </ActionIcon>
          </Tooltip>
        )}
        {canDelete && (
          <Tooltip label="Delete">
            <ActionIcon
              size="sm"
              variant="subtle"
              color="red"
              onClick={() => onDelete?.(node)}
            >
              <IconTrash size={12} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>
    )
  }

  return (
    <Box>
      <Group
        py="xs"
        px={`${level * 16 + 8}px`}
        gap="md"
        justify="space-between"
        style={{
          borderBottom: '1px solid #f0f0f0',
          '&:hover': {
            backgroundColor: '#f8f9fa',
          },
        }}
      >
        <Group gap="sm" onClick={handleToggle} style={{ cursor: hasChildren ? 'pointer' : 'default' }}>
          {hasChildren && (
            <ThemeIcon size="sm" variant="transparent">
              {opened ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
            </ThemeIcon>
          )}
          <ThemeIcon size="sm" variant="transparent">
            {getNodeIcon(node.type, node.status)}
          </ThemeIcon>
          <div style={{ flex: 1 }}>
            <Text size="sm" weight={500}>
              {formatNodeLabel(node)}
            </Text>
            {'uraian' in node && node.uraian && (
              <Text size="xs" color="dimmed" mt={2}>
                {node.uraian}
              </Text>
            )}
          </div>
        </Group>

        <Group gap="md" align="center">
          {renderBudgetInfo(node)}
          {renderActions()}
        </Group>
      </Group>

      {hasChildren && children && (
        <Collapse in={opened}>
          <Stack gap={0}>
            {children.map((child) => (
              <TreeNode
                key={child._id}
                node={child}
                level={level + 1}
                onEdit={onEdit}
                onDelete={onDelete}
                onCreate={onCreate}
              />
            ))}
          </Stack>
        </Collapse>
      )}
    </Box>
  )
}

interface RKATreeProps {
  data: RKAProgramNode[]
  onEdit?: (node: RKANode) => void
  onDelete?: (node: RKANode) => void
  onCreate?: (parentNode: RKANode, type: string) => void
  loading?: boolean
}

export function RKATree({ data, onEdit, onDelete, onCreate, loading = false }: RKATreeProps) {
  if (loading) {
    return (
      <Box p="lg">
        <Text align="center" color="dimmed">
          Loading RKA data...
        </Text>
      </Box>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Box p="lg">
        <Text align="center" color="dimmed">
          No RKA data available for the selected fiscal year.
        </Text>
      </Box>
    )
  }

  return (
    <Stack gap={0}>
      {data.map((program) => (
        <TreeNode
          key={program._id}
          node={program}
          level={0}
          onEdit={onEdit}
          onDelete={onDelete}
          onCreate={onCreate}
        />
      ))}
    </Stack>
  )
}

export type { RKAProgramNode, RKAKegiatanNode, RKASubkegiatanNode, RKAAccountNode, RKANode }