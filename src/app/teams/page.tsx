import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cacheLife, cacheTag } from 'next/cache'
import type { Metadata } from 'next'
import { getStandings } from '@/lib/nhl-api'
import type { NHLStandingsTeam } from '@/types'

export const metadata: Metadata = {
  title: 'Teams — RinkPulse',
  description: '2025–26 NHL standings and team pages for all 32 teams.',
}

export default function TeamsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">NHL Teams</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          2025–26 standings — click any team for roster, stats, and more.
        </p>
      </div>
      <Suspense fallback={<StandingsSkeleton />}>
        <StandingsView />
      </Suspense>
    </div>
  )
}

async function StandingsView() {
  'use cache'
  cacheLife('hours')
  cacheTag('standings')

  const teams = await getStandings()
  if (teams.length === 0) {
    return (
      <p className="text-[var(--text-muted)] text-sm py-12 text-center">
        Standings unavailable right now — check back soon.
      </p>
    )
  }

  // Group by conference → division
  const grouped: Record<string, Record<string, NHLStandingsTeam[]>> = {}
  for (const t of teams) {
    const conf = t.conferenceAbbrev ?? 'Other'
    const div = t.divisionAbbrev ?? 'Other'
    if (!grouped[conf]) grouped[conf] = {}
    if (!grouped[conf][div]) grouped[conf][div] = []
    grouped[conf][div].push(t)
  }

  // Sort conferences: Eastern first
  const confOrder = ['E', 'W']
  const sortedConfs = Object.keys(grouped).sort(
    (a, b) => confOrder.indexOf(a) - confOrder.indexOf(b)
  )

  return (
    <div className="flex flex-col gap-10">
      {sortedConfs.map(conf => (
        <div key={conf}>
          <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">
            {conf === 'E' ? 'Eastern Conference' : conf === 'W' ? 'Western Conference' : conf}
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {Object.entries(grouped[conf])
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([div, divTeams]) => (
                <DivisionTable key={div} div={div} teams={divTeams} />
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function DivisionTable({ div, teams }: { div: string; teams: NHLStandingsTeam[] }) {
  const sorted = [...teams].sort((a, b) => b.points - a.points)
  const divName: Record<string, string> = {
    A: 'Atlantic', M: 'Metropolitan', C: 'Central', P: 'Pacific',
  }

  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-elevated,#16181f)]">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">
          {divName[div] ?? div} Division
        </h3>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            <th className="text-left px-4 py-2">Team</th>
            <th className="text-center px-2 py-2">GP</th>
            <th className="text-center px-2 py-2">W</th>
            <th className="text-center px-2 py-2">L</th>
            <th className="text-center px-2 py-2">OTL</th>
            <th className="text-center px-2 py-2 font-bold text-[var(--text-secondary)]">PTS</th>
            <th className="text-center px-2 py-2 hidden sm:table-cell">Streak</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((team, i) => {
            const abbrev = team.teamAbbrev.default
            return (
              <tr
                key={abbrev}
                className="border-b border-[var(--border)]/50 hover:bg-white/3 transition-colors"
              >
                <td className="px-4 py-2.5">
                  <Link
                    href={`/teams/${abbrev}`}
                    className="flex items-center gap-2.5 hover:opacity-80 transition-opacity group"
                  >
                    <span className="text-xs text-[var(--text-muted)] tabular-nums w-4 shrink-0">
                      {i + 1}
                    </span>
                    <div className="relative w-7 h-7 shrink-0">
                      <Image
                        src={team.teamLogo}
                        alt={abbrev}
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors truncate">
                        {team.teamCommonName.default}
                      </div>
                      <div className="text-[10px] text-[var(--text-muted)]">{abbrev}</div>
                    </div>
                  </Link>
                </td>
                <td className="px-2 py-2.5 text-center tabular-nums text-[var(--text-secondary)]">
                  {team.gamesPlayed}
                </td>
                <td className="px-2 py-2.5 text-center tabular-nums text-[var(--text-secondary)]">
                  {team.wins}
                </td>
                <td className="px-2 py-2.5 text-center tabular-nums text-[var(--text-secondary)]">
                  {team.losses}
                </td>
                <td className="px-2 py-2.5 text-center tabular-nums text-[var(--text-secondary)]">
                  {team.otLosses}
                </td>
                <td className="px-2 py-2.5 text-center tabular-nums font-bold text-[var(--text-primary)]">
                  {team.points}
                </td>
                <td className="px-2 py-2.5 text-center tabular-nums text-xs hidden sm:table-cell">
                  <span className={`${team.streakCode === 'W' ? 'text-green-400' : team.streakCode === 'L' ? 'text-red-400' : 'text-[var(--text-muted)]'}`}>
                    {team.streakCode}{team.streakCount}
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function StandingsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border)] skeleton h-9" />
          {Array.from({ length: 8 }).map((_, j) => (
            <div key={j} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]/50">
              <div className="skeleton w-5 h-4" />
              <div className="skeleton w-7 h-7 rounded" />
              <div className="skeleton h-4 w-28 flex-1" />
              <div className="skeleton h-4 w-6" />
              <div className="skeleton h-4 w-6" />
              <div className="skeleton h-4 w-6" />
              <div className="skeleton h-4 w-6" />
              <div className="skeleton h-4 w-8" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
