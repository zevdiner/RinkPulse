import Image from 'next/image'
import Link from 'next/link'
import { cacheLife, cacheTag } from 'next/cache'
import { getSkaterStats, getPlayerGameLog, playerHeadshotUrl } from '@/lib/nhl-api'

interface StreakPlayer {
  playerId: number
  name: string
  team: string
  headshot: string
  streak: number
  recentG: number
  recentA: number
}

export default async function ScoringStreaks() {
  'use cache'
  cacheLife('hours')
  cacheTag('scoring-streaks')

  const topSkaters = await getSkaterStats('points', 100)
  if (topSkaters.length === 0) return null

  // Batch-fetch all game logs in parallel
  const logs = await Promise.allSettled(
    topSkaters.map(s => getPlayerGameLog(s.playerId))
  )

  const streaks: StreakPlayer[] = []

  for (let i = 0; i < topSkaters.length; i++) {
    const result = logs[i]
    if (result.status !== 'fulfilled' || !result.value?.length) continue

    // Most recent game first
    const sorted = [...result.value].sort((a, b) => b.gameDate.localeCompare(a.gameDate))

    let streak = 0
    let recentG = 0
    let recentA = 0
    for (const entry of sorted) {
      if (entry.points > 0) {
        streak++
        recentG += entry.goals
        recentA += entry.assists
      } else {
        break
      }
    }

    if (streak >= 2) {
      const s = topSkaters[i]
      const teamAbbrev = s.teamAbbrevs?.split(',')[0].trim() ?? ''
      streaks.push({
        playerId: s.playerId,
        name: s.skaterFullName,
        team: teamAbbrev,
        headshot: playerHeadshotUrl(s.playerId),
        streak,
        recentG,
        recentA,
      })
    }
  }

  if (streaks.length === 0) return null

  streaks.sort((a, b) => b.streak - a.streak)

  return (
    <section className="mt-8 mb-2">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Hot Streaks 🔥</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Active point streaks of 2+ consecutive games this season
        </p>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
        {streaks.map(player => (
          <Link
            key={player.playerId}
            href={`/players/${player.playerId}`}
            className="card flex flex-col gap-3 p-4 hover:border-[var(--border-bright)] hover:bg-[var(--bg-card-hover)] transition-all shrink-0 w-48"
          >
            {/* Identity */}
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[var(--border)] shrink-0">
                <Image
                  src={player.headshot}
                  alt={player.name}
                  fill
                  className="object-cover object-top"
                  unoptimized
                />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                  {player.name}
                </div>
                <div className="text-[10px] text-[var(--text-muted)]">{player.team}</div>
              </div>
            </div>

            {/* Streak count */}
            <div className="flex items-end gap-2">
              <div>
                <div className="text-3xl font-bold tabular-nums text-orange-400 leading-none">
                  {player.streak}
                </div>
                <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mt-0.5">
                  game streak
                </div>
              </div>
              <div className="pb-0.5 text-xs text-[var(--text-muted)] leading-tight">
                <span className="text-[var(--text-secondary)]">{player.recentG}G</span>
                {' '}
                <span className="text-[var(--text-secondary)]">{player.recentA}A</span>
                <div className="text-[10px]">in streak</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
