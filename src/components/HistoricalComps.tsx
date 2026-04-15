import { formatSeason } from '@/lib/utils'

export interface HistoricalComp {
  name: string
  season: number
  team: string
  pointsPer82: number
  goalsPer82: number
  delta: number   // absolute difference from the reference player's pts/82
}

interface Props {
  comps: HistoricalComp[]
  playerName: string
  referencePer82: number
}

export default function HistoricalComps({ comps, playerName, referencePer82 }: Props) {
  if (comps.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-[var(--text-muted)]">
        Most similar seasons to {playerName.split(' ').pop()}&apos;s current pace ({referencePer82.toFixed(1)} pts/82) from the MoneyPuck era.
      </p>
      <div className="flex flex-col gap-0">
        {comps.map((comp, i) => (
          <div
            key={`${comp.name}-${comp.season}`}
            className="flex items-center justify-between py-2.5 border-b border-[var(--border)] last:border-0"
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[var(--text-muted)] w-4 text-right shrink-0">{i + 1}</span>
              <div>
                <div className="text-sm font-medium text-[var(--text-primary)]">{comp.name}</div>
                <div className="text-xs text-[var(--text-muted)]">
                  {comp.team} · {formatSeason(comp.season)}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold tabular-nums text-[var(--accent-blue)]">
                {comp.pointsPer82.toFixed(1)} <span className="text-xs font-normal text-[var(--text-muted)]">pts/82</span>
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">
                {comp.goalsPer82.toFixed(1)} G/82
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
