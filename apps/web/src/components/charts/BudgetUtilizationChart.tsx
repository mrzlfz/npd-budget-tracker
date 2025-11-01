'use client'

import React, { useState, useCallback, useMemo } from 'react'
import {
  Card,
  Title,
  Group,
  Text,
  Button,
  Select,
  Tooltip,
  ActionIcon,
  Progress,
  Badge,
  Stack,
  SimpleGrid,
} from '@mantine/core'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Area,
  AreaChart,
} from 'recharts'
import {
  IconDownload,
  IconChartBar,
  IconChartPie,
  IconTrendingUp,
  IconTrendingDown,
  IconFilter,
  IconMaximize,
} from '@tabler/icons-react'
import { formatCurrency } from '@/lib/utils/format'

interface BudgetData {
  kode: string
  uraian: string
  pagu: number
  realisasi: number
  sisa: number
  persentase: number
  status: string
}

interface DrillDownData {
  level: 'program' | 'kegiatan' | 'subkegiatan' | 'account'
  data: BudgetData[]
  parentInfo?: {
    kode: string
    uraian: string
  }
}

interface BudgetUtilizationChartProps {
  data: BudgetData[]
  title?: string
  height?: number
  showExport?: boolean
  onDrillDown?: (level: string, item: BudgetData) => void
  onExport?: (data: BudgetData[]) => void
}

export function BudgetUtilizationChart({
  data,
  title = 'Analisis Budget',
  height = 400,
  showExport = true,
  onDrillDown,
  onExport
}: BudgetUtilizationChartProps) {
  const [viewMode, setViewMode] = useState<'bar' | 'pie' | 'area'>('bar')
  const [sortBy, setSortBy] = useState<'pagu' | 'realisasi' | 'persentase'>('pagu')
  const [drillDownData, setDrillDownData] = useState<DrillDownData | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  // Processed data for charts
  const processedData = useMemo(() => {
    return data
      .filter(item => item.pagu > 0)
      .sort((a, b) => {
        switch (sortBy) {
          case 'pagu': return b.pagu - a.pagu
          case 'realisasi': return b.realisasi - a.realisasi
          case 'persentase': return b.persentase - a.persentase
          default: return b.pagu - a.pagu
        }
      })
  }, [data, sortBy])

  // Calculate statistics
  const statistics = useMemo(() => {
    if (processedData.length === 0) return { total: 0, realized: 0, remaining: 0, averageUtilization: 0 }

    const total = processedData.reduce((sum, item) => sum + item.pagu, 0)
    const realized = processedData.reduce((sum, item) => sum + item.realisasi, 0)
    const remaining = processedData.reduce((sum, item) => sum + item.sisa, 0)
    const averageUtilization = processedData.reduce((sum, item) => sum + item.persentase, 0) / processedData.length

    return {
      total,
      realized,
      remaining,
      averageUtilization,
      totalItems: processedData.length,
      overBudgetCount: processedData.filter(item => item.persentase > 100).length,
      highUtilizationCount: processedData.filter(item => item.persentase >= 80 && item.persentase < 100).length,
      lowUtilizationCount: processedData.filter(item => item.persentase < 50).length,
    }
  }, [processedData])

  // Handle drill down
  const handleDrillDown = useCallback((item: BudgetData) => {
    if (!onDrillDown) return

    const level = item.kode.startsWith('1.') ? 'program' :
                   item.kode.startsWith('1.1.') ? 'kegiatan' :
                   item.kode.startsWith('1.1.1.') ? 'subkegiatan' : 'account'

    const childrenData = data.filter(child =>
      child.kode.startsWith(item.kode + '.') &&
      child.kode.length > item.kode.length &&
      child.kode.split('.').length === item.kode.split('.').length + 1
    )

    setDrillDownData({
      level,
      data: childrenData,
      parentInfo: {
        kode: item.kode,
        uraian: item.uraian
      }
    })
  }, [data, onDrillDown])

  // Handle export
  const handleExport = useCallback(() => {
    if (!onExport) return

    const exportData = processedData.map(item => ({
      'Kode': item.kode,
      'Uraian': item.uraian,
      'Pagu': item.pagu,
      'Realisasi': item.realisasi,
      'Sisa': item.sisa,
      'Persentase': `${item.persentase.toFixed(2)}%`,
      'Status': item.status,
    }))

    onExport(exportData)
  }, [processedData, onExport])

  // Custom colors based on utilization
  const getBarColor = (persentase: number) => {
    if (persentase >= 100) return '#ef4444'
    if (persentase >= 80) return '#f59e0b'
    if (persentase >= 50) return '#3b82f6'
    return '#10b981'
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload) {
      return (
        <div style={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          padding: '10px',
          borderRadius: '4px',
          border: '1px solid #ccc',
          color: '#333',
          fontSize: '12px',
          maxWidth: '300px'
        }}>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{label}</div>
          <div>Kode: {payload.kode}</div>
          <div>Pagu: {formatCurrency(payload.pagu)}</div>
          <div>Realisasi: {formatCurrency(payload.realisasi)}</div>
          <div>Sisa: {formatCurrency(payload.sisa)}</div>
          <div>Utilisasi: {payload.persentase.toFixed(2)}%</div>
        </div>
      )
    }
    return null
  }

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={processedData}
        margin={{
          top: 20,
          right: 30,
          left: 60,
          bottom: 60,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="uraian"
          tick={{ fontSize: 11 }}
          angle={-45}
          textAnchor="end"
          height={100}
          width={80}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(value) => `Rp${(value / 1000000).toFixed(1)}jt`}
        />
        <RechartsTooltip content={<CustomTooltip label="Detail Budget" />} />
        <Bar
          dataKey="pagu"
          fill="#e3f2fd"
          name="Pagu"
        />
        <Bar
          dataKey="realisasi"
          fill="#10b981"
          name="Realisasi"
        />
        {drillDownData && viewMode === 'bar' && (
          <Bar
            dataKey="sisa"
            fill="#6b7280"
            name="Sisa"
            onClick={(data: any) => {
              const item = processedData.find(item => item.uraian === data.uraian)
              if (item) handleDrillDown(item)
            }}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  )

  const renderPieChart = () => {
    const pieData = processedData.slice(0, 8).map((item, index) => ({
      name: item.uraian,
      value: item.pagu,
      persentase: item.persentase,
      fill: ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#ff6b6b', '#c084fc', '#9333ea', '#8b5cf6'][index % 8]
    }))

    return (
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => (
              <text
                x={percent > 0.5 ? 120 : percent < 0.5 ? -20 : 0}
                y={percent > 0.5 ? 50 : percent < 0.5 ? 50 : -10}
                fill="white"
                textAnchor={percent > 0.5 ? 'start' : percent < 0.5 ? 'end' : 'middle'}
                dominantBaseline="central"
                style={{ fontSize: 11 }}
              >
                {`${name}: ${percent.toFixed(1)}%`}
              </text>
            )}
            >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.fill}
                stroke="#fff"
                strokeWidth={2}
                onClick={() => handleDrillDown(processedData[index])}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </Pie>
          <RechartsTooltip content={<CustomTooltip label="Proyeksi" />} />
        </PieChart>
      </ResponsiveContainer>
    )
  }

  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={processedData}
        margin={{
          top: 20,
          right: 30,
          left: 60,
          bottom: 60,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="uraian"
          tick={{ fontSize: 11 }}
          angle={-45}
          textAnchor="end"
          height={100}
          width={80}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickFormatter={(value) => `Rp${(value / 1000000).toFixed(1)}jt`}
        />
        <RechartsTooltip content={<CustomTooltip label="Tren" />} />
        <Area
          type="monotone"
          dataKey="pagu"
          stackId="1"
          stroke="#8884d8"
          fill="#8884d8"
          fillOpacity={0.6}
        />
        <Area
          type="monotone"
          dataKey="realisasi"
          stackId="1"
          stroke="#82ca9d"
          fill="#82ca9d"
          fillOpacity={0.8}
        />
      </AreaChart>
    </ResponsiveContainer>
  )

  const renderDrillDownView = () => {
    if (!drillDownData) return null

    return (
      <Card p="md" withBorder mt="lg">
        <Group justify="space-between" mb="md">
          <div>
            <Title order={4}>
              {drillDownData.level === 'program' ? 'Detail Program' :
               drillDownData.level === 'kegiatan' ? 'Detail Kegiatan' :
               drillDownData.level === 'subkegiatan' ? 'Detail Sub Kegiatan' : 'Detail Akun'}
            </Title>
            {drillDownData.parentInfo && (
              <Text color="dimmed" size="sm">
                Induk: {drillDownData.parentInfo.kode} - {drillDownData.parentInfo.uraian}
              </Text>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            leftSection={<IconTrendingDown size={14} />}
            onClick={() => setDrillDownData(null)}
          >
            Kembali
          </Button>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {drillDownData.data.map((item) => (
            <Card key={item.kode} p="sm" withBorder>
              <Group justify="space-between" mb="xs">
                <Text weight={600} size="sm">
                  {item.kode}
                </Text>
                <Badge
                  color={getBarColor(item.persentase)}
                  variant="light"
                  size="sm"
                >
                  {item.persentase.toFixed(1)}%
                </Badge>
              </Group>

              <Text size="sm" color="dimmed" mb={8}>
                {item.uraian}
              </Text>

              <SimpleGrid cols={2} spacing="xs">
                <div>
                  <Text size="xs" color="dimmed">Pagu</Text>
                  <Text size="sm" weight={500}>
                    {formatCurrency(item.pagu)}
                  </Text>
                </div>
                <div>
                  <Text size="xs" color="dimmed">Realisasi</Text>
                  <Text size="sm" weight={500}>
                    {formatCurrency(item.realisasi)}
                  </Text>
                </div>
              </SimpleGrid>

              <SimpleGrid cols={2} spacing="xs">
                <div>
                  <Text size="xs" color="dimmed">Sisa</Text>
                  <Text size="sm" weight={500}>
                    {formatCurrency(item.sisa)}
                  </Text>
                </div>
                <div>
                  <Progress
                    value={item.persentase}
                    color={getBarColor(item.persentase)}
                    size="sm"
                    radius="md"
                  />
                </div>
              </SimpleGrid>
            </Card>
          ))}
        </SimpleGrid>
      </Card>
    )
  }

  return (
    <Card p="lg" withBorder>
      {/* Header */}
      <Group justify="space-between" align="flex-start" mb="lg">
        <div>
          <Title order={3}>{title}</Title>
        </div>
        <Group>
          {/* View Mode Toggle */}
          <Button.Group>
            <Button
              variant={viewMode === 'bar' ? 'filled' : 'light'}
              size="sm"
              leftSection={<IconChartBar size={14} />}
              onClick={() => setViewMode('bar')}
            >
              Bar
            </Button>
            <Button
              variant={viewMode === 'pie' ? 'filled' : 'light'}
              size="sm"
              leftSection={<IconChartPie size={14} />}
              onClick={() => setViewMode('pie')}
            >
              Pie
            </Button>
            <Button
              variant={viewMode === 'area' ? 'filled' : 'light'}
              size="sm"
              leftSection={<IconTrendingUp size={14} />}
              onClick={() => setViewMode('area')}
            >
              Area
            </Button>
          </Button.Group>

          {/* Sort */}
          <Select
            size="sm"
            value={sortBy}
            onChange={(value) => setSortBy(value as any)}
            data={[
              { value: 'pagu', label: 'Urut Pagu' },
              { value: 'realisasi', label: 'Urut Realisasi' },
              { value: 'persentase', label: 'Urut %' },
            ]}
          />

          {/* Export */}
          {showExport && onExport && (
            <Tooltip label="Export data">
              <ActionIcon
                size="lg"
                variant="light"
                onClick={handleExport}
              >
                <IconDownload size={16} />
              </ActionIcon>
            </Tooltip>
          )}

          {/* Expand/Collapse */}
          <Tooltip label={isExpanded ? 'Collapse' : 'Expand'}>
            <ActionIcon
              size="lg"
              variant="light"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? <IconTrendingDown size={16} /> : <IconMaximize size={16} />}
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>

      {/* Statistics Summary */}
      <SimpleGrid cols={{ base: 1, md: 4 }} spacing="md" mb="lg">
        <Card p="md" withBorder>
          <Text size="sm" color="dimmed" mb={4}>Total Pagu</Text>
          <Text size="lg" weight={600} color="blue">
            {formatCurrency(statistics.total)}
          </Text>
        </Card>
        <Card p="md" withBorder>
          <Text size="sm" color="dimmed" mb={4}>Total Realisasi</Text>
          <Text size="lg" weight={600} color="green">
            {formatCurrency(statistics.realized)}
          </Text>
        </Card>
        <Card p="md" withBorder>
          <Text size="sm" color="dimmed" mb={4}>Sisa Pagu</Text>
          <Text size="lg" weight={600} color="orange">
            {formatCurrency(statistics.remaining)}
          </Text>
        </Card>
        <Card p="md" withBorder>
          <Text size="sm" color="dimmed" mb={4}>Rata-rata %</Text>
          <Text size="lg" weight={600}>
            {statistics.averageUtilization.toFixed(1)}%
          </Text>
        </Card>
      </SimpleGrid>

      {/* Alerts */}
      {(statistics.overBudgetCount > 0 || statistics.highUtilizationCount > 0) && (
        <Group mb="lg">
          {statistics.overBudgetCount > 0 && (
            <Badge color="red" variant="light" size="lg">
              {statistics.overBudgetCount} item over budget
            </Badge>
          )}
          {statistics.highUtilizationCount > 0 && (
            <Badge color="yellow" variant="light" size="lg">
              {statistics.highUtilizationCount} item utilisasi tinggi (80%+)
            </Badge>
          )}
          <div style={{ flex: 1 }} />
          <Badge color="blue" variant="light" size="lg">
            {statistics.lowUtilizationCount} item utilisasi rendah (50%)
          </Badge>
        </Group>
      )}

      {/* Chart Area */}
      {drillDownData ? renderDrillDownView() : (
        <Stack gap="md">
          {viewMode === 'bar' && renderBarChart()}
          {viewMode === 'pie' && renderPieChart()}
          {viewMode === 'area' && renderAreaChart()}
        </Stack>
      )}
    </Card>
  )
}