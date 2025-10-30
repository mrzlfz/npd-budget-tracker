'use client'

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

interface ProgressChartProps {
  data: Array<{
    indikatorNama: string
    persenCapaian: number
    target: number
    realisasi: number
  }>
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff9800', '#ff6b6b']

export default function PerformanceProgressChart({ data }: ProgressChartProps) {
  const CustomTooltip = ({ active, payload }: any) => {
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
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>
            {payload.indikatorNama}
          </div>
          <div>
            Target: {payload.target} {payload.satuan || ''}
          </div>
          <div>
            Realisasi: {payload.realisasi} {payload.satuan || ''}
          </div>
          <div>
            % Capaian: {payload.persenCapaian.toFixed(1)}%
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={({ cx, cy, midAngle, innerRadius, outerRadius }) => {
            const RADIAN = Math.PI / 180
            const radius = innerRadius + (outerRadius - innerRadius)
            const x = cx + radius * Math.cos(-midAngle * RADIAN)
            const y = cy + radius * Math.sin(-midAngle * RADIAN)

            return (
              <text
                x={x}
                y={y}
                fill="white"
                textAnchor={midAngle > Math.PI / 2 || midAngle < -Math.PI / 2 ? 'end' : 'start'}
                dominantBaseline="central"
                style={{ fontSize: '12px', fontWeight: 600 }}
              >
                {payload.persenCapaian.toFixed(1)}%
              </text>
            )
          }}
          label={({ name, percent, value }) => (
            <text
              x={cx}
              y={cy - 18}
              fill={name === 'Belum Dicapai' ? '#666' : 'white'}
              textAnchor={name === 'Belum Dicapai' ? 'middle' : 'start'}
              dominantBaseline="central"
              style={{ fontSize: '11px', fontWeight: 500 }}
            >
              {name}: {percent.toFixed(1)}%
            </text>
          )}
        >
          <Tooltip content={<CustomTooltip />} />
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
            />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  )
}