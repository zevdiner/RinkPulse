'use client'

import { useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { Link2, AlertCircle } from 'lucide-react'
import PlayerSearch from './PlayerSearch'
import StatBar from './StatBar'
import Sparkline from './Sparkline'
import StatCardDownload from './StatCardDownload'
import { SKATER_STATS, GOALIE_STATS } from '@/lib/utils'
import type { NHLGameLogEntry, PlayerStats, SparkMetric, Timeframe } from '@/types'

const TIMEFRAMES: { value: Timeframe; label: string }[] = [
  { value: 'season', label: '2025–26' },
  { value: 'career', label: 'Career' },
  { value: 'last3', label: 'Last 3 Seasons' },
  { value: 'playoffs', label: 'Playoffs' },
]

const SPARK_METRICS: { value: SparkMetric; label: string }[] = [
  { value: 'points', label: 'PTS' },
  { value: 'plusMinus', label: '+/−' },
  { value: 'toi', label: 'TOI' },
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
  const [p1Games, setP1Games] = useState<NHLGameLogEntry[]>([])
  const [p2Games, setP2Games] = useState<NHLGameLogEntry[]>([])
  const [sparkMetric, setSparkMetric] = useState<SparkMetric>('points')
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

      // Fetch game logs in the background (skaters only — goalies have different log shape)
      if (!s1.isGoalie && !s2.isGoalie) {
        Promise.all([
          fetch(`/api/players/${id1}/gamelog`).then(r => r.ok ? r.json() : []),
          fetch(`/api/players/${id2}/gamelog`).then(r => r.ok ? r.json() : []),
        ]).then(([g1, g2]) => {
          setP1Games(g1)
          setP2Games(g2)
        }).catch(() => {})
      } else {
        setP1Games([])
        setP2Games([])
      }
    } catch {
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
    setP1Games([])
    if (id && p2Id) fetchStats(id, p2Id, timeframe)
  }

  const handleP2Select = (id: number, name: string) => {
    setP2Id(id)
    setP2Name(name)
    setP2Stats(null)
    setP2Games([])
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

  // Win tally
  const p1Wins = p1Stats && p2Stats
    ? statDefs.filter(s => {
        const v1 = p1Stats[s.key] as number | undefined
        const v2 = p2Stats[s.key] as number | undefined
        if (v1 === undefined || v2 === undefined) return false
        return s.higherIsBetter ? v1 > v2 : v1 < v2
      }).length
    : 0
  const p2Wins = p1Stats && p2Stats
    ? statDefs.filter(s => {
        const v1 = p1Stats[s.key] as number | undefined
        const v2 = p2Stats[s.key] as number | undefined
        if (v1 === undefined || v2 === undefined) return false
        return s.higherIsBetter ? v2 > v1 : v2 < v1
      }).length
    : 0

  const hasGameLogs = p1Games.length > 0 || p2Games.length > 0

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
          {/* Player header + win tally */}
          <CompareHeader p1={p1Stats} p2={p2Stats} p1Wins={p1Wins} p2Wins={p2Wins} />

          {/* Sparklines */}
          {hasGameLogs && (
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-5 py-3 border-b border-[var(--border)]">
              <div className="min-w-0">
                <Sparkline games={p1Games} metric={sparkMetric} color="blue" />
              </div>

              {/* Metric toggle */}
              <div className="flex flex-col gap-1 items-center">
                {SPARK_METRICS.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setSparkMetric(m.value)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                      sparkMetric === m.value
                        ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
                <span className="text-[9px] text-[var(--text-muted)] mt-0.5 whitespace-nowrap">last 10 G</span>
              </div>

              <div className="min-w-0">
                <Sparkline games={p2Games} metric={sparkMetric} color="red" />
              </div>
            </div>
          )}

          {/* Legend strip */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center px-5 py-2 border-b border-[var(--border)]">
            <span className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)]">
              <span className="inline-block w-2 h-2 rounded-sm flex-shrink-0" style={{ background: '#4a90f7' }} />
              <span className="truncate">{p1Stats.name}</span>
            </span>
            <span className="text-[10px] text-[var(--text-muted)] text-center px-2 whitespace-nowrap">
              bold = leads
            </span>
            <span className="flex items-center justify-end gap-1.5 text-[11px] text-[var(--text-muted)]">
              <span className="truncate text-right">{p2Stats.name}</span>
              <span className="inline-block w-2 h-2 rounded-sm flex-shrink-0" style={{ background: '#ef4444' }} />
            </span>
          </div>

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

function CompareHeader({
  p1, p2, p1Wins, p2Wins,
}: {
  p1: PlayerStats
  p2: PlayerStats
  p1Wins: number
  p2Wins: number
}) {
  const total = p1Wins + p2Wins
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

      {/* VS + tally */}
      <div className="flex flex-col items-center gap-1">
        <span className="text-xl font-black text-[var(--text-muted)] tracking-widest">VS</span>
        {total > 0 && (
          <>
            <div className="flex items-center gap-1.5 text-sm font-bold tabular-nums leading-none">
              <span style={{ color: '#4a90f7' }}>{p1Wins}</span>
              <span className="text-[var(--text-muted)] text-xs">–</span>
              <span style={{ color: '#ef4444' }}>{p2Wins}</span>
            </div>
            <span className="text-[9px] text-[var(--text-muted)] tracking-wide uppercase">stat leads</span>
          </>
        )}
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
