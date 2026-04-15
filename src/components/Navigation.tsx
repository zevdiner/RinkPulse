'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { BarChart2, Rss, Users, User, Trophy, Search, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NHLPlayerSearchResult } from '@/types'

export default function Navigation() {
  const path = usePathname()
  const [overlayOpen, setOverlayOpen] = useState(false)

  // Close overlay when route changes
  useEffect(() => {
    setOverlayOpen(false)
  }, [path])

  // Close on Escape
  useEffect(() => {
    if (!overlayOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOverlayOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [overlayOpen])

  return (
    <>
      <header className="page-content sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg-base)]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-7 h-7 rounded-md bg-[var(--accent-blue)] flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <ellipse cx="7" cy="7" rx="6" ry="3.5" stroke="white" strokeWidth="1.5"/>
                <line x1="1" y1="7" x2="13" y2="7" stroke="white" strokeWidth="1.5"/>
              </svg>
            </div>
            <span className="font-bold text-[var(--text-primary)] tracking-tight group-hover:text-[var(--accent-blue)] transition-colors hidden sm:inline">
              RinkPulse
            </span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-0.5">
            <NavLink href="/" active={path === '/'} icon={<Rss size={15} />}>
              Stories
            </NavLink>
            <NavLink href="/players" active={path.startsWith('/players')} icon={<User size={15} />}>
              Players
            </NavLink>
            <NavLink href="/leaderboard" active={path.startsWith('/leaderboard')} icon={<Trophy size={15} />}>
              Leaderboard
            </NavLink>
            <NavLink href="/compare" active={path.startsWith('/compare')} icon={<BarChart2 size={15} />}>
              Compare
            </NavLink>
            <NavLink href="/lines" active={path.startsWith('/lines')} icon={<Users size={15} />}>
              Lines
            </NavLink>
          </nav>

          {/* Search button */}
          <button
            onClick={() => setOverlayOpen(true)}
            aria-label="Search players"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors shrink-0"
          >
            <Search size={17} />
          </button>
        </div>
      </header>

      {/* Search overlay */}
      {overlayOpen && (
        <SearchOverlay onClose={() => setOverlayOpen(false)} />
      )}
    </>
  )
}

function SearchOverlay({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NHLPlayerSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/players/search?q=${encodeURIComponent(q)}`)
      const data: NHLPlayerSearchResult[] = await res.json()
      setResults(data)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(query), 300)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query, search])

  function handleSelect(player: NHLPlayerSearchResult) {
    router.push(`/players/${player.playerId}`)
    onClose()
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Panel — sits just below the header */}
      <div
        className="absolute top-14 left-0 right-0 flex justify-center px-4 pt-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-full max-w-lg">
          {/* Input */}
          <div className="relative flex items-center bg-[var(--bg-elevated,#1a1d27)] border border-[var(--border)] rounded-xl shadow-2xl">
            <Search size={18} className="absolute left-4 text-[var(--text-muted)] pointer-events-none shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search any NHL player…"
              className="w-full bg-transparent pl-11 pr-12 py-3.5 text-[var(--text-primary)] placeholder:text-[var(--text-muted)] text-base outline-none rounded-xl"
            />
            <div className="absolute right-3 flex items-center gap-1.5">
              {loading && (
                <Loader2 size={15} className="text-[var(--text-muted)] animate-spin" />
              )}
              <button
                onClick={onClose}
                aria-label="Close search"
                className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="mt-2 bg-[var(--bg-elevated,#1a1d27)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
              {results.map(player => (
                <button
                  key={player.playerId}
                  onClick={() => handleSelect(player)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-[var(--border)] last:border-0"
                >
                  <div className="relative w-9 h-9 rounded-full overflow-hidden bg-[var(--border)] shrink-0">
                    <Image
                      src={player.headshot}
                      alt={player.name}
                      fill
                      className="object-cover object-top"
                      unoptimized
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[var(--text-primary)] truncate">{player.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {player.position} · {player.teamAbbrev || 'Free Agent'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && query.length >= 2 && results.length === 0 && (
            <div className="mt-2 bg-[var(--bg-elevated,#1a1d27)] border border-[var(--border)] rounded-xl shadow-2xl px-4 py-6 text-center text-sm text-[var(--text-muted)]">
              No players found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function NavLink({
  href,
  active,
  icon,
  children,
}: {
  href: string
  active: boolean
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:gap-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap',
        active
          ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]'
          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5',
      )}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </Link>
  )
}
