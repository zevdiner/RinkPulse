'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Search, Loader2 } from 'lucide-react'
import type { NHLPlayerSearchResult } from '@/types'

export default function PlayerSearchNav() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NHLPlayerSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/players/search?q=${encodeURIComponent(q)}`)
      const data: NHLPlayerSearchResult[] = await res.json()
      setResults(data)
      setOpen(true)
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

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative max-w-sm">
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
        {loading && (
          <Loader2 size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] animate-spin" />
        )}
        <input
          className="input-field pl-10 pr-10"
          placeholder="Search any NHL player…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
        />
      </div>

      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 card overflow-hidden shadow-xl max-h-72 overflow-y-auto">
          {results.map(player => (
            <button
              key={player.playerId}
              onClick={() => {
                setOpen(false)
                setQuery('')
                router.push(`/players/${player.playerId}`)
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[var(--border)] shrink-0">
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
    </div>
  )
}
