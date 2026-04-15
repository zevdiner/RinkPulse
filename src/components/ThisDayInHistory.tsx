import { cacheLife, cacheTag } from 'next/cache'
import { getGamesOnDate } from '@/lib/nhl-api'
import type { NHLHistoricalGame } from '@/lib/nhl-api'

// ─── Scoring ──────────────────────────────────────────────────────────────────

function scoreGame(game: NHLHistoricalGame): number {
  let score = 0
  if (game.gameType === 3) score += 100 // playoff
  const combined = (game.homeTeam.score ?? 0) + (game.awayTeam.score ?? 0)
  score += combined * 3
  const period = game.gameOutcome?.lastPeriodType
  if (period === 'OT' || period === 'SO') score += 20
  return score
}

// ─── Component ────────────────────────────────────────────────────────────────

export default async function ThisDayInHistory() {
  'use cache'
  cacheLife('days')
  cacheTag('this-day-history')

  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  // Fetch games for today's month/day across 2015–2024 in parallel
  const years = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024]
  const settled = await Promise.allSettled(
    years.map(year => getGamesOnDate(`${year}-${month}-${day}`))
  )

  // Flatten all games with their year embedded in gameDate
  const allGames: NHLHistoricalGame[] = settled.flatMap(result =>
    result.status === 'fulfilled' ? result.value : []
  )

  if (allGames.length === 0) return null

  // Pick the most notable game
  const best = allGames.reduce<NHLHistoricalGame | null>((top, game) => {
    if (!top) return game
    return scoreGame(game) > scoreGame(top) ? game : top
  }, null)

  if (!best) return null

  // Parse year from gameDate (YYYY-MM-DD)
  const year = best.gameDate.slice(0, 4)
  const awayAbbrev = best.awayTeam.abbrev
  const homeAbbrev = best.homeTeam.abbrev
  const awayScore = best.awayTeam.score ?? 0
  const homeScore = best.homeTeam.score ?? 0
  const period = best.gameOutcome?.lastPeriodType
  const suffix = period === 'OT' ? ' OT' : period === 'SO' ? ' SO' : ''
  const isPlayoff = best.gameType === 3
  const contextLabel = isPlayoff ? 'Playoff game' : 'Regular season'

  // Build score string: away team listed first, higher score listed prominently
  const scoreStr = `${awayAbbrev} ${awayScore}, ${homeAbbrev} ${homeScore}${suffix}`

  return (
    <div className="mb-6">
      <div className="card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Amber accent bar */}
        <div className="w-1 self-stretch rounded-full bg-amber-500/60 shrink-0 hidden sm:block" />

        <div className="flex-1 min-w-0">
          {/* Badge */}
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              On This Day
            </span>
          </div>

          {/* Year + matchup */}
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-2xl font-bold tabular-nums text-[var(--text-primary)]">
              {year}
            </span>
            <span className="text-base font-semibold text-[var(--text-primary)] truncate">
              {scoreStr}
            </span>
          </div>

          {/* Context */}
          <div className="mt-1 text-xs text-[var(--text-muted)]">
            {contextLabel}
            {isPlayoff && (
              <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400">
                Playoffs
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
