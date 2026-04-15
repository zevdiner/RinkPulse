import { Suspense } from 'react'
import type { Metadata } from 'next'
import LeaderboardTable from '@/components/LeaderboardTable'

export const metadata: Metadata = {
  title: 'Leaderboard — RinkPulse',
  description: 'Explore NHL stat leaders. Current season scoring, PPG pace, 50-goal pace — plus historical queries: every 100-point season, every 50-goal season, best xG/82 since 2008.',
}

export default function LeaderboardPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Leaderboard</h1>
        <p className="text-[var(--text-secondary)] mt-1 text-sm">
          Current season leaders · PPG &amp; goal-pace filters · Historical 50-goal &amp; 100-point seasons since 2008
        </p>
      </div>

      <Suspense fallback={<div className="skeleton h-96 w-full rounded-xl" />}>
        <LeaderboardTable />
      </Suspense>
    </div>
  )
}
