'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart,
  BarChart,
  Bar,
} from 'recharts'

interface PerformanceChartProps {
  data: Array<{
    periode: string
    indikatorNama: string
    target: number
    realisasi: number
    persenCapaian: number
  }>
  width?: number
  height?: number
  onPointClick?: (data: any, index: number) => void
}

interface CustomTooltipProps {
  active?: boolean
  payload?: any
  label?: string
  content?: React.ReactNode
}

const CustomTooltip = ({ active, payload, label, content }: CustomTooltipProps) => {
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
        {content}
      </div>
    )
  }

  return null
}

export default function PerformanceChart({ data, width = 800, height = 400, onPointClick }: PerformanceChartProps) {
  const CustomTooltipWrapper = ({ active, payload, label, children }: any) => (
    <Tooltip
      content={<CustomTooltip active={active} payload={payload} label={label} content={children} />}
      wrapperStyle={{ outline: 'none' }}
    >
      {children}
    </Tooltip>
  )

  // Custom line untuk target
  const CustomReferenceLine = (props: any) => (
    <ReferenceLine {...props} stroke="#10b981" strokeDasharray="5 5" />
  )

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 20,
        }}
      onClick={onPointClick}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="periode"
          tick={{ fontSize: 12 }}
        />
        <YAxis
          tick={{ fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltipWrapper />} />
        <Line
          type="monotone"
          dataKey="target"
          stroke="#8884d8"
          strokeWidth={2}
          dot={{ fill: "#8884d8", strokeWidth: 2, r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="realisasi"
          stroke="#82ca9d"
          strokeWidth={2}
          dot={{ fill: "#82ca9d", strokeWidth: 2, r: 6 }}
        />
        <Line
          type="stepBefore"
          dataKey="persenCapaian"
          stroke="#ffc658"
          strokeWidth={3}
          dot={{ fill: "#ffc658", strokeWidth: 3, r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}