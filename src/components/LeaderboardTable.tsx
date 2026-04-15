'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { LeaderboardRow } from '@/types'

const CURRENT_PRESETS = [
  { value: 'points',       label: 'Points' },
  { value: 'goals',        label: 'Goals' },
  { value: 'assists',      label: 'Assists' },
  { value: 'ppg-pace',     label: 'PPG Pace' },
  { value: '50-goal-pace', label: 'Top Goal Pace' },
  { value: '100-pt-pace',  label: '100-Pt Pace' },
]

const HISTORICAL_PRESETS = [
  { value: 'hist-100pts',    label: '100+ Pt Seasons' },
  { value: 'hist-50goals',   label: '50+ Goal Seasons' },
  { value: 'hist-xg82',      label: 'Best xG/82' },
  { value: 'hist-gamescore', label: 'Best Game Score' },
]

type Mode = 'current' | 'historical'

export default function LeaderboardTable() {
  const [mode, setMode] = useState<Mode>('current')
  const [preset, setPreset] = useState('points')
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/leaderboard?preset=${preset}`)
      .then(r => r.json())
      .then((data: LeaderboardRow[]) => { setRows(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [preset])

  const presets = mode === 'current' ? CURRENT_PRESETS : HISTORICAL_PRESETS

  const isHist   = preset.startsWith('hist-')
  const isXG     = preset === 'hist-xg82'
  const isGS     = preset === 'hist-gamescore'
  const isGoalP  = preset === '50-goal-pace' || preset === 'hist-50goals'
  const isPtPace = ['ppg-pace', '100-pt-pace', 'hist-100pts'].includes(preset)

  const primaryLabel =
    isXG     ? 'xG/82' :
    isGS     ? 'Gm Score' :
    isGoalP  ? 'G/82' :
    isPtPace ? 'Pts/82' :
    preset === 'goals'   ? 'G' :
    preset === 'assists' ? 'A' : 'PTS'

  function primaryValue(r: LeaderboardRow): string {
    if (isXG)    return r.xGoalsPer82?.toFixed(1) ?? '—'
    if (isGS)    return r.gameScore?.toFixed(2) ?? '—'
    if (isGoalP) return r.goalsPer82.toFixed(1)
    if (isPtPace) return r.pointsPer82.toFixed(1)
    if (preset === 'goals')   return String(r.goals)
    if (preset === 'assists') return String(r.assists)
    return String(r.points)
  }

  function switchMode(m: Mode) {
    setMode(m)
    setPreset(m === 'current' ? 'points' : 'hist-100pts')
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

      {/* Description chips */}
      {preset === 'ppg-pace' && (
        <p className="text-xs text-[var(--text-muted)]">Players on pace for 82+ points (min 20 GP)</p>
      )}
      {preset === '100-pt-pace' && (
        <p className="text-xs text-[var(--text-muted)]">Players on pace for 100+ points (min 20 GP)</p>
      )}
      {preset === 'hist-50goals' && (
        <p className="text-xs text-[var(--text-muted)]">All 50+ goal seasons 2008–2026 (min 50 GP), sorted by goals/82</p>
      )}
      {preset === 'hist-100pts' && (
        <p className="text-xs text-[var(--text-muted)]">All 100+ point seasons 2008–2026 (min 50 GP), sorted by total points</p>
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
                  <th className="text-center px-2 py-2.5">GP</th>
                  <th className="text-center px-2 py-2.5">G</th>
                  <th className="text-center px-2 py-2.5">A</th>
                  <th className="text-center px-2 py-2.5 text-[var(--accent-blue)] font-bold">{primaryLabel}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
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
                          <Image
                            src={row.headshot}
                            alt={row.name}
                            fill
                            className="object-cover object-top"
                            unoptimized
                          />
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
                    <td className="px-2 py-2.5 text-center tabular-nums font-bold text-[var(--text-primary)]">
                      {primaryValue(row)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && rows.length > 0 && (
          <div className="px-4 py-2 border-t border-[var(--border)] text-[10px] text-[var(--text-muted)]">
            {rows.length} result{rows.length !== 1 ? 's' : ''} ·{' '}
            {isHist ? 'MoneyPuck data 2008–2026, all-situations' : 'NHL API · 2025–26 regular season'}
          </div>
        )}
      </div>
    </div>
  )
}
