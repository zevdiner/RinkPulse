import { Suspense } from 'react'
import StoryCard from '@/components/StoryCard'
import TodayDate from '@/components/TodayDate'
import { generateDailyStories } from '@/lib/stories'
import type { Story } from '@/types'

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Today&apos;s Stories</h1>
        <p className="text-[var(--text-secondary)] mt-1 text-sm">
          <Suspense fallback="Today">
            <TodayDate />
          </Suspense>
          {' · Historically notable performances from the 2025–26 NHL season'}
        </p>
      </div>

      <Suspense fallback={<StoriesSkeleton />}>
        <StoriesFeed />
      </Suspense>
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
