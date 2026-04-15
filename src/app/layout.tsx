import { Suspense } from 'react'
import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import Navigation from '@/components/Navigation'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })

export const metadata: Metadata = {
  title: 'RinkPulse — NHL Stat Stories & Player Comparison',
  description:
    'Daily historically notable NHL stat stories powered by MoneyPuck data, plus an interactive player comparison tool with downloadable stat cards.',
  openGraph: {
    title: 'RinkPulse',
    description: 'Daily NHL stat stories & player comparisons',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body className="min-h-screen flex flex-col">
        <Suspense fallback={<div className="page-content sticky top-0 z-50 h-14 border-b border-[var(--border)] bg-[var(--bg-base)]/90" />}>
          <Navigation />
        </Suspense>
        <main className="page-content flex-1">{children}</main>
        <footer className="page-content border-t border-[var(--border)] py-6 mt-12">
          <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-[var(--text-muted)]">
            <span>RinkPulse — NHL data via the NHL public API &amp; MoneyPuck (2008–2024)</span>
            <span>Not affiliated with the NHL</span>
          </div>
        </footer>
      </body>
    </html>
  )
}
