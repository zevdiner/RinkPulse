'use client'

export interface PercentileEntry {
  label: string
  description: string
  value: string        // formatted display value
  percentile: number   // 0–100
}

interface Props {
  entries: PercentileEntry[]
  season: string
}

function barColor(p: number): string {
  if (p >= 97) return '#f59e0b'  // amber — elite
  if (p >= 90) return '#4a90f7'  // blue — excellent
  if (p >= 75) return '#22c55e'  // green — above average
  return '#4a5f88'               // muted — average/below
}

function tierLabel(p: number): string {
  if (p >= 97) return 'Elite'
  if (p >= 90) return 'Excellent'
  if (p >= 75) return 'Above avg'
  if (p >= 50) return 'Average'
  return 'Below avg'
}

export default function PercentileBars({ entries, season }: Props) {
  if (entries.length === 0) return null

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-[var(--text-muted)]">
        Compared to all skater seasons (2008–2026) with 50+ games played.
      </p>
      {entries.map(e => {
        const color = barColor(e.percentile)
        return (
          <div key={e.label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">{e.label}</span>
                <span className="text-[10px] text-[var(--text-muted)]">{e.description}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tabular-nums" style={{ color }}>{e.value}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{ background: `${color}22`, color }}>
                  {tierLabel(e.percentile)}
                </span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${e.percentile}%`, background: color }}
              />
            </div>
            <div className="flex justify-between mt-0.5 text-[9px] text-[var(--text-muted)]">
              <span>0th</span>
              <span>{e.percentile}th percentile</span>
              <span>99th</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
