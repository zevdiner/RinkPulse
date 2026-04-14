'use client'

import { cn } from '@/lib/utils'
import type { ComparisonStat, PlayerStats } from '@/types'
import { formatStat } from '@/lib/utils'

interface Props {
  stat: ComparisonStat
  p1: PlayerStats
  p2: PlayerStats
}

export default function StatBar({ stat, p1, p2 }: Props) {
  const v1 = p1[stat.key] as number | undefined
  const v2 = p2[stat.key] as number | undefined

  if (v1 === undefined && v2 === undefined) return null

  const n1 = v1 ?? 0
  const n2 = v2 ?? 0
  const max = Math.max(Math.abs(n1), Math.abs(n2)) || 1

  const pct1 = Math.round((Math.abs(n1) / max) * 100)
  const pct2 = Math.round((Math.abs(n2) / max) * 100)

  const p1Wins = stat.higherIsBetter ? n1 > n2 : n1 < n2
  const p2Wins = stat.higherIsBetter ? n2 > n1 : n2 < n1
  const tied = n1 === n2

  const label1 = formatStat(v1, stat.format)
  const label2 = formatStat(v2, stat.format)

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0">
      {/* Player 1 side */}
      <div className="flex flex-col items-end gap-1.5">
        <span className={cn(
          'text-base font-bold tabular-nums leading-none',
          !tied && p1Wins ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]',
        )}>
          {label1}
        </span>
        <div className="w-full bar-track">
          <div
            className="bar-fill-blue"
            style={{ width: `${pct1}%` }}
          />
        </div>
      </div>

      {/* Stat label */}
      <div className="text-center px-1">
        <span className="text-xs font-medium text-[var(--text-muted)] whitespace-nowrap">
          {stat.label}
        </span>
      </div>

      {/* Player 2 side */}
      <div className="flex flex-col items-start gap-1.5">
        <span className={cn(
          'text-base font-bold tabular-nums leading-none',
          !tied && p2Wins ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]',
        )}>
          {label2}
        </span>
        <div className="w-full bar-track">
          <div
            className="bar-fill-red"
            style={{ width: `${pct2}%` }}
          />
        </div>
      </div>
    </div>
  )
}
