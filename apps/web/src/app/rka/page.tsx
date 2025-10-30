'use client'

import { useState, useEffect } from 'react'
import {
  Container,
  Title,
  Group,
  Button,
  Select,
  Stack,
  Card,
  Badge,
  LoadingOverlay,
  Text,
} from '@mantine/core'
import {
  IconPlus,
  IconSearch,
  IconFilter,
  IconDownload,
  IconRefresh,
} from '@tabler/icons-react'
import { RKATree, type RKAProgramNode } from '@/components/rka/RKATree'
import { useAppSelector, useAppDispatch } from '@/lib/store'
import { setRkaFiscalYear, setRkaSearchQuery, setRkaStatus } from '@/lib/uiSlice'
import { usePermissions } from '@/hooks/usePermissions'
import { api } from '@/convex/_generated/api'
import { formatCurrency } from '@/lib/utils/format'

export default function RKAExplorer() {
  const dispatch = useAppDispatch()
  const { fiscalYear, searchQuery, status } = useAppSelector(state => state.filters.rka)
  const { canCreateRKA } = usePermissions()

  const [programs, setPrograms] = useState<RKAProgramNode[]>([])
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // Generate fiscal years (current year + 5 years back)
  const generateFiscalYears = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push({ value: i, label: i.toString() })
    }
    return years
  }

  // Load RKA data
  const loadRKAData = async (selectedFiscalYear?: number) => {
    setLoading(true)
    try {
      const yearToUse = selectedFiscalYear || fiscalYear || new Date().getFullYear()
      const hierarchy = await api.rkaHierarchy.getHierarchy({ fiscalYear: yearToUse })
      setPrograms(hierarchy)
    } catch (error) {
      console.error('Failed to load RKA data:', error)
      // Show error notification
    } finally {
      setLoading(false)
    }
  }

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadRKAData()
    setRefreshing(false)
  }

  // Handle fiscal year change
  const handleFiscalYearChange = (value: number | null) => {
    if (value) {
      dispatch(setRkaFiscalYear(value))
      loadRKAData(value)
    }
  }

  // Handle search
  const handleSearch = async (query: string) => {
    dispatch(setRkaSearchQuery(query))
    if (query.trim()) {
      setLoading(true)
      try {
        const searchResults = await api.rkaHierarchy.searchHierarchy({
          searchQuery: query,
          fiscalYear: fiscalYear || undefined
        })
        // Combine all search results into a tree structure
        const combinedResults = [
          ...searchResults.programs,
          ...searchResults.kegiatans,
          ...searchResults.subkegiatans,
          ...searchResults.accounts,
        ]
        setPrograms(combinedResults)
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setLoading(false)
      }
    } else {
      // Reset to full hierarchy
      loadRKAData()
    }
  }

  // Handle edit
  const handleEdit = (node: any) => {
    console.log('Edit node:', node)
    // Implementation depends on node type
  }

  // Handle delete
  const handleDelete = (node: any) => {
    console.log('Delete node:', node)
    // Show confirmation modal and handle deletion
  }

  // Calculate totals
  const calculateTotals = () => {
    const totals = programs.reduce((acc, program) => ({
      totalPagu: acc.totalPagu + program.totalPagu,
      totalRealisasi: acc.totalRealisasi + program.totalRealisasi,
      totalSisa: acc.totalSisa + program.totalSisa,
    }), { totalPagu: 0, totalRealisasi: 0, totalSisa: 0 })

    const utilizationRate = totals.totalPagu > 0
      ? Math.round((totals.totalRealisasi / totals.totalPagu) * 100)
      : 0

    return { ...totals, utilizationRate }
  }

  // Initial load
  useEffect(() => {
    loadRKAData()
  }, [])

  const totals = calculateTotals()

  return (
    <Container size="xl" py="md">
      <LoadingOverlay visible={loading} />

      {/* Header */}
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>RKA Explorer</Title>
          <Text color="dimmed" size="sm">
            Rencana Kerja dan Anggaran Hierarchy
          </Text>
        </div>

        <Group>
          {canCreateRKA && (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => {
                // Open create RKA modal
                console.log('Create new RKA')
              }}
            >
              Buat RKA
            </Button>
          )}

          <Button
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={handleRefresh}
            loading={refreshing}
          >
            Refresh
          </Button>

          <Button
            variant="light"
            leftSection={<IconDownload size={16} />}
            onClick={() => {
              // Export functionality
              console.log('Export RKA data')
            }}
          >
            Export
          </Button>
        </Group>
      </Group>

      {/* Filters */}
      <Card mb="lg" p="md" withBorder>
        <Group justify="space-between">
          <Group>
            <Select
              placeholder="Pilih Tahun Anggaran"
              data={generateFiscalYears()}
              value={fiscalYear}
              onChange={handleFiscalYearChange}
              w={200}
              searchable={false}
              clearable={false}
            />

            <Select
              placeholder="Status"
              data={[
                { value: 'active', label: 'Aktif' },
                { value: 'inactive', label: 'Tidak Aktif' },
              ]}
              value={status}
              onChange={(value) => dispatch(setRkaStatus(value))}
              w={150}
              clearable
            />
          </Group>

          <Group>
            {/* Search functionality would go here */}
            <Text color="dimmed" size="sm">
              {programs.length} program ditemukan
            </Text>
          </Group>
        </Group>
      </Card>

      {/* Summary Cards */}
      <Group mb="lg" grow>
        <Card p="md" withBorder style={{ flex: 1 }}>
          <Text size="sm" color="dimmed">Total Pagu</Text>
          <Text size="lg" weight={600}>
            {formatCurrency(totals.totalPagu)}
          </Text>
        </Card>

        <Card p="md" withBorder style={{ flex: 1 }}>
          <Text size="sm" color="dimmed">Total Realisasi</Text>
          <Text size="lg" weight={600}>
            {formatCurrency(totals.totalRealisasi)}
          </Text>
        </Card>

        <Card p="md" withBorder style={{ flex: 1 }}>
          <Text size="sm" color="dimmed">Sisa Pagu</Text>
          <Text size="lg" weight={600}>
            {formatCurrency(totals.totalSisa)}
          </Text>
        </Card>

        <Card p="md" withBorder style={{ flex: 1 }}>
          <Text size="sm" color="dimmed">Utilisasi</Text>
          <Group>
            <Text size="lg" weight={600}>
              {totals.utilizationRate}%
            </Text>
            <Badge
              color={totals.utilizationRate >= 100 ? 'red' : totals.utilizationRate >= 80 ? 'yellow' : 'green'}
              variant="light"
            >
              {totals.utilizationRate >= 100 ? 'Over' : totals.utilizationRate >= 80 ? 'High' : 'Normal'}
            </Badge>
          </Group>
        </Card>
      </Group>

      {/* RKA Tree */}
      <Card p="md" withBorder style={{ minHeight: '500px' }}>
        <RKATree
          data={programs}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />
      </Card>
    </Container>
  )
}