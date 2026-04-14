import { Suspense } from 'react'
import type { Metadata } from 'next'
import LineComparison from '@/components/LineComparison'

export const metadata: Metadata = {
  title: 'Line Comparison — RinkPulse',
  description: 'Compare any two NHL forward lines or defensive pairs side-by-side using MoneyPuck advanced stats.',
}

export default function LinesPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Line Comparison</h1>
        <p className="text-[var(--text-secondary)] mt-1 text-sm">
          Search by player last name · Compare advanced stats across seasons
        </p>
      </div>

      <Suspense fallback={<div className="skeleton h-32 w-full rounded-xl" />}>
        <LineComparison />
      </Suspense>
    </div>
  )
}
