import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cacheLife, cacheTag } from 'next/cache'
import type { Metadata } from 'next'
import {
  getStandings,
  getSkaterStats,
  getGoalieStats,
  getTeamRecentGames,
  teamLogoUrl,
  playerHeadshotUrl,
} from '@/lib/nhl-api'
import type { NHLSkaterStats, NHLGoalieStats, NHLScheduleGame } from '@/lib/nhl-api'
import type { NHLStandingsTeam } from '@/types'

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(
  props: { params: Promise<{ abbrev: string }> }
): Promise<Metadata> {
  const { abbrev } = await props.params
  const upper = abbrev.toUpperCase()
  return {
    title: `${upper} — RinkPulse`,
    description: `2025–26 roster stats, standings, and player profiles for the ${upper}.`,
  }
}

// ─── Cached data layer ────────────────────────────────────────────────────────

async function fetchTeamData(abbrev: string) {
  'use cache'
  cacheLife('hours')
  cacheTag(`team-${abbrev}`)

  const [standings, skaters, goalies, recentGames] = await Promise.all([
    getStandings(),
    getSkaterStats('points', 50, abbrev),
    getGoalieStats(10, abbrev),
    getTeamRecentGames(abbrev),
  ])
  return { standings, skaters, goalies, recentGames }
}

// ─── Page shell ───────────────────────────────────────────────────────────────

export default function TeamPage(props: { params: Promise<{ abbrev: string }> }) {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Suspense fallback={<TeamSkeleton />}>
        <TeamContent params={props.params} />
      </Suspense>
    </div>
  )
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TeamSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="card p-6 h-36 skeleton" />
      <div className="card p-5 h-56 skeleton" />
      <div className="card p-5 h-64 skeleton" />
    </div>
  )
}

// ─── Content ──────────────────────────────────────────────────────────────────

async function TeamContent({ params }: { params: Promise<{ abbrev: string }> }) {
  const { abbrev } = await params
  const upper = abbrev.toUpperCase()

  const { standings, skaters, goalies, recentGames } = await fetchTeamData(upper)

  const teamStanding: NHLStandingsTeam | undefined = standings.find(
    t => t.teamAbbrev.default === upper
  )

  if (!teamStanding && skaters.length === 0) notFound()

  const logoUrl = teamStanding?.teamLogo ?? teamLogoUrl(upper)
  const teamName = teamStanding?.teamCommonName.default ?? upper
  const fullName = teamStanding
    ? `${teamStanding.teamPlaceName.default} ${teamStanding.teamCommonName.default}`
    : upper

  const W = teamStanding?.wins ?? 0
  const L = teamStanding?.losses ?? 0
  const OTL = teamStanding?.otLosses ?? 0
  const PTS = teamStanding?.points ?? 0
  const GP = teamStanding?.gamesPlayed ?? 0
  const GF = teamStanding?.goalFor ?? 0
  const GA = teamStanding?.goalAgainst ?? 0
  const divAbbrev = teamStanding?.divisionAbbrev ?? ''
  const confAbbrev = teamStanding?.conferenceAbbrev ?? ''
  const streak = teamStanding ? `${teamStanding.streakCode}${teamStanding.streakCount}` : '—'

  const divNames: Record<string, string> = {
    A: 'Atlantic', M: 'Metropolitan', C: 'Central', P: 'Pacific',
  }
  const divName = divNames[divAbbrev] ?? divAbbrev

  return (
    <>
      {/* Back nav */}
      <Link
        href="/teams"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors mb-6"
      >
        ← Teams
      </Link>

      {/* Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-5 items-start">
          <div className="relative w-24 h-24 shrink-0">
            <Image src={logoUrl} alt={upper} fill className="object-contain" unoptimized priority />
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">{fullName}</h1>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              {divName && confAbbrev
                ? `${divName} Division · ${confAbbrev === 'E' ? 'Eastern' : 'Western'} Conference`
                : upper}
            </p>

            <div className="mt-4 flex flex-wrap gap-5">
              {[
                { label: 'Record', value: `${W}–${L}–${OTL}` },
                { label: 'Points', value: PTS },
                { label: 'GP', value: GP },
                { label: 'GF', value: GF },
                { label: 'GA', value: GA },
                { label: 'GF/GP', value: GP > 0 ? (GF / GP).toFixed(2) : '—' },
                { label: 'Streak', value: streak },
              ].map(item => (
                <div key={item.label}>
                  <div className="text-xl font-bold tabular-nums text-[var(--text-primary)]">{item.value}</div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent games */}
      {recentGames.length > 0 && (
        <div className="card overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-[var(--border)]">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Recent Games</h2>
          </div>
          <div className="divide-y divide-[var(--border)]/50">
            {recentGames.map((game: NHLScheduleGame) => {
              const awayAbbrev = game.awayTeam?.abbrev ?? ''
              const homeAbbrev = game.homeTeam?.abbrev ?? ''
              const isHome = homeAbbrev === upper
              const opponentAbbrev = isHome ? awayAbbrev : homeAbbrev
              const myScore = isHome ? (game.homeTeam?.score ?? 0) : (game.awayTeam?.score ?? 0)
              const oppScore = isHome ? (game.awayTeam?.score ?? 0) : (game.homeTeam?.score ?? 0)
              const won = myScore > oppScore
              const period = game.gameOutcome?.lastPeriodType
              const suffix = period === 'OT' ? ' OT' : period === 'SO' ? ' SO' : ''

              return (
                <div key={game.id} className="flex items-center gap-4 px-5 py-3">
                  <div className={`text-sm font-bold w-4 ${won ? 'text-green-400' : 'text-red-400'}`}>
                    {won ? 'W' : 'L'}
                  </div>
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {opponentAbbrev && (
                      <div className="relative w-6 h-6 shrink-0">
                        <Image
                          src={teamLogoUrl(opponentAbbrev)}
                          alt={opponentAbbrev}
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    )}
                    <span className="text-sm text-[var(--text-secondary)] truncate">
                      {isHome ? 'vs' : '@'} {opponentAbbrev}
                    </span>
                  </div>
                  <div className="text-sm font-bold tabular-nums text-[var(--text-primary)]">
                    {myScore}–{oppScore}{suffix}
                  </div>
                  <div className="text-xs text-[var(--text-muted)] tabular-nums w-20 text-right hidden sm:block">
                    {game.gameDate
                      ? new Date(game.gameDate + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : ''}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Skaters */}
      {skaters.length > 0 && (
        <div className="card overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-[var(--border)]">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Skaters</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="text-left px-4 py-2.5 w-8">#</th>
                  <th className="text-left px-2 py-2.5">Player</th>
                  <th className="text-center px-2 py-2.5">GP</th>
                  <th className="text-center px-2 py-2.5">G</th>
                  <th className="text-center px-2 py-2.5">A</th>
                  <th className="text-center px-2 py-2.5 font-semibold text-[var(--text-secondary)]">PTS</th>
                  <th className="text-center px-2 py-2.5 hidden md:table-cell">+/−</th>
                  <th className="text-center px-2 py-2.5 hidden md:table-cell">PPG</th>
                  <th className="text-center px-2 py-2.5 hidden md:table-cell">GWG</th>
                </tr>
              </thead>
              <tbody>
                {skaters.map((s: NHLSkaterStats, i) => {
                  const pm = (s.plusMinus ?? 0) >= 0 ? `+${s.plusMinus ?? 0}` : `${s.plusMinus}`
                  return (
                    <tr
                      key={s.playerId}
                      className="border-b border-[var(--border)]/50 hover:bg-white/3 transition-colors"
                    >
                      <td className="px-4 py-2.5 text-[var(--text-muted)] text-xs tabular-nums">{i + 1}</td>
                      <td className="px-2 py-2.5">
                        <Link
                          href={`/players/${s.playerId}`}
                          className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                        >
                          <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[var(--border)] shrink-0">
                            <Image
                              src={playerHeadshotUrl(s.playerId)}
                              alt={s.skaterFullName}
                              fill
                              className="object-cover object-top"
                              unoptimized
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-[var(--text-primary)] truncate">{s.skaterFullName}</div>
                            <div className="text-xs text-[var(--text-muted)]">{s.positionCode}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-2 py-2.5 text-center tabular-nums text-[var(--text-secondary)]">{s.gamesPlayed}</td>
                      <td className="px-2 py-2.5 text-center tabular-nums text-[var(--text-secondary)]">{s.goals}</td>
                      <td className="px-2 py-2.5 text-center tabular-nums text-[var(--text-secondary)]">{s.assists}</td>
                      <td className="px-2 py-2.5 text-center tabular-nums font-bold text-[var(--text-primary)]">{s.points}</td>
                      <td className={`px-2 py-2.5 text-center tabular-nums text-xs hidden md:table-cell ${
                        (s.plusMinus ?? 0) > 0 ? 'text-green-400' : (s.plusMinus ?? 0) < 0 ? 'text-red-400' : 'text-[var(--text-muted)]'
                      }`}>
                        {pm}
                      </td>
                      <td className="px-2 py-2.5 text-center tabular-nums text-xs text-[var(--text-secondary)] hidden md:table-cell">
                        {s.powerPlayGoals ?? 0}
                      </td>
                      <td className="px-2 py-2.5 text-center tabular-nums text-xs text-[var(--text-secondary)] hidden md:table-cell">
                        {'—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)]">
            {skaters.length} skaters · 2025–26 regular season · NHL API
          </div>
        </div>
      )}

      {/* Goalies */}
      {goalies.length > 0 && (
        <div className="card overflow-hidden mb-6">
          <div className="px-5 py-3 border-b border-[var(--border)]">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">Goalies</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="text-left px-4 py-2.5">Goalie</th>
                  <th className="text-center px-2 py-2.5">GP</th>
                  <th className="text-center px-2 py-2.5">GS</th>
                  <th className="text-center px-2 py-2.5">W</th>
                  <th className="text-center px-2 py-2.5">L</th>
                  <th className="text-center px-2 py-2.5">OTL</th>
                  <th className="text-center px-2 py-2.5 font-semibold text-[var(--text-secondary)]">SV%</th>
                  <th className="text-center px-2 py-2.5">GAA</th>
                  <th className="text-center px-2 py-2.5 hidden sm:table-cell">SO</th>
                </tr>
              </thead>
              <tbody>
                {goalies.map((g: NHLGoalieStats) => (
                  <tr
                    key={g.playerId}
                    className="border-b border-[var(--border)]/50 hover:bg-white/3 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        href={`/players/${g.playerId}`}
                        className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                      >
                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[var(--border)] shrink-0">
                          <Image
                            src={playerHeadshotUrl(g.playerId)}
                            alt={g.goalieFullName}
                            fill
                            className="object-cover object-top"
                            unoptimized
                          />
                        </div>
                        <div className="font-semibold text-[var(--text-primary)] truncate">{g.goalieFullName}</div>
                      </Link>
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-[var(--text-secondary)]">{g.gamesPlayed}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-[var(--text-secondary)]">{g.gamesStarted}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-[var(--text-secondary)]">{g.wins}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-[var(--text-secondary)]">{g.losses}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-[var(--text-secondary)]">{g.otLosses}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums font-bold text-[var(--text-primary)]">
                      {g.savePctg != null ? g.savePctg.toFixed(3) : '—'}
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-[var(--text-secondary)]">
                      {g.goalsAgainstAverage != null ? g.goalsAgainstAverage.toFixed(2) : '—'}
                    </td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-[var(--text-secondary)] hidden sm:table-cell">
                      {g.shutouts ?? 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Lines CTA */}
      <div className="card p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Line Combinations</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Search {teamName} line combos — xG%, Corsi, Fenwick, and more.
          </p>
        </div>
        <Link
          href={`/lines?team=${upper}`}
          className="shrink-0 px-4 py-2 rounded-lg bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] text-sm font-medium hover:bg-[var(--accent-blue)] hover:text-white transition-all border border-[var(--accent-blue)]/30"
        >
          View Lines →
        </Link>
      </div>
    </>
  )
}
