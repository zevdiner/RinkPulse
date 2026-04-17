import Image from 'next/image'
import { cacheLife, cacheTag } from 'next/cache'
import { getGamesOnDate, teamLogoUrl } from '@/lib/nhl-api'
import type { NHLHistoricalGame } from '@/lib/nhl-api'

function scoreGame(game: NHLHistoricalGame): number {
  let score = 0
  if (game.gameType === 3) score += 200           // playoffs heavily weighted
  const combined = (game.homeTeam.score ?? 0) + (game.awayTeam.score ?? 0)
  score += combined * 4
  const diff = Math.abs((game.homeTeam.score ?? 0) - (game.awayTeam.score ?? 0))
  if (diff <= 1) score += 30                       // tight game bonus
  const period = game.gameOutcome?.lastPeriodType
  if (period === 'OT') score += 50
  if (period === 'SO') score += 25
  return score
}

function isNotable(game: NHLHistoricalGame): boolean {
  // Only surface genuinely interesting games
  const combined = (game.homeTeam.score ?? 0) + (game.awayTeam.score ?? 0)
  const period = game.gameOutcome?.lastPeriodType
  return (
    game.gameType === 3 ||             // any playoff game
    combined >= 9 ||                   // high-scoring
    period === 'OT' ||                 // overtime
    period === 'SO'                    // shootout
  )
}

export default async function ThisDayInHistory() {
  'use cache'
  cacheLife('days')
  cacheTag('this-day-history')

  const today = new Date()
  const currentYear = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  // Fetch today's month/day from 2010 through last year
  const years = Array.from({ length: currentYear - 2010 }, (_, i) => 2010 + i)
  const settled = await Promise.allSettled(
    years.map(yr => getGamesOnDate(`${yr}-${month}-${day}`))
  )

  const allGames: NHLHistoricalGame[] = settled.flatMap(r =>
    r.status === 'fulfilled' ? r.value : []
  )

  // Filter to notable games first; fall back to top games if nothing passes
  const notable = allGames.filter(isNotable)
  const pool = notable.length >= 3 ? notable : allGames
  if (pool.length === 0) return null

  const top3 = [...pool]
    .sort((a, b) => scoreGame(b) - scoreGame(a))
    .slice(0, 3)

  function yearsAgo(game: NHLHistoricalGame) {
    const y = parseInt(game.gameDate.slice(0, 4))
    const diff = currentYear - y
    return diff === 1 ? '1 yr ago' : `${diff} yrs ago`
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
          On This Day in NHL History
        </span>
        <span className="text-[10px] text-[var(--text-muted)]">
          · {today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
        </span>
      </div>

      <div className="card divide-y divide-[var(--border)]">
        {top3.map((game, i) => {
          const year = game.gameDate.slice(0, 4)
          const period = game.gameOutcome?.lastPeriodType
          const isPlayoff = game.gameType === 3
          const isOT = period === 'OT'
          const isSO = period === 'SO'
          const away = game.awayTeam
          const home = game.homeTeam
          const awayWon = (away.score ?? 0) > (home.score ?? 0)

          return (
            <div key={`${game.gameDate}-${i}`} className="flex items-center gap-3 px-4 py-3.5">
              {/* Year */}
              <div className="shrink-0 w-14 text-right">
                <div className="text-sm font-bold tabular-nums text-[var(--text-primary)]">{year}</div>
                <div className="text-[10px] text-[var(--text-muted)]">{yearsAgo(game)}</div>
              </div>

              <div className="w-px h-8 bg-[var(--border)] shrink-0" />

              {/* Matchup with logos */}
              <div className="flex items-center gap-2 flex-1 min-w-0 flex-wrap">
                {/* Away team */}
                <div className={`flex items-center gap-1.5 ${awayWon ? '' : 'opacity-50'}`}>
                  <div className="relative w-6 h-6 shrink-0">
                    <Image
                      src={teamLogoUrl(away.abbrev)}
                      alt={away.abbrev}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">{away.abbrev}</span>
                  <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">{away.score}</span>
                </div>

                <span className="text-[var(--text-muted)] text-xs">–</span>

                {/* Home team */}
                <div className={`flex items-center gap-1.5 ${!awayWon ? '' : 'opacity-50'}`}>
                  <span className="text-sm font-bold tabular-nums text-[var(--text-primary)]">{home.score}</span>
                  <span className="text-xs font-semibold text-[var(--text-secondary)]">{home.abbrev}</span>
                  <div className="relative w-6 h-6 shrink-0">
                    <Image
                      src={teamLogoUrl(home.abbrev)}
                      alt={home.abbrev}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center gap-1 ml-1">
                  {isPlayoff && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 uppercase tracking-wide">
                      Playoffs
                    </span>
                  )}
                  {isOT && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-400 uppercase tracking-wide">
                      OT
                    </span>
                  )}
                  {isSO && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 uppercase tracking-wide">
                      SO
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
