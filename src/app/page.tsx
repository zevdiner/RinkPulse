import { Suspense } from 'react'
import Link from 'next/link'

import StoryCard from '@/components/StoryCard'
import TodayDate from '@/components/TodayDate'
import MilestoneTracker from '@/components/MilestoneTracker'
import ScoringStreaks from '@/components/ScoringStreaks'
import ThisDayInHistory from '@/components/ThisDayInHistory'
import { generateDailyStories } from '@/lib/stories'
import type { Story } from '@/types'

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">RinkPulse</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          NHL stats, stories, and historical context — updated daily.
        </p>
      </div>

      {/* Feature discovery cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-10">
        <Link href="/players" className="card p-4 flex flex-col gap-3 hover:border-[var(--accent-blue)]/60 transition-colors group">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-blue-dim)] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <circle cx="9" cy="6" r="3" stroke="#4a90f7" strokeWidth="1.5"/>
              <path d="M2 16c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#4a90f7" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">
              Players
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-snug">
              Browse &amp; search profiles — career arc, percentiles, comps
            </p>
          </div>
          <span className="text-xs text-[var(--accent-blue)] font-medium mt-auto">Browse →</span>
        </Link>

        <Link href="/leaderboard" className="card p-4 flex flex-col gap-3 hover:border-[var(--accent-blue)]/60 transition-colors group">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-blue-dim)] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <rect x="2" y="10" width="3" height="6" rx="1" fill="#4a90f7"/>
              <rect x="7.5" y="6" width="3" height="10" rx="1" fill="#4a90f7"/>
              <rect x="13" y="2" width="3" height="14" rx="1" fill="#4a90f7"/>
            </svg>
          </div>
          <div>
            <div className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">
              Leaderboard
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-snug">
              PPG pace, 50-goal seasons, 100-pt seasons since 2008
            </p>
          </div>
          <span className="text-xs text-[var(--accent-blue)] font-medium mt-auto">Explore →</span>
        </Link>

        <Link href="/compare" className="card p-4 flex flex-col gap-3 hover:border-[var(--accent-blue)]/60 transition-colors group">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-blue-dim)] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <circle cx="5" cy="9" r="3.5" stroke="#4a90f7" strokeWidth="1.5"/>
              <circle cx="13" cy="9" r="3.5" stroke="#ef4444" strokeWidth="1.5"/>
            </svg>
          </div>
          <div>
            <div className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">
              Compare
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-snug">
              Side-by-side stats with sparklines &amp; downloadable stat card
            </p>
          </div>
          <span className="text-xs text-[var(--accent-blue)] font-medium mt-auto">Compare →</span>
        </Link>

        <Link href="/teams" className="card p-4 flex flex-col gap-3 hover:border-[var(--accent-blue)]/60 transition-colors group">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-blue-dim)] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M9 2L3 5v5c0 3.5 2.5 6.5 6 7.5C15 16.5 15 13.5 15 10V5L9 2z" stroke="#4a90f7" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">
              Teams
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-snug">
              Standings, roster stats &amp; goalie splits
            </p>
          </div>
          <span className="text-xs text-[var(--accent-blue)] font-medium mt-auto">Browse →</span>
        </Link>

        <Link href="/lines" className="card p-4 flex flex-col gap-3 hover:border-[var(--accent-blue)]/60 transition-colors group">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-blue-dim)] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <polyline points="2,13 5,7 9,10 13,4 16,6" stroke="#4a90f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className="font-semibold text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">
              Lines
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-snug">
              Search any line — xG%, Corsi, Fenwick, and more
            </p>
          </div>
          <span className="text-xs text-[var(--accent-blue)] font-medium mt-auto">Search →</span>
        </Link>
      </div>

      {/* Hot Streaks */}
      <Suspense fallback={null}>
        <ScoringStreaks />
      </Suspense>

      {/* Milestone Watch */}
      <Suspense fallback={null}>
        <MilestoneTracker />
      </Suspense>

      {/* This Day in NHL History */}
      <Suspense fallback={null}>
        <ThisDayInHistory />
      </Suspense>

      {/* Stories */}
      <div className="mt-10">
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Today&apos;s Stories</h2>
            <p className="text-[var(--text-secondary)] mt-0.5 text-sm">
              <Suspense fallback="Today">
                <TodayDate />
              </Suspense>
              {' · Historically notable performances from the 2025–26 NHL season'}
            </p>
          </div>
          <span className="shrink-0 text-xs text-[var(--text-muted)] border border-[var(--border)] rounded-full px-2.5 py-1">
            Auto-updates daily
          </span>
        </div>

        <Suspense fallback={<StoriesSkeleton />}>
          <StoriesFeed />
        </Suspense>
      </div>
    </div>
  )
}

async function StoriesFeed() {
  const stories = await generateDailyStories()

  if (stories.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {stories.map((story: Story) => (
        <StoryCard key={story.id} story={story} />
      ))}
    </div>
  )
}

function StoriesSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card p-5 flex flex-col gap-4">
          <div className="skeleton h-6 w-32" />
          <div className="flex items-center gap-3">
            <div className="skeleton w-12 h-12 rounded-full" />
            <div className="flex flex-col gap-2 flex-1">
              <div className="skeleton h-4 w-3/4" />
              <div className="skeleton h-3 w-1/2" />
            </div>
          </div>
          <div className="skeleton h-9 w-24" />
          <div className="skeleton h-14 w-full" />
          <div className="skeleton h-10 w-full" />
        </div>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="w-16 h-16 rounded-full bg-[var(--accent-blue-dim)] flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <ellipse cx="14" cy="14" rx="12" ry="7" stroke="#4a90f7" strokeWidth="2" />
          <line x1="2" y1="14" x2="26" y2="14" stroke="#4a90f7" strokeWidth="2" />
        </svg>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">No stories yet today</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1 max-w-sm">
          Add your MoneyPuck CSV files to the{' '}
          <code className="text-[var(--accent-blue)]">/data</code> folder to unlock historical
          context. See <code className="text-[var(--accent-blue)]">data/README.md</code> for
          instructions.
        </p>
      </div>
    </div>
  )
}
