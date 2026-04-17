import { formatSeason } from '@/lib/utils'
import type { NHLSeasonTotal } from '@/types'

interface Props {
  seasons: NHLSeasonTotal[]
  isGoalie: boolean
  currentSeason: number
}

export default function SeasonTable({ seasons, isGoalie, currentSeason }: Props) {
  if (seasons.length === 0) return null

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] border-b border-[var(--border)]">
            <th className="text-left py-2 pr-4 font-medium">Season</th>
            <th className="text-left py-2 pr-4 font-medium">Team</th>
            <th className="text-right py-2 px-2 font-medium">GP</th>
            {isGoalie ? (
              <>
                <th className="text-right py-2 px-2 font-medium">W</th>
                <th className="text-right py-2 px-2 font-medium">L</th>
                <th className="text-right py-2 px-2 font-medium">OTL</th>
                <th className="text-right py-2 px-2 font-medium">SV%</th>
                <th className="text-right py-2 px-2 font-medium">GAA</th>
                <th className="text-right py-2 px-2 font-medium">SO</th>
              </>
            ) : (
              <>
                <th className="text-right py-2 px-2 font-medium">G</th>
                <th className="text-right py-2 px-2 font-medium">A</th>
                <th className="text-right py-2 px-2 font-medium">PTS</th>
                <th className="text-right py-2 px-2 font-medium">+/−</th>
                <th className="text-right py-2 px-2 font-medium">PPG</th>
                <th className="text-right py-2 px-2 font-medium hidden sm:table-cell">SOG</th>
                <th className="text-right py-2 pl-2 font-medium hidden sm:table-cell">SH%</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {seasons.map((s, i) => {
            const isCurrent = s.season === currentSeason
            const teamAbbrev = s.teamAbbrev?.default ?? (s.teamName?.default ?? '—')
            return (
              <tr
                key={`${s.season}-${i}`}
                className={`border-b border-[var(--border)] last:border-0 transition-colors ${
                  isCurrent
                    ? 'bg-[var(--accent-blue-dim)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-white/3'
                }`}
              >
                <td className="py-2 pr-4 font-medium whitespace-nowrap">
                  {formatSeason(s.season)}
                  {isCurrent && (
                    <span className="ml-1.5 text-[9px] font-bold text-[var(--accent-blue)] uppercase tracking-wider">cur</span>
                  )}
                </td>
                <td className="py-2 pr-4 text-[var(--text-muted)] whitespace-nowrap">{teamAbbrev}</td>
                <td className="py-2 px-2 text-right tabular-nums">{s.gamesPlayed ?? '—'}</td>
                {isGoalie ? (
                  <>
                    <td className="py-2 px-2 text-right tabular-nums">{s.wins ?? '—'}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{s.losses ?? '—'}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{s.otLosses ?? '—'}</td>
                    <td className="py-2 px-2 text-right tabular-nums">
                      {(s.savePercentage ?? s.savePctg) != null ? (s.savePercentage ?? s.savePctg)!.toFixed(3) : '—'}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">
                      {s.goalsAgainstAvg != null ? s.goalsAgainstAvg.toFixed(2) : '—'}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">{s.shutouts ?? '—'}</td>
                  </>
                ) : (
                  <>
                    <td className="py-2 px-2 text-right tabular-nums">{s.goals ?? '—'}</td>
                    <td className="py-2 px-2 text-right tabular-nums">{s.assists ?? '—'}</td>
                    <td className={`py-2 px-2 text-right tabular-nums font-semibold ${isCurrent ? 'text-[var(--accent-blue)]' : ''}`}>
                      {s.points ?? '—'}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">
                      {s.plusMinus != null ? (s.plusMinus >= 0 ? `+${s.plusMinus}` : s.plusMinus) : '—'}
                    </td>
                    <td className="py-2 px-2 text-right tabular-nums">{s.powerPlayGoals ?? '—'}</td>
                    <td className="py-2 px-2 text-right tabular-nums hidden sm:table-cell">{s.shots ?? '—'}</td>
                    <td className="py-2 pl-2 text-right tabular-nums hidden sm:table-cell">
                      {s.shootingPctg != null ? `${(s.shootingPctg * 100).toFixed(1)}%` : '—'}
                    </td>
                  </>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
