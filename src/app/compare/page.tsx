import { Suspense } from 'react'
import type { Metadata } from 'next'
import ComparisonTool from '@/components/ComparisonTool'

export const metadata: Metadata = {
  title: 'Player Comparison — RinkPulse',
  description: 'Compare any two NHL players side-by-side across career, season, and playoff stats. Download a shareable stat card.',
}

export default function ComparePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Player Comparison</h1>
        <p className="text-[var(--text-secondary)] mt-1 text-sm">
          Search any two NHL players · Select a timeframe · Download a stat card
        </p>
      </div>

      <Suspense fallback={<div className="skeleton h-32 w-full rounded-xl" />}>
        <ComparisonTool />
      </Suspense>
    </div>
  )
}
