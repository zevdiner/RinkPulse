'use client'

import { useState, useCallback, useRef } from 'react'
import type { MPLine } from '@/types'
import { cn } from '@/lib/utils'
import StatGlossary from './StatGlossary'

// ─── Stat definitions ─────────────────────────────────────────────────────────

type LineStat = {
  label: string
  description: string
  key: keyof MPLine
  higherIsBetter: boolean
  format: 'percent' | 'integer' | 'decimal1' | 'toi'
}

const LINE_STATS: LineStat[] = [
  { label: 'xG%',    description: 'Expected Goals % — share of scoring chances by shot quality; above 50% means the line is out-chancing the opponent',  key: 'xGoalsPercentage', higherIsBetter: true,  format: 'percent'  },
  { label: 'CF%',    description: 'Corsi For % — share of all shot attempts (on goal, missed, blocked) while the line is on ice; a proxy for puck possession', key: 'corsiPercentage',   higherIsBetter: true,  format: 'percent'  },
  { label: 'FF%',    description: 'Fenwick For % — share of unblocked shot attempts; similar to Corsi but excludes blocked shots',                         key: 'fenwickPercentage', higherIsBetter: true,  format: 'percent'  },
  { label: 'GF',     description: 'Goals For — goals scored while this line was on ice',                                                                    key: 'goalsFor',          higherIsBetter: true,  format: 'decimal1' },
  { label: 'GA',     description: 'Goals Against — goals allowed while this line was on ice',                                                               key: 'goalsAgainst',      higherIsBetter: false, format: 'decimal1' },
  { label: 'GP',     description: 'Games Played together as a line',                                                                                        key: 'games_played',      higherIsBetter: true,  format: 'integer'  },
  { label: 'TOI/GP', description: 'Time on Ice per Game — average ice time per game in minutes:seconds; higher means the coach trusts the line in key situations', key: 'icetime', higherIsBetter: true,  format: 'toi'      },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtStat(value: number | undefined, format: LineStat['format'], gp?: number): string {
  if (value === undefined || value === null || isNaN(value as number)) return '—'
  const v = value as number
  switch (format) {
    case 'percent':  return `${(v * 100).toFixed(1)}%`
    case 'integer':  return String(Math.round(v))
    case 'decimal1': return v.toFixed(1)
    case 'toi': {
      const perGame = gp && gp > 0 ? v / gp : v
      const mins = Math.floor(perGame / 60)
      const secs = String(Math.round(perGame % 60)).padStart(2, '0')
      return `${mins}:${secs}`
    }
  }
}

function fmtSeason(season: number): string {
  return `${season}-${String(season + 1).slice(2)}`
}

function lineKey(l: MPLine) {
  return `${l.name}|${l.team}|${l.season}`
}

// ─── Subcomponents ────────────────────────────────────────────────────────────

function LineSearchBox({
  slot,
  selected,
  onSelect,
  onClear,
}: {
  slot: 1 | 2
  selected: MPLine | null
  onSelect: (l: MPLine) => void
  onClear: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MPLine[]>([])
  const [loading, setLoading] = useState(false)
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback((q: string) => {
    setQuery(q)
    if (debounce.current) clearTimeout(debounce.current)
    if (q.length < 2) { setResults([]); return }
    debounce.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/lines/search?q=${encodeURIComponent(q)}`)
        const data: MPLine[] = await res.json()
        setResults(data)
      } finally {
        setLoading(false)
      }
    }, 280)
  }, [])

  const handleSelect = (l: MPLine) => {
    onSelect(l)
    setQuery('')
    setResults([])
  }

  const color = slot === 1 ? 'var(--accent-blue)' : '#f87171'

  return (
    <div className="flex flex-col gap-3">
      <div
        className="text-xs font-semibold uppercase tracking-widest"
        style={{ color }}
      >
        Line {slot}
      </div>

      {selected ? (
        <SelectedLineCard line={selected} color={color} onClear={onClear} />
      ) : (
        <div className="relative">
          <input
            type="text"
            placeholder="Search by player last name…"
            value={query}
            onChange={e => search(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent-blue)] focus:ring-1 focus:ring-[var(--accent-blue)] transition-colors"
          />
          {loading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-[var(--border)] border-t-[var(--accent-blue)] rounded-full animate-spin" />
            </div>
          )}

          {results.length > 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-xl overflow-hidden">
              <div className="max-h-72 overflow-y-auto">
                {results.map(l => (
                  <button
                    key={lineKey(l)}
                    onClick={() => handleSelect(l)}
                    className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-[var(--bg-hover)] transition-colors border-b border-[var(--border)] last:border-0"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {l.name}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {l.team} · {fmtSeason(l.season)} · {l.position === 'pair' ? 'D-Pair' : 'Line'}
                      </div>
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] shrink-0">
                      {l.games_played} GP
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {query.length >= 2 && !loading && results.length === 0 && (
            <div className="absolute z-20 mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--bg-card)] shadow-xl px-4 py-3 text-sm text-[var(--text-muted)]">
              No lines found for &ldquo;{query}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SelectedLineCard({
  line,
  color,
  onClear,
}: {
  line: MPLine
  color: string
  onClear: () => void
}) {
  return (
    <div className="card p-4 flex items-start justify-between gap-3" style={{ borderColor: color }}>
      <div className="min-w-0">
        <div className="font-semibold text-[var(--text-primary)] text-sm leading-tight truncate">
          {line.name}
        </div>
        <div className="text-xs text-[var(--text-muted)] mt-0.5">
          {line.team} · {fmtSeason(line.season)} · {line.position === 'pair' ? 'D-Pair' : 'Line'} · {line.games_played} GP
        </div>
      </div>
      <button
        onClick={onClear}
        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0 mt-0.5"
        aria-label="Clear selection"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
          <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}

function StatRow({ stat, l1, l2 }: { stat: LineStat; l1: MPLine; l2: MPLine }) {
  const raw1 = l1[stat.key] as number
  const raw2 = l2[stat.key] as number

  const label1 = fmtStat(raw1, stat.format, stat.key === 'icetime' ? l1.games_played : undefined)
  const label2 = fmtStat(raw2, stat.format, stat.key === 'icetime' ? l2.games_played : undefined)

  const n1 = raw1 ?? 0
  const n2 = raw2 ?? 0
  const max = Math.max(Math.abs(n1), Math.abs(n2)) || 1
  const pct1 = Math.round((Math.abs(n1) / max) * 100)
  const pct2 = Math.round((Math.abs(n2) / max) * 100)
  const l1Wins = stat.higherIsBetter ? n1 > n2 : n1 < n2
  const l2Wins = stat.higherIsBetter ? n2 > n1 : n2 < n1

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-2.5 border-b border-[var(--border)] last:border-0">
      <div className="flex flex-col items-end gap-1.5">
        <span className={cn(
          'text-base font-bold tabular-nums leading-none',
          l1Wins ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]',
        )}>
          {label1}
        </span>
        <div className="w-full bar-track">
          <div className="bar-fill-blue" style={{ width: `${pct1}%` }} />
        </div>
      </div>

      <div className="text-center px-1">
        <abbr
          title={stat.description}
          className="text-xs font-medium text-[var(--text-muted)] whitespace-nowrap no-underline cursor-help border-b border-dotted border-[var(--text-muted)]/40"
        >
          {stat.label}
        </abbr>
      </div>

      <div className="flex flex-col items-start gap-1.5">
        <span className={cn(
          'text-base font-bold tabular-nums leading-none',
          l2Wins ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]',
        )}>
          {label2}
        </span>
        <div className="w-full bar-track">
          <div className="bar-fill-red" style={{ width: `${pct2}%` }} />
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function LineComparison() {
  const [line1, setLine1] = useState<MPLine | null>(null)
  const [line2, setLine2] = useState<MPLine | null>(null)

  return (
    <div className="flex flex-col gap-6">
      {/* Search panels */}
      <div className="grid sm:grid-cols-2 gap-4">
        <LineSearchBox slot={1} selected={line1} onSelect={setLine1} onClear={() => setLine1(null)} />
        <LineSearchBox slot={2} selected={line2} onSelect={setLine2} onClear={() => setLine2(null)} />
      </div>

      {/* Comparison */}
      {line1 && line2 && (
        <div className="card p-5">
          {/* Header */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3 mb-4 pb-4 border-b border-[var(--border)]">
            <div className="text-right min-w-0">
              <div className="font-semibold text-[var(--text-primary)] text-sm truncate">{line1.name}</div>
              <div className="text-xs text-[var(--text-muted)]">{line1.team} · {fmtSeason(line1.season)}</div>
            </div>
            <div className="text-xs font-medium text-[var(--text-muted)] px-1 whitespace-nowrap">vs</div>
            <div className="text-left min-w-0">
              <div className="font-semibold text-[var(--text-primary)] text-sm truncate">{line2.name}</div>
              <div className="text-xs text-[var(--text-muted)]">{line2.team} · {fmtSeason(line2.season)}</div>
            </div>
          </div>

          {/* Stats */}
          <div>
            {LINE_STATS.map(stat => (
              <StatRow key={stat.key as string} stat={stat} l1={line1} l2={line2} />
            ))}
          </div>

          {/* Glossary */}
          <StatGlossary entries={LINE_STATS.map(s => ({ label: s.label, description: s.description }))} />
        </div>
      )}

      {/* Prompt when one or zero lines selected */}
      {(!line1 || !line2) && (
        <p className="text-center text-sm text-[var(--text-muted)] py-4">
          {!line1 && !line2
            ? 'Search for two lines to compare their advanced stats.'
            : 'Now search for a second line.'}
        </p>
      )}
    </div>
  )
}
