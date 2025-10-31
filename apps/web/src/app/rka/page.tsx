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
import { RKATree, type RKAProgramNode, type RKANode } from '@/components/rka/RKATree'
import { RKABreadcrumbs } from '@/components/rka/RKABreadcrumbs'
import { RKASearch } from '@/components/rka/RKASearch'
import { RKADetailPanel } from '@/components/rka/RKADetailPanel'
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
  const [currentPath, setCurrentPath] = useState<RKANode[]>([])
  const [selectedNode, setSelectedNode] = useState<RKANode | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

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

  // Handle node click
  const handleNodeClick = (node: RKANode) => {
    setSelectedNode(node)
    // Update breadcrumb path
    if (node.type === 'program') {
      setCurrentPath([node])
    } else {
      // For other nodes, we would need to build the full path
      // This is simplified - in production, we'd track the full path
      setCurrentPath(prev => [...prev, node])
    }
  }

  // Handle breadcrumb navigation
  const handleBreadcrumbNavigate = (node: RKANode) => {
    setSelectedNode(node)
    // Reset path to clicked node level
    const nodeIndex = currentPath.findIndex(n => n._id === node._id)
    if (nodeIndex !== -1) {
      setCurrentPath(currentPath.slice(0, nodeIndex + 1))
    }
  }

  // Handle lazy loading children
  const handleLoadChildren = async (node: RKANode) => {
    // This would load children on demand
    // For now, children are already loaded from the hierarchy
    console.log('Loading children for:', node._id)
  }

  // Handle expand/collapse
  const handleToggleExpand = (nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
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

      {/* Breadcrumb Navigation */}
      {currentPath.length > 0 && (
        <RKABreadcrumbs
          currentPath={currentPath}
          onNavigate={handleBreadcrumbNavigate}
        />
      )}

      <Grid cols={{ base: 1, lg: selectedNode ? 2 : 1 }} spacing="lg">
        {/* Main Content - RKA Tree */}
        <div span={{ base: 1, lg: selectedNode ? 1 : 'auto' }}>
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

          {/* Search and Filters */}
          <RKASearch
            onSearch={handleSearch}
            onFilter={(filters) => {
              // Handle filter changes
              console.log('Filters changed:', filters)
            }}
            loading={loading}
            value={searchQuery}
          />

          {/* Quick Info */}
          <Group mb="lg" justify="space-between">
            <Text color="dimmed" size="sm">
              {programs.length} program ditemukan
            </Text>

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
          </Group>

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
              onLoadChildren={handleLoadChildren}
              onNodeClick={handleNodeClick}
              searchQuery={searchQuery}
              expandedNodes={expandedNodes}
            />
          </Card>
        </div>

        {/* Detail Panel */}
        {selectedNode && (
          <div span={{ base: 1, lg: 1 }}>
            <RKADetailPanel
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCreateNPD={(node) => {
                console.log('Create NPD for:', node)
              }}
            />
          </div>
        )}
      </Grid>
    </Container>
  )
}