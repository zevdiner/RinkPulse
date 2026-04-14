'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Link2, AlertCircle } from 'lucide-react'
import PlayerSearch from './PlayerSearch'
import StatBar from './StatBar'
import StatCardDownload from './StatCardDownload'
import { SKATER_STATS, GOALIE_STATS } from '@/lib/utils'
import type { PlayerStats, Timeframe } from '@/types'

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: 'season', label: '2024–25' },
  { value: 'career', label: 'Career' },
  { value: 'last3', label: 'Last 3 Seasons' },
  { value: 'playoffs', label: 'Playoffs' },
]

export default function ComparisonTool() {
  const router = useRouter()
  const params = useSearchParams()

  const [p1Id, setP1Id] = useState<number>(Number(params.get('p1')) || 0)
  const [p2Id, setP2Id] = useState<number>(Number(params.get('p2')) || 0)
  const [p1Name, setP1Name] = useState('')
  const [p2Name, setP2Name] = useState('')
  const [timeframe, setTimeframe] = useState<Timeframe>((params.get('tf') as Timeframe) || 'season')
  const [p1Stats, setP1Stats] = useState<PlayerStats | null>(null)
  const [p2Stats, setP2Stats] = useState<PlayerStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async (id1: number, id2: number, tf: Timeframe) => {
    if (!id1 || !id2) return
    setLoading(true)
    setError(null)
    try {
      const [r1, r2] = await Promise.all([
        fetch(`/api/players/${id1}?timeframe=${tf}`),
        fetch(`/api/players/${id2}?timeframe=${tf}`),
      ])
      if (!r1.ok || !r2.ok) throw new Error('Failed to load player data')
      const [s1, s2]: [PlayerStats, PlayerStats] = await Promise.all([r1.json(), r2.json()])
      setP1Stats(s1)
      setP2Stats(s2)
      if (!p1Name) setP1Name(s1.name)
      if (!p2Name) setP2Name(s2.name)
    } catch (e) {
      setError('Could not load player stats. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [p1Name, p2Name])

  // Load from URL params on mount
  useEffect(() => {
    if (p1Id && p2Id) {
      fetchStats(p1Id, p2Id, timeframe)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Update URL when selections change
  useEffect(() => {
    if (!p1Id && !p2Id) return
    const url = new URLSearchParams()
    if (p1Id) url.set('p1', String(p1Id))
    if (p2Id) url.set('p2', String(p2Id))
    url.set('tf', timeframe)
    router.replace(`/compare?${url.toString()}`, { scroll: false })
  }, [p1Id, p2Id, timeframe, router])

  const handleP1Select = (id: number, name: string) => {
    setP1Id(id)
    setP1Name(name)
    setP1Stats(null)
    if (id && p2Id) fetchStats(id, p2Id, timeframe)
  }

  const handleP2Select = (id: number, name: string) => {
    setP2Id(id)
    setP2Name(name)
    setP2Stats(null)
    if (p1Id && id) fetchStats(p1Id, id, timeframe)
  }

  const handleTimeframeChange = (tf: Timeframe) => {
    setTimeframe(tf)
    if (p1Id && p2Id) fetchStats(p1Id, p2Id, tf)
  }

  const handleShareLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {})
  }

  const statDefs = (p1Stats?.isGoalie || p2Stats?.isGoalie) ? GOALIE_STATS : SKATER_STATS

  return (
    <div className="flex flex-col gap-6">
      {/* Search row */}
      <div className="card p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <PlayerSearch
            label="Player 1"
            playerId={p1Id || null}
            playerName={p1Name}
            onSelect={handleP1Select}
            accentColor="blue"
          />
          <PlayerSearch
            label="Player 2"
            playerId={p2Id || null}
            playerName={p2Name}
            onSelect={handleP2Select}
            accentColor="red"
          />
        </div>
      </div>

      {/* Timeframe selector */}
      <div className="flex flex-wrap gap-2">
        {TIMEFRAMES.map(tf => (
          <button
            key={tf.value}
            onClick={() => handleTimeframeChange(tf.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              timeframe === tf.value
                ? 'bg-[var(--accent-blue)] text-white'
                : 'bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/8 border border-[var(--border)]'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading && <LoadingSkeleton />}

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg border border-red-800/50 bg-red-900/10 text-red-400 text-sm">
          <AlertCircle size={15} />
          {error}
        </div>
      )}

      {p1Stats && p2Stats && !loading && (
        <div className="card overflow-hidden">
          {/* Player header */}
          <CompareHeader p1={p1Stats} p2={p2Stats} />

          {/* Stats */}
          <div className="px-5 pb-2">
            {statDefs.map(stat => (
              <StatBar key={stat.key as string} stat={stat} p1={p1Stats} p2={p2Stats} />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-[var(--border)]">
            <StatCardDownload p1={p1Stats} p2={p2Stats} timeframe={timeframe} />
            <button
              onClick={handleShareLink}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-bright)] hover:bg-white/4 transition-all"
            >
              <Link2 size={15} />
              Copy Link
            </button>
          </div>
        </div>
      )}

      {!p1Id && !p2Id && <EmptyPrompt />}
    </div>
  )
}

function CompareHeader({ p1, p2 }: { p1: PlayerStats; p2: PlayerStats }) {
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 p-5 border-b border-[var(--border)]">
      {/* P1 */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-[var(--border)] ring-2 ring-[var(--accent-blue)]/40">
          <Image src={p1.headshot} alt={p1.name} fill className="object-cover object-top" unoptimized />
        </div>
        <div>
          <div className="font-bold text-sm text-[var(--text-primary)]">{p1.name}</div>
          <div className="text-xs text-[var(--text-muted)]">{p1.position} · {p1.teamAbbrev}</div>
        </div>
      </div>

      {/* VS */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-xl font-black text-[var(--text-muted)] tracking-widest">VS</span>
      </div>

      {/* P2 */}
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="relative w-16 h-16 rounded-full overflow-hidden bg-[var(--border)] ring-2 ring-red-500/40">
          <Image src={p2.headshot} alt={p2.name} fill className="object-cover object-top" unoptimized />
        </div>
        <div>
          <div className="font-bold text-sm text-[var(--text-primary)]">{p2.name}</div>
          <div className="text-xs text-[var(--text-muted)]">{p2.position} · {p2.teamAbbrev}</div>
        </div>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-4 pb-4 border-b border-[var(--border)]">
        {[0, 1, 2].map(i => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="skeleton w-16 h-16 rounded-full" />
            <div className="skeleton h-4 w-24" />
          </div>
        ))}
      </div>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="grid grid-cols-3 gap-4 py-2">
          <div className="skeleton h-5 w-12 ml-auto" />
          <div className="skeleton h-4 w-20 mx-auto" />
          <div className="skeleton h-5 w-12" />
        </div>
      ))}
    </div>
  )
}

function EmptyPrompt() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <div className="w-12 h-12 rounded-full bg-[var(--accent-blue-dim)] flex items-center justify-center">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="9" stroke="#4a90f7" strokeWidth="1.5"/>
          <path d="M11 7v8M7 11h8" stroke="#4a90f7" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <div>
        <p className="text-sm font-medium text-[var(--text-primary)]">Search for two players to compare</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Side-by-side stats with downloadable stat cards</p>
      </div>
    </div>
  )
}
