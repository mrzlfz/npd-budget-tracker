'use client'

import React, { useState, useMemo, useCallback } from 'react'
import {
  Card,
  Title,
  Group,
  Text,
  Select,
  Button,
  Switch,
  Grid,
  SimpleGrid,
  Tooltip,
  ActionIcon,
  Checkbox,
  Stack,
  Badge,
} from '@mantine/core'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
  ComposedChart,
  Area,
  AreaChart,
  Brush,
  ReferenceLine,
} from 'recharts'
import {
  IconDownload,
  IconRefresh,
  IconChartLine,
  IconEye,
  IconSettings,
  IconFilter,
} from '@tabler/icons-react'
import { formatCurrency } from '@/lib/utils/format'

interface IndicatorData {
  id: string
  name: string
  data: Array<{
    periode: string
    target: number
    realisasi: number
    persentase: number
  }>
  color: string
  yAxisId?: string
  showLegend?: boolean
}

interface MultiIndicatorTrendChartProps {
  indicators: IndicatorData[]
  title?: string
  height?: number
  showExport?: boolean
  onExport?: (data: any[]) => void
  onRefresh?: () => void
  periodFilter?: 'all' | 'year' | 'quarter' | 'month'
}

interface TrendData {
  periode: string
  [key: string]: number | string
}

export function MultiIndicatorTrendChart({
  indicators,
  title = 'Tren Performansi Multi-Indikator',
  height = 450,
  showExport = true,
  onExport,
  onRefresh,
  periodFilter = 'all'
}: MultiIndicatorTrendChartProps) {
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([])
  const [brushData, setBrushData] = useState<any>(null)
  const [compareMode, setCompareMode] = useState<'single' | 'compare'>('single')
  const [timeRange, setTimeRange] = useState<'1y' | '6m' | '3m' | '1m'>('1y')
  const [showGrid, setShowGrid] = useState(true)

  // Time range options
  const timeRangeOptions = [
    { value: '1m', label: '1 Bulan' },
    { value: '3m', label: '3 Bulan' },
    { value: '6m', label: '6 Bulan' },
    { value: '1y', label: '1 Tahun' },
  ]

  // Process trend data
  const processedTrendData = useMemo(() => {
    const allPeriods = new Set<string>()

    indicators.forEach(indicator => {
      indicator.data.forEach(item => {
        allPeriods.add(item.periode)
      })
    })

    const periodArray = Array.from(allPeriods).sort()

    return periodArray.map(periode => {
      const trendItem: TrendData = { periode }

      indicators.forEach(indicator => {
        const dataPoint = indicator.data.find(item => item.periode === periode)
        if (dataPoint) {
          trendItem[indicator.id] = dataPoint.realisasi
        }
      })

      return trendItem
    })
  }, [indicators])

  // Filter data based on time range
  const filteredTrendData = useMemo(() => {
    if (periodFilter === 'all') return processedTrendData

    const periods = processedTrendData.slice(-timeRange.slice(0, -1) === '1y' ? -12 :
                     timeRange.slice(0, -1) === '6m' ? -6 :
                     timeRange.slice(0, -1) === '3m' ? -3 : -1)

    return processedTrendData.slice(periods)
  }, [processedTrendData, timeRange])

  // Generate chart data
  const chartData = useMemo(() => {
    return filteredTrendData.map((item) => {
      const chartItem: any = { periode: item.periode }

      selectedIndicators.forEach(indicatorId => {
        const indicator = indicators.find(ind => ind.id === indicatorId)
        if (indicator) {
          chartItem[indicatorId] = item[indicatorId]
          chartItem[`${indicatorId}_target`] = indicator.data.find(d => d.periode === item.periode)?.target || 0
        }
      })

      return chartItem
    })
  }, [filteredTrendData, selectedIndicators])

  // Legend data
  const legendData = selectedIndicators.map(indicatorId => {
    const indicator = indicators.find(ind => ind.id === indicatorId)
    return indicator ? {
      id: indicatorId,
      name: indicator.name,
      color: indicator.color,
    } : null
  }).filter(Boolean)

  // Handle indicator selection
  const handleIndicatorToggle = (indicatorId: string) => {
    setSelectedIndicators(prev => {
      const newSelection = new Set(prev)
      if (newSelection.has(indicatorId)) {
        newSelection.delete(indicatorId)
      } else {
        newSelection.add(indicatorId)
      }
      return Array.from(newSelection)
    })
  }

  // Handle export
  const handleExport = useCallback(() => {
    const exportData = filteredTrendData.map(item => {
      const exportItem: any = { Periode: item.periode }

      selectedIndicators.forEach(indicatorId => {
        const indicator = indicators.find(ind => ind.id === indicatorId)
        if (indicator) {
          exportItem[indicatorId] = item[indicatorId]
          exportItem[`${indicatorId}_Target`] = indicator.data.find(d => d.periode === item.periode)?.target || 0
        }
      })

      return exportItem
    })

    onExport?.(exportData)
  }, [filteredTrendData, selectedIndicators, onExport])

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload) return null

    const getIndicatorInfo = (indicatorId: string) => {
      const indicator = indicators.find(ind => ind.id === indicatorId)
      if (!indicator) return null

      const dataPoint = indicator.data.find(d => d.periode === payload.periode)
      return {
        indicator,
        dataPoint,
      }
    }

    return (
      <div style={{
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: '12px',
        borderRadius: '6px',
        border: '1px solid #ccc',
        color: '#333',
        fontSize: '12px',
        maxWidth: '400px'
      }}>
        <div style={{ fontWeight: 600, marginBottom: '8px', color: label }}>{label}</div>
        {selectedIndicators.map(indicatorId => {
          const indicatorInfo = getIndicatorInfo(indicatorId)
          if (indicatorInfo) {
            return (
              <div key={indicatorId} style={{ marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
                  <div
                    style={{
                      width: '12px',
                      height: '12px',
                      backgroundColor: indicatorInfo.indicator.color,
                      borderRadius: '2px',
                      marginRight: '8px'
                    }}
                  />
                  <span>{indicatorInfo.indicator.name}: </span>
                  <span style={{ fontWeight: 600 }}>
                    {payload[indicatorId]?.toLocaleString()}
                  </span>
                  {indicatorInfo.dataPoint && (
                    <span style={{ color: '#666', marginLeft: '4px' }}>
                      (Target: {indicatorInfo.dataPoint.target} | Realisasi: {indicatorInfo.dataPoint.realisasi})
                    </span>
                  )}
                </div>
              </div>
            )
          }
          return null
        })}
      </div>
    )
  }

  // Render single indicator chart
  const renderSingleLineChart = (indicator: IndicatorData) => (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={chartData}
        margin={{
          top: 20,
          right: 120,
          bottom: 80,
          left: 80,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="periode"
          tick={{ fontSize: 11 }}
          angle={-45}
          textAnchor="end"
          height={100}
          width={80}
        />
        <YAxis
          yAxisId={indicator.yAxisId}
          tick={{ fontSize: 11 }}
          tickFormatter={(value) => {
            const unit = indicator.yAxisId === 'persentase' ? '%' : 'jt'
            return `${value} ${unit}`
          }}
        />
        <RechartsTooltip content={<CustomTooltip />} />
        {selectedIndicators.includes(indicator.id) && (
          <>
            <Line
              type="monotone"
              dataKey={indicator.id}
              stroke={indicator.color}
              strokeWidth={2}
              dot={{ fill: indicator.color, strokeWidth: 2, r: 4 }}
            />
            <Line
              type="stepBefore"
              dataKey={`${indicator.id}_target`}
              stroke={indicator.color}
              strokeDasharray="5 5"
              strokeWidth={1.5}
              dot={{ fill: indicator.color, strokeWidth: 1.5, r: 3 }}
            />
          </>
        )}
      </LineChart>
    </ResponsiveContainer>
  )

  // Render comparison chart
  const renderComparisonChart = () => {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={chartData}
          margin={{
            top: 20,
            right: 120,
            bottom: 80,
            left: 80,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="periode"
            tick={{ fontSize: 11 }}
            angle={-45}
            textAnchor="end"
            height={100}
            width={80}
          />
          <YAxis
            yAxisId="right"
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => {
              const unit = compareMode === 'compare' ? '%' : 'jt'
              return `${value} ${unit}`
            }}
          />
          <RechartsTooltip content={<CustomTooltip />} />
          {selectedIndicators.map((indicatorId, index) => {
            const indicator = indicators.find(ind => ind.id === indicatorId)
            if (!indicator) return null

            const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#66bb6a']
            const color = colors[index % colors.length]

            return (
              <>
                <Area
                  key={`${indicatorId}_realisasi`}
                  type="monotone"
                  dataKey={indicatorId}
                  stackId={indicatorId}
                  stroke={color}
                  fill={color}
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Line
                  key={`${indicatorId}_target`}
                  type="monotone"
                  dataKey={`${indicatorId}_target`}
                  stroke={color}
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
              </>
            )
          })}
        </ComposedChart>
      </ResponsiveContainer>
    )
  }

  return (
    <Card p="lg" withBorder>
      {/* Header */}
      <Group justify="space-between" align="flex-start" mb="lg">
        <div>
          <Title order={3}>{title}</Title>
          <Text color="dimmed" size="sm">
            Visualisasi tren performansi dengan multi-indikator
          </Text>
        </div>
        <Group>
          <Tooltip label="Refresh data">
            <ActionIcon
              size="lg"
              variant="light"
              onClick={onRefresh}
            >
              <IconRefresh size={16} />
            </ActionIcon>
          </Tooltip>
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
        </Group>
      </Group>

      {/* Controls */}
      <Group mb="lg" justify="space-between">
        <div>
          {/* Indicator Selection */}
          <Text size="sm" weight={600} mb="md">Indikator</Text>
          <Group wrap="wrap" gap="xs">
            {indicators.map(indicator => (
              <Checkbox
                key={indicator.id}
                label={
                  <Group gap="xs" align="center">
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        backgroundColor: indicator.color,
                        borderRadius: '2px',
                        marginRight: '6px'
                      }}
                    />
                    <span>{indicator.name}</span>
                  </Group>
                }
                checked={selectedIndicators.includes(indicator.id)}
                onChange={() => handleIndicatorToggle(indicator.id)}
                size="sm"
              />
            ))}
          </Group>
        </div>

        <div>
          <Text size="sm" weight={600} mb="md">Mode</Text>
          <Button.Group>
            <Button
              variant={compareMode === 'single' ? 'filled' : 'light'}
              size="sm"
              onClick={() => setCompareMode('single')}
            >
              Single
            </Button>
            <Button
              variant={compareMode === 'compare' ? 'filled' : 'light'}
              size="sm"
              onClick={() => setCompareMode('compare')}
            >
              Compare
            </Button>
          </Button.Group>
        </div>

        <div>
          <Text size="sm" weight={600} mb="md">Time Range</Text>
          <Select
            size="sm"
            value={timeRange}
            onChange={(value) => setTimeRange(value as any)}
            data={timeRangeOptions}
          />
        </div>

        <div>
          <Text size="sm" weight={600} mb="md">Period</Text>
          <Select
            size="sm"
            value={periodFilter}
            onChange={(value) => console.log('Period filter:', value)}
            data={[
              { value: 'all', label: 'All Periods' },
              { value: 'year', label: 'Yearly' },
              { value: 'quarter', label: 'Quarterly' },
              { value: 'month', label: 'Monthly' },
            ]}
          />
        </div>

        <div>
          <Button
            variant={showGrid ? 'filled' : 'light'}
            size="sm"
            leftSection={<IconFilter size={14} />}
            onClick={() => setShowGrid(!showGrid)}
          >
            Grid
          </Button>
        </div>
      </Group>

      {/* Legend */}
      {selectedIndicators.length > 0 && (
        <Group justify="center" mb="lg">
          {legendData.map((item) => (
            <Group key={item.id} spacing="xs" align="center">
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  backgroundColor: item.color,
                  borderRadius: '2px',
                  marginRight: '6px'
                }}
              />
              <Text size="sm">{item.name}</Text>
            </Group>
          ))}
        </Group>
      )}

      {/* Chart */}
      {selectedIndicators.length === 0 ? (
        <Card p="xl" withBorder style={{ minHeight: 400 }}>
          <Stack align="center" justify="center" h={400}>
            <IconEye size={48} color="gray" />
            <Text color="dimmed" mt="md" align="center">
              Pilih minimal satu indikator untuk memulai visualisasi
            </Text>
          </Stack>
        </Card>
      ) : compareMode === 'single' && selectedIndicators.length === 1 ? (
        renderSingleLineChart(indicators.find(ind => ind.id === selectedIndicators[0])!)
      ) : (
        renderComparisonChart()
      )}

      {/* Statistics */}
      {selectedIndicators.length > 0 && (
        <Grid cols={{ base: 1, md: 2, lg: 4 }} spacing="md" mt="lg">
          {selectedIndicators.map(indicatorId => {
            const indicator = indicators.find(ind => ind.id === indicatorId)
            if (!indicator) return null

            const latestData = indicator.data[indicator.data.length - 1]
            const trend = latestData ? (latestData.realisasi / latestData.target) * 100 : 0

            return (
              <Card key={indicatorId} p="md" withBorder>
                <Group justify="space-between" align="flex-start" mb="xs">
                  <div>
                    <Text size="xs" color="dimmed">Indikator</Text>
                    <Text weight={600} size="sm">{indicator.name}</Text>
                  </div>
                  <Badge
                    color={trend >= 100 ? 'red' : trend >= 80 ? 'yellow' : 'green'}
                    variant="light"
                    size="sm"
                  >
                    {trend >= 100 ? 'Over Target' : trend >= 80 ? 'High Achievement' : 'On Track'}
                  </Badge>
                </Group>

                <SimpleGrid cols={2} spacing="xs">
                  <div>
                    <Text size="xs" color="dimmed">Current</Text>
                    <Text size="lg" weight={600} color="blue">
                      {formatCurrency(latestData?.realisasi || 0)}
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" color="dimmed">Target</Text>
                    <Text size="lg" weight={600}>
                      {formatCurrency(latestData?.target || 0)}
                    </Text>
                  </div>
                </SimpleGrid>

                <SimpleGrid cols={2} spacing="xs">
                  <div>
                    <Text size="xs" color="dimmed">Achiev.</Text>
                    <Text size="lg" weight={600} color={trend >= 100 ? 'red' : trend >= 80 ? 'yellow' : 'green'}>
                      {trend.toFixed(1)}%
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" color="dimmed">Variance</Text>
                    <Text size="lg" weight={600}>
                      {latestData ? formatCurrency(latestData.realisasi - latestData.target) : '-'}
                    </Text>
                  </div>
                </SimpleGrid>
              </Card>
            )
          })}
        </Grid>
      )}
    </Card>
  )
}