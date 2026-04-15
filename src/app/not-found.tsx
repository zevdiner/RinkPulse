import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-32 flex flex-col items-center text-center gap-6">
      <div className="w-16 h-16 rounded-full bg-[var(--accent-blue-dim)] flex items-center justify-center">
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
          <ellipse cx="14" cy="14" rx="12" ry="7" stroke="#4a90f7" strokeWidth="2"/>
          <line x1="2" y1="14" x2="26" y2="14" stroke="#4a90f7" strokeWidth="2"/>
          <line x1="14" y1="9" x2="14" y2="19" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>
      <div>
        <h1 className="text-4xl font-black text-[var(--text-primary)] tabular-nums">404</h1>
        <p className="text-[var(--text-secondary)] mt-2">This page could not be found.</p>
      </div>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-lg bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] border border-[var(--accent-blue)]/30 text-sm font-medium hover:bg-[var(--accent-blue)] hover:text-white transition-all"
      >
        ← Back to Stories
      </Link>
    </div>
  )
}
