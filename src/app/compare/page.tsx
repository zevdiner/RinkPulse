import { Suspense } from 'react'
import type { Metadata } from 'next'
import ComparisonTool from '@/components/ComparisonTool'

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://rink-pulse.vercel.app'

export async function generateMetadata(
  props: { searchParams: Promise<{ p1?: string; p2?: string }> }
): Promise<Metadata> {
  const sp = await props.searchParams
  const p1 = sp.p1
  const p2 = sp.p2

  if (p1 && p2) {
    const ogImage = `${BASE_URL}/api/og/compare?p1=${p1}&p2=${p2}`
    return {
      title: 'Player Comparison — RinkPulse',
      description: 'Compare any two NHL players side-by-side across career, season, and playoff stats.',
      openGraph: {
        title: 'Player Comparison — RinkPulse',
        description: 'Side-by-side NHL player stats with historical context.',
        images: [{ url: ogImage, width: 1200, height: 630 }],
      },
      twitter: {
        card: 'summary_large_image',
        images: [ogImage],
      },
    }
  }

  return {
    title: 'Player Comparison — RinkPulse',
    description: 'Compare any two NHL players side-by-side across career, season, and playoff stats. Download a shareable stat card.',
  }
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
