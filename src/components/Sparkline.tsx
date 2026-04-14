'use client'

import type { NHLGameLogEntry, SparkMetric } from '@/types'

interface Props {
  games: NHLGameLogEntry[]
  metric: SparkMetric
  color: 'blue' | 'red'
}

function parseToi(toi: string): number {
  const [m, s] = toi.split(':').map(Number)
  return (m || 0) * 60 + (s || 0)
}

function getValue(game: NHLGameLogEntry, metric: SparkMetric): number {
  if (metric === 'toi') return parseToi(game.toi)
  return game[metric]
}

const ACCENT: Record<'blue' | 'red', string> = {
  blue: '#4a90f7',
  red: '#ef4444',
}
const DIM: Record<'blue' | 'red', string> = {
  blue: 'rgba(74,144,247,0.25)',
  red: 'rgba(239,68,68,0.25)',
}

const H = 36 // total bar area height px

export default function Sparkline({ games, metric, color }: Props) {
  const last10 = games.slice(-10)
  if (!last10.length) {
    return <div className="h-9 flex items-center justify-center text-[10px] text-[var(--text-muted)] opacity-40">no data</div>
  }

  const values = last10.map(g => getValue(g, metric))
  const accent = ACCENT[color]
  const dim = DIM[color]

  if (metric === 'plusMinus') {
    // Bars grow from a center line — positive up, negative down
    const absMax = Math.max(...values.map(Math.abs), 1)
    const halfH = H / 2

    return (
      <div className="flex gap-px" style={{ height: H }} title="Last 10 games">
        {values.map((v, i) => {
          const barH = Math.max(2, Math.round((Math.abs(v) / absMax) * halfH))
          const opacity = 0.45 + (i / last10.length) * 0.55
          return (
            <div key={i} className="flex-1 flex flex-col" style={{ height: H }}>
              {/* upper half */}
              <div className="flex-1 flex items-end">
                {v > 0 && (
                  <div style={{ width: '100%', height: barH, background: accent, opacity, borderRadius: '2px 2px 0 0' }} />
                )}
              </div>
              {/* divider */}
              <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
              {/* lower half */}
              <div className="flex-1 flex items-start">
                {v < 0 && (
                  <div style={{ width: '100%', height: barH, background: dim, opacity, borderRadius: '0 0 2px 2px' }} />
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // PTS / TOI — bars grow from the bottom
  const max = Math.max(...values, 1)
  return (
    <div className="flex items-end gap-px" style={{ height: H }} title="Last 10 games">
      {values.map((v, i) => {
        const barH = Math.max(2, Math.round((v / max) * H))
        const opacity = 0.45 + (i / last10.length) * 0.55
        return (
          <div key={i} className="flex-1" style={{ height: barH, background: accent, opacity, borderRadius: '2px 2px 0 0' }} />
        )
      })}
    </div>
  )
}
