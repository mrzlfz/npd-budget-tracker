'use client'

import { useState, useEffect } from 'react'
import {
  Container,
  Title,
  Grid,
  Card,
  Group,
  Text,
  Badge,
  Select,
  SimpleGrid,
  LoadingOverlay,
  Alert,
} from '@mantine/core'
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'
import {
  IconTrendingUp,
  IconTrendingDown,
  IconTrendingUp,
  IconCash,
  IconFileText,
  IconUsers,
  IconClock,
  IconCheck,
  IconX,
} from '@tabler/icons-react'
import { useAppSelector, useAppDispatch } from '@/lib/store'
import { setRkaFiscalYear } from '@/lib/uiSlice'
import { BudgetUtilizationChart } from '@/components/charts/BudgetUtilizationChart'
import { MultiIndicatorTrendChart } from '@/components/charts/MultiIndicatorTrendChart'
import { formatCurrency, formatNumber } from '@/lib/utils/format'
import { usePermissions } from '@/hooks/usePermissions'
import { useDashboardData } from '@/hooks/useDashboardData'

const COLORS = ['#1976d2', '#dc3912', '#ff9900', '#109618', '#990099', '#0099c6']

interface ChartData {
  name: string
  value: number
  percentage: number
}

interface MonthlyData {
  month: string
  pagu: number
  realisasi: number
  target: number
}

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  color?: string
  loading?: boolean
}

function KPICard({ title, value, subtitle, trend, trendValue, color = 'blue', loading = false }: KPICardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <IconTrendingUp size={16} color="green" />
      case 'down':
        return <IconTrendingDown size={16} color="red" />
      default:
        return <IconTrendingUp size={16} color="gray" />
    }
  }

  return (
    <Card p="md" withBorder h="140px">
      <Group justify="space-between" mb="xs">
        <Text size="sm" color="dimmed">{title}</Text>
        {trend && (
          <Group gap="xs" align="center">
            {getTrendIcon()}
            <Text size="xs" color={trend === 'up' ? 'green' : trend === 'down' ? 'red' : 'gray'}>
              {trendValue}
            </Text>
          </Group>
        )}
      </Group>
      <Text size="lg" weight={600} color={color}>
        {loading ? '...' : value}
      </Text>
      {subtitle && (
        <Text size="xs" color="dimmed">
          {subtitle}
        </Text>
      )}
    </Card>
  )
}

export default function Dashboard() {
  const dispatch = useAppDispatch()
  const { fiscalYear } = useAppSelector(state => state.filters.rka)
  const { canViewReports } = usePermissions()

  // Get real-time dashboard data from Convex
  const {
    loading,
    summary,
    npds,
    accounts,
    totalPagu,
    totalRealisasi,
    utilizationRate,
    monthlyData,
    pieData,
    statusData
  } = useDashboardData()

  // Calculate KPIs from real data
  const kpis = {
    completedNPDs: summary?.byStatus?.final || 0,
    pendingNPDs: summary?.byStatus?.diajukan || 0,
    totalSP2D: summary?.total || 0,
    finalizedSP2D: summary?.byStatus?.final || 0,
    avgPerformanceRate: summary?.avgPerformanceRate || 0,
    highPerformingIndicators: summary?.highPerformingIndicators || 0
  }

  // Generate fiscal years
  const generateFiscalYears = () => {
    const currentYear = new Date().getFullYear()
    const years = []
    for (let i = currentYear; i >= currentYear - 5; i--) {
      years.push({ value: i, label: i.toString() })
    }
    return years
  }

  // Handle fiscal year change
  const handleFiscalYearChange = (value: number | null) => {
    if (value) {
      dispatch(setRkaFiscalYear(value))
    }
  }

  useEffect(() => {
    // Initial load is handled by useDashboardData hook
  }, [])

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px',
        }}>
          <p style={{ margin: 0, fontWeight: 'bold' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ margin: 0, color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <Container size="xl" py="md">
      <LoadingOverlay visible={loading} />

      {/* Header */}
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2}>Dashboard</Title>
          <Text color="dimmed" size="sm">
            Ringkasan Kinerja Anggaran {fiscalYear}
          </Text>
        </div>

        <Select
          placeholder="Pilih Tahun Anggaran"
          data={generateFiscalYears()}
          value={fiscalYear}
          onChange={handleFiscalYearChange}
          w={200}
          searchable={false}
          clearable={false}
        />
      </Group>

      {/* KPI Cards */}
      <SimpleGrid cols={{ base: 2, sm: 2, md: 4 }} spacing="md" mb="lg">
        <KPICard
          title="Total Pagu"
          value={formatCurrency(totalPagu)}
          subtitle={`Anggaran tahun ${fiscalYear}`}
          color="blue"
          loading={loading}
        />
        <KPICard
          title="Realisasi"
          value={formatCurrency(totalRealisasi)}
          subtitle={`${utilizationRate.toFixed(1)}% terpakai`}
          trend="up"
          trendValue={`${(utilizationRate - 65)}% dari tahun lalu`}
          color="green"
          loading={loading}
        />
        <KPICard
          title="Sisa Pagu"
          value={formatCurrency(totalPagu - totalRealisasi)}
          subtitle={`${(100 - utilizationRate).toFixed(1)}% tersisa`}
          trend="down"
          trendValue={`${(100 - utilizationRate) - 35}% dari tahun lalu`}
          color="orange"
          loading={loading}
        />
        <KPICard
          title="Program Aktif"
          value={`${accounts?.length || 0} Program`}
          subtitle="Aktif saat ini"
          color="purple"
          loading={loading}
        />
      </SimpleGrid>

      {/* SP2D KPI Cards */}
      <SimpleGrid cols={{ base: 2, sm: 2, md: 4 }} spacing="md" mb="lg">
        <KPICard
          title="Total SP2D"
          value={summary?.total || 0}
          subtitle={`${summary?.byStatus?.final || 0} selesai, ${summary?.byStatus?.diajukan || 0} menunggu`}
          color="cyan"
          loading={loading}
        />
        <KPICard
          title="Nilai SP2D"
          value={formatCurrency(summary?.totalNilai || 0)}
          subtitle="Total nilai cair"
          trend="up"
          trendValue="12% dari bulan lalu"
          color="teal"
          loading={loading}
        />
        <KPICard
          title="Efisiensi SP2D"
          value={`${summary?.total ? Math.round((summary.byStatus.final || 0) / summary.total * 100) : 0}%`}
          subtitle="Rata-rata proses"
          color="lime"
          loading={loading}
        />
        <KPICard
          title="Kinerja"
          value={`${(summary?.avgPerformanceRate || 0).toFixed(1)}%`}
          subtitle={`${summary?.highPerformingIndicators || 0} indikator tinggi`}
          trend="up"
          trendValue="5.2% dari target"
          color="indigo"
          loading={loading}
        />
      </SimpleGrid>

      {/* Budget Utilization Charts */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="md" mb="lg">
        <Card p="lg" withBorder>
          <Title order={4} mb="md">Analisis Budget & Utilisasi</Title>
          <BudgetUtilizationChart
            data={accounts || []}
            height={400}
            title="Budget Utilisasi per Akun"
            showExport={true}
          />
        </Card>

        <Card p="lg" withBorder>
          <Title order={4} mb="md">Tren Performansi Multi-Indikator</Title>
          <MultiIndicatorTrendChart
            indicators={statusData?.indicators || []}
            height={450}
            title="Tren Performansi"
            showExport={true}
            onRefresh={() => window.location.reload()}
          />
        </Card>
      </SimpleGrid>

      {/* NPD Status */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" mb="lg">
        <Card p="md" withBorder>
          <Group justify="space-between" mb="md">
            <Text size="lg" weight={600}>Status NPD</Text>
            <IconFileText size={20} color="blue" />
          </Group>
          <Grid>
            <Grid.Col span={4}>
              <Group>
                <Badge color="green" variant="light" size="lg">
                  <IconCheck size={16} />
                </Badge>
                <div>
                  <Text size="lg" weight={600}>{kpis.completedNPDs}</Text>
                  <Text size="xs" color="dimmed">Selesai</Text>
                </div>
              </Group>
            </Grid.Col>
            <Grid.Col span={4}>
              <Group>
                <Badge color="yellow" variant="light" size="lg">
                  <IconClock size={16} />
                </Badge>
                <div>
                  <Text size="lg" weight={600}>{kpis.pendingNPDs}</Text>
                  <Text size="xs" color="dimmed">Dalam Proses</Text>
                </div>
              </Group>
            </Grid.Col>
            <Grid.Col span={4}>
              <Group>
                <Badge color="blue" variant="light" size="lg">
                  <IconFileText size={16} />
                </Badge>
                <div>
                  <Text size="lg" weight={600}>{kpis.pendingNPDs + kpis.completedNPDs}</Text>
                  <Text size="xs" color="dimmed">Total NPD</Text>
                </div>
              </Group>
            </Grid.Col>
          </Grid>
        </Card>
      </SimpleGrid>
    </Container>
  )
}
