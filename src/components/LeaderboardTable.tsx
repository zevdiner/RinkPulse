'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { LeaderboardRow } from '@/types'

const CURRENT_PRESETS = [
  { value: 'points',  label: 'Points' },
  { value: 'goals',   label: 'Goals' },
  { value: 'assists', label: 'Assists' },
]

const HISTORICAL_PRESETS = [
  { value: 'hist-100pts',    label: '100+ Pt Seasons' },
  { value: 'hist-50goals',   label: '50+ Goal Seasons' },
  { value: 'hist-xg82',      label: 'Best xG/82' },
  { value: 'hist-gamescore', label: 'Best Game Score' },
]

type Mode   = 'current' | 'historical'
type SortKey = 'gamesPlayed' | 'goals' | 'assists' | 'points' | 'goalsPer82' | 'pointsPer82' | 'xGoalsPer82' | 'gameScore'
type SortDir = 'desc' | 'asc'

function defaultSort(preset: string): SortKey {
  if (preset === 'goals')         return 'goals'
  if (preset === 'assists')       return 'assists'
  if (preset === 'hist-50goals')  return 'goalsPer82'
  if (preset === 'hist-xg82')     return 'xGoalsPer82'
  if (preset === 'hist-gamescore') return 'gameScore'
  return 'points'
}

function sortRows(rows: LeaderboardRow[], col: SortKey, dir: SortDir): LeaderboardRow[] {
  return [...rows].sort((a, b) => {
    const av = (a[col] as number | undefined) ?? -Infinity
    const bv = (b[col] as number | undefined) ?? -Infinity
    return dir === 'desc' ? bv - av : av - bv
  })
}

export default function LeaderboardTable() {
  const [mode, setMode]     = useState<Mode>('current')
  const [preset, setPreset] = useState('points')
  const [rows, setRows]     = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)
  const [sortCol, setSortCol] = useState<SortKey>('points')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  // Reset sort when preset changes
  useEffect(() => {
    const def = defaultSort(preset)
    setSortCol(def)
    setSortDir('desc')
    setLoading(true)
    fetch(`/api/leaderboard?preset=${preset}`)
      .then(r => r.json())
      .then((data: LeaderboardRow[]) => { setRows(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [preset])

  const displayRows = useMemo(
    () => sortRows(rows, sortCol, sortDir),
    [rows, sortCol, sortDir]
  )

  function handleSort(col: SortKey) {
    if (col === sortCol) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortCol(col)
      setSortDir('desc')
    }
  }

  function switchMode(m: Mode) {
    setMode(m)
    setPreset(m === 'current' ? 'points' : 'hist-100pts')
  }

  const presets = mode === 'current' ? CURRENT_PRESETS : HISTORICAL_PRESETS
  const isHist  = preset.startsWith('hist-')
  const isXG    = preset === 'hist-xg82'
  const isGS    = preset === 'hist-gamescore'

  // Columns to show
  const showXG    = isXG
  const showGS    = isGS
  const showG82   = preset === 'hist-50goals'
  const showPts82 = false  // keep table simple — raw stats only for non-advanced presets

  // Column header helper
  function ColHeader({
    col, label, className = '',
  }: { col: SortKey; label: string; className?: string }) {
    const active = sortCol === col
    const arrow  = active ? (sortDir === 'desc' ? ' ↓' : ' ↑') : ''
    return (
      <th
        className={`px-2 py-2.5 cursor-pointer select-none hover:text-[var(--text-primary)] transition-colors whitespace-nowrap ${
          active ? 'text-[var(--accent-blue)]' : ''
        } ${className}`}
        onClick={() => handleSort(col)}
      >
        {label}{arrow}
      </th>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Mode toggle */}
      <div className="flex gap-2 flex-wrap">
        {(['current', 'historical'] as Mode[]).map(m => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              mode === m
                ? 'bg-[var(--accent-blue)] text-white'
                : 'bg-white/5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
            }`}
          >
            {m === 'current' ? '2025–26 Season' : 'Historical (2008–2026)'}
          </button>
        ))}
      </div>

      {/* Preset pills */}
      <div className="flex flex-wrap gap-2">
        {presets.map(p => (
          <button
            key={p.value}
            onClick={() => setPreset(p.value)}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
              preset === p.value
                ? 'bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] border border-[var(--accent-blue)]/40'
                : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--border)]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Description */}
      {preset === 'hist-50goals' && (
        <p className="text-xs text-[var(--text-muted)]">All 50+ goal seasons 2008–2026 (min 50 GP)</p>
      )}
      {preset === 'hist-100pts' && (
        <p className="text-xs text-[var(--text-muted)]">All 100+ point seasons 2008–2026 (min 50 GP)</p>
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex flex-col">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]/50">
                <div className="skeleton w-5 h-4 rounded shrink-0" />
                <div className="skeleton w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1">
                  <div className="skeleton h-4 w-28 mb-1.5" />
                  <div className="skeleton h-3 w-16" />
                </div>
                <div className="skeleton h-4 w-10" />
              </div>
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
            <p className="text-sm text-[var(--text-muted)]">
              {isHist
                ? 'Historical data not available — add MoneyPuck CSV files to /data'
                : 'No players match this filter yet this season'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                  <th className="text-left px-4 py-2.5 w-8">#</th>
                  <th className="text-left px-2 py-2.5">Player</th>
                  {isHist && <th className="text-center px-2 py-2.5 hidden sm:table-cell">Season</th>}
                  <ColHeader col="gamesPlayed" label="GP"  className="text-center" />
                  <ColHeader col="goals"       label="G"   className="text-center" />
                  <ColHeader col="assists"     label="A"   className="text-center" />
                  {showXG  && <ColHeader col="xGoalsPer82" label="xG/82"    className="text-center" />}
                  {showGS  && <ColHeader col="gameScore"   label="Gm Score" className="text-center" />}
                  {showG82 && <ColHeader col="goalsPer82"  label="G/82"     className="text-center" />}
                  {!showXG && !showGS && !showG82 && (
                    <ColHeader col="points" label="PTS" className="text-center" />
                  )}
                </tr>
              </thead>
              <tbody>
                {displayRows.map((row, i) => (
                  <tr
                    key={`${row.playerId}-${row.season}-${i}`}
                    className="border-b border-[var(--border)]/50 hover:bg-white/3 transition-colors"
                  >
                    <td className="px-4 py-2.5 text-[var(--text-muted)] text-xs tabular-nums">{i + 1}</td>
                    <td className="px-2 py-2.5">
                      <Link
                        href={`/players/${row.playerId}`}
                        className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                      >
                        <div className="relative w-8 h-8 rounded-full overflow-hidden bg-[var(--border)] shrink-0">
                          <Image src={row.headshot} alt={row.name} fill className="object-cover object-top" unoptimized />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-[var(--text-primary)] truncate">{row.name}</div>
                          <div className="text-xs text-[var(--text-muted)]">{row.position} · {row.team}</div>
                        </div>
                      </Link>
                    </td>
                    {isHist && (
                      <td className="px-2 py-2.5 text-center text-xs text-[var(--text-muted)] hidden sm:table-cell tabular-nums whitespace-nowrap">
                        {row.season}
                      </td>
                    )}
                    <td className="px-2 py-2.5 text-center tabular-nums text-[var(--text-secondary)]">{row.gamesPlayed}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-[var(--text-secondary)]">{row.goals}</td>
                    <td className="px-2 py-2.5 text-center tabular-nums text-[var(--text-secondary)]">{row.assists}</td>
                    {showXG  && <td className="px-2 py-2.5 text-center tabular-nums font-bold text-[var(--text-primary)]">{row.xGoalsPer82?.toFixed(1) ?? '—'}</td>}
                    {showGS  && <td className="px-2 py-2.5 text-center tabular-nums font-bold text-[var(--text-primary)]">{row.gameScore?.toFixed(2) ?? '—'}</td>}
                    {showG82 && <td className="px-2 py-2.5 text-center tabular-nums font-bold text-[var(--text-primary)]">{row.goalsPer82.toFixed(1)}</td>}
                    {!showXG && !showGS && !showG82 && (
                      <td className="px-2 py-2.5 text-center tabular-nums font-bold text-[var(--text-primary)]">{row.points}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && rows.length > 0 && (
          <div className="px-4 py-2 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)]">
            {rows.length} result{rows.length !== 1 ? 's' : ''} · click any column header to sort ·{' '}
            {isHist ? 'MoneyPuck 2008–2026, all-situations' : 'NHL API · 2025–26 regular season'}
          </div>
        )}
      </div>
    </div>
  )
}
