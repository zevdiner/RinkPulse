'use client'

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'

export interface CareerArcPoint {
  season: string   // e.g. "2019-20"
  points: number | null
  goals: number | null
}

interface Props {
  data: CareerArcPoint[]
  isGoalie?: boolean
}

const TOOLTIP_STYLE = {
  background: '#0c1428',
  border: '1px solid #1a2a4a',
  borderRadius: 8,
  fontSize: 12,
  color: '#e8f0ff',
}
const LABEL_STYLE = { color: '#8ba0c8' }

export default function CareerArcChart({ data, isGoalie }: Props) {
  if (data.length < 2) return null

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: -10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
        <XAxis
          dataKey="season"
          tick={{ fill: '#4a5f88', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: '#4a5f88', fontSize: 10 }}
          tickLine={false}
          axisLine={false}
          width={28}
          allowDecimals={false}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={LABEL_STYLE} />
        <Legend
          iconType="plainline"
          wrapperStyle={{ fontSize: 11, color: '#8ba0c8', paddingTop: 8 }}
        />
        {isGoalie ? (
          <Line
            type="monotone"
            dataKey="wins"
            name="Wins"
            stroke="#4a90f7"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: '#4a90f7' }}
            connectNulls
          />
        ) : (
          <>
            <Line
              type="monotone"
              dataKey="points"
              name="Points"
              stroke="#4a90f7"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#4a90f7' }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="goals"
              name="Goals"
              stroke="#ef4444"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
              activeDot={{ r: 3, fill: '#ef4444' }}
              connectNulls
            />
          </>
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}
