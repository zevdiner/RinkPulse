import { Suspense } from 'react'
import Link from 'next/link'
import StoryCard from '@/components/StoryCard'
import TodayDate from '@/components/TodayDate'
import MilestoneTracker from '@/components/MilestoneTracker'
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
      <div className="grid gap-4 sm:grid-cols-3 mb-10">
        <Link href="/compare" className="card p-5 flex flex-col gap-3 hover:border-[var(--accent-blue)]/60 transition-colors group">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent-blue-dim)] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="6" cy="10" r="4" stroke="#4a90f7" strokeWidth="1.5"/>
              <circle cx="14" cy="10" r="4" stroke="#ef4444" strokeWidth="1.5"/>
            </svg>
          </div>
          <div>
            <div className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">
              Compare Players
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-snug">
              Side-by-side stats across any timeframe with a downloadable stat card
            </p>
          </div>
          <span className="text-xs text-[var(--accent-blue)] font-medium mt-auto">Open tool →</span>
        </Link>

        <Link href="/players/8478402" className="card p-5 flex flex-col gap-3 hover:border-[var(--accent-blue)]/60 transition-colors group">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent-blue-dim)] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <circle cx="10" cy="7" r="3.5" stroke="#4a90f7" strokeWidth="1.5"/>
              <path d="M3 18c0-3.866 3.134-7 7-7s7 3.134 7 7" stroke="#4a90f7" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">
              Player Profiles
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-snug">
              Career arc, advanced percentiles, and comparable historical seasons
            </p>
          </div>
          <span className="text-xs text-[var(--accent-blue)] font-medium mt-auto">Example: McDavid →</span>
        </Link>

        <Link href="/lines" className="card p-5 flex flex-col gap-3 hover:border-[var(--accent-blue)]/60 transition-colors group">
          <div className="w-10 h-10 rounded-lg bg-[var(--accent-blue-dim)] flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <polyline points="2,14 6,8 10,11 14,5 18,7" stroke="#4a90f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">
              Line Analytics
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-snug">
              Search any line combination — xG%, Corsi, Fenwick, and more
            </p>
          </div>
          <span className="text-xs text-[var(--accent-blue)] font-medium mt-auto">Search lines →</span>
        </Link>
      </div>

      {/* Milestone Watch */}
      <Suspense fallback={null}>
        <MilestoneTracker />
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
