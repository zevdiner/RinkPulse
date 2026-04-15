import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { cacheLife, cacheTag } from 'next/cache'
import { getSkaterStats, playerHeadshotUrl } from '@/lib/nhl-api'
import PlayerSearchNav from '@/components/PlayerSearchNav'

export const metadata: Metadata = {
  title: 'Players — RinkPulse',
  description: 'Browse current NHL scoring leaders or search any player to see their career arc, advanced percentiles, and historical comparisons.',
}

interface TopSkater {
  playerId: number
  name: string
  team: string
  position: string
  headshot: string
  gamesPlayed: number
  goals: number
  assists: number
  points: number
}

async function fetchTopScorers(): Promise<TopSkater[]> {
  'use cache'
  cacheLife('hours')
  cacheTag('top-scorers')
  const skaters = await getSkaterStats('points', 30)
  return skaters.map(s => ({
    playerId:    s.playerId,
    name:        s.skaterFullName,
    team:        s.teamAbbrevs?.split(',')[0].trim() ?? '',
    position:    s.positionCode,
    headshot:    playerHeadshotUrl(s.playerId),
    gamesPlayed: s.gamesPlayed,
    goals:       s.goals,
    assists:     s.assists,
    points:      s.points,
  }))
}

export default function PlayersPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Players</h1>
        <p className="text-[var(--text-secondary)] mt-1 text-sm">
          Search any NHL player to see their profile, or browse current scoring leaders below.
        </p>
      </div>

      {/* Search */}
      <div className="mb-10">
        <PlayerSearchNav />
      </div>

      {/* Top scorers */}
      <Suspense fallback={<TopScorersSkeleton />}>
        <TopScorers />
      </Suspense>
    </div>
  )
}

async function TopScorers() {
  const leaders = await fetchTopScorers()

  if (leaders.length === 0) {
    return (
      <p className="text-sm text-[var(--text-muted)] text-center py-10">
        Could not load current leaders. Try refreshing.
      </p>
    )
  }

  return (
    <div>
      <h2 className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-widest mb-4">
        2025–26 Points Leaders
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {leaders.map((p, i) => (
          <Link
            key={p.playerId}
            href={`/players/${p.playerId}`}
            className="card p-4 flex items-center gap-3 hover:border-[var(--accent-blue)]/50 transition-all group"
          >
            {/* Rank */}
            <span className="text-xs text-[var(--text-muted)] tabular-nums w-5 shrink-0 text-right">
              {i + 1}
            </span>

            {/* Headshot */}
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[var(--border)] shrink-0">
              <Image
                src={p.headshot}
                alt={p.name}
                fill
                className="object-cover object-top"
                unoptimized
              />
            </div>

            {/* Name + team */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors leading-snug">
                {p.name}
              </div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">
                {p.position} · {p.team}
              </div>
            </div>

            {/* Stat */}
            <div className="text-right shrink-0">
              <div className="text-xl font-bold tabular-nums text-[var(--text-primary)]">{p.points}</div>
              <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">PTS</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function TopScorersSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="card p-4 flex items-center gap-3">
          <div className="skeleton w-5 h-4 rounded" />
          <div className="skeleton w-10 h-10 rounded-full" />
          <div className="flex-1">
            <div className="skeleton h-4 w-24 mb-1.5" />
            <div className="skeleton h-3 w-16" />
          </div>
          <div className="skeleton h-7 w-8" />
        </div>
      ))}
    </div>
  )
}
