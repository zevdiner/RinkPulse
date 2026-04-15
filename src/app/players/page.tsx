import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { cacheLife, cacheTag } from 'next/cache'
import { getSkaterLeaders } from '@/lib/nhl-api'
import PlayerSearchNav from '@/components/PlayerSearchNav'
import type { NHLStatLeader } from '@/types'

export const metadata: Metadata = {
  title: 'Players — RinkPulse',
  description: 'Browse current NHL scoring leaders or search any player to see their career arc, advanced percentiles, and historical comparisons.',
}

async function fetchLeaders() {
  'use cache'
  cacheLife('hours')
  cacheTag('skater-leaders')
  return getSkaterLeaders('points', 30)
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
  const leaders = await fetchLeaders()

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
        {leaders.map((p: NHLStatLeader, i: number) => (
          <Link
            key={p.playerId}
            href={`/players/${p.playerId}`}
            className="card p-4 flex items-center gap-3 hover:border-[var(--accent-blue)]/50 transition-all group"
          >
            <span className="text-xs text-[var(--text-muted)] tabular-nums w-5 shrink-0 text-right">
              {i + 1}
            </span>
            <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[var(--border)] shrink-0">
              <Image
                src={p.headshot}
                alt={p.name?.default ?? ''}
                fill
                className="object-cover object-top"
                unoptimized
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors truncate">
                {p.name?.default}
              </div>
              <div className="text-xs text-[var(--text-muted)]">
                {p.position} · {p.teamAbbrev?.default}
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xl font-bold tabular-nums text-[var(--text-primary)]">{p.value}</div>
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
