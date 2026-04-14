'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Search, X, Loader2 } from 'lucide-react'
import type { NHLPlayerSearchResult } from '@/types'

interface Props {
  label: string
  playerId: number | null
  playerName: string
  onSelect: (id: number, name: string) => void
  accentColor?: 'blue' | 'red'
}

export default function PlayerSearch({ label, playerId, playerName, onSelect, accentColor = 'blue' }: Props) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NHLPlayerSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const accent = accentColor === 'red' ? '#ef4444' : '#4a90f7'
  const accentDim = accentColor === 'red' ? 'rgba(239,68,68,0.12)' : 'rgba(74,144,247,0.12)'

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
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
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [])

  const handleSelect = (player: NHLPlayerSearchResult) => {
    onSelect(player.playerId, player.name)
    setQuery('')
    setOpen(false)
  }

  const handleClear = () => {
    onSelect(0, '')
    setQuery('')
    setResults([])
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="block text-xs font-semibold uppercase tracking-widest mb-2"
        style={{ color: accent }}>
        {label}
      </label>

      {playerId ? (
        /* Selected player chip */
        <div
          className="flex items-center gap-2 px-3 py-2.5 rounded-lg border"
          style={{ background: accentDim, borderColor: accent + '44' }}
        >
          <PlayerAvatar playerId={playerId} name={playerName} />
          <span className="font-semibold text-sm text-[var(--text-primary)] flex-1 truncate">
            {playerName}
          </span>
          <button onClick={handleClear} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
            <X size={14} />
          </button>
        </div>
      ) : (
        /* Search input */
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
          <input
            className="input-field pl-9 pr-9"
            placeholder="Search player name…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setOpen(true)}
          />
          {loading && (
            <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] animate-spin" />
          )}
        </div>
      )}

      {/* Dropdown */}
      {open && results.length > 0 && !playerId && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 card overflow-hidden shadow-xl max-h-64 overflow-y-auto">
          {results.map(player => (
            <button
              key={player.playerId}
              onClick={() => handleSelect(player)}
              className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 transition-colors text-left"
            >
              <PlayerAvatar playerId={player.playerId} name={player.name} />
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

function PlayerAvatar({ playerId, name }: { playerId: number; name: string }) {
  return (
    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[var(--border)] shrink-0">
      <Image
        src={`https://assets.nhle.com/mugs/nhl/20252026/${playerId}.png`}
        alt={name}
        fill
        className="object-cover object-top"
        unoptimized
      />
    </div>
  )
}
