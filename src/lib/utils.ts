import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { ComparisonStat, PlayerStats } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Returns the percentile (0-100) of value in a sorted ascending array */
export function getPercentile(value: number, sortedValues: number[]): number {
  if (sortedValues.length === 0) return 50
  const below = sortedValues.filter(v => v < value).length
  return Math.round((below / sortedValues.length) * 100)
}

/** Formats a season code like 20232024 → "2023-24" */
export function formatSeason(season: number): string {
  const s = String(season)
  return `${s.slice(0, 4)}-${s.slice(6)}`
}

/** Projects stats to full 82-game pace */
export function projectToPace(value: number, gamesPlayed: number, totalGames = 82): number {
  if (gamesPlayed === 0) return 0
  return Math.round((value / gamesPlayed) * totalGames * 10) / 10
}

/** Formats a stat value based on display type */
export function formatStat(value: number | undefined, format: ComparisonStat['format']): string {
  if (value === undefined || value === null || isNaN(value)) return '—'
  switch (format) {
    case 'integer':
      return String(Math.round(value))
    case 'decimal1':
      return value.toFixed(1)
    case 'decimal2':
      return value.toFixed(2)
    case 'decimal3':
      return value.toFixed(3)
    case 'percent':
      return `${(value * 100).toFixed(1)}%`
    case 'plusminus':
      return value >= 0 ? `+${Math.round(value)}` : String(Math.round(value))
    default:
      return String(value)
  }
}

/** Today's date string YYYY-MM-DD */
export function todayString(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Ordinal suffix: 1 → "1st", 2 → "2nd" etc. */
export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

/** Returns a color class based on percentile */
export function percentileColor(p: number): string {
  if (p >= 97) return 'text-amber-400'
  if (p >= 90) return 'text-blue-400'
  if (p >= 75) return 'text-green-400'
  return 'text-slate-400'
}

/** Skater stat definitions for comparison */
export const SKATER_STATS: ComparisonStat[] = [
  { label: 'GP',       description: 'Games Played',                                                               key: 'gamesPlayed',     format: 'integer',  higherIsBetter: true  },
  { label: 'G',        description: 'Goals',                                                                      key: 'goals',           format: 'integer',  higherIsBetter: true  },
  { label: 'A',        description: 'Assists',                                                                     key: 'assists',         format: 'integer',  higherIsBetter: true  },
  { label: 'PTS',      description: 'Points (Goals + Assists)',                                                    key: 'points',          format: 'integer',  higherIsBetter: true  },
  { label: 'PTS/GP',   description: 'Points per game played — rate stat that adjusts for games missed',           key: 'pointsPerGame',   format: 'decimal2' as ComparisonStat['format'], higherIsBetter: true  },
  { label: '+/−',      description: 'Plus/Minus — +1 for each even-strength or shorthanded goal scored, −1 for each allowed, while on ice', key: 'plusMinus', format: 'plusminus', higherIsBetter: true },
  { label: 'PIM',      description: 'Penalties in Minutes',                                                       key: 'pim',             format: 'integer',  higherIsBetter: false },
  { label: 'SOG',      description: 'Shots on Goal',                                                              key: 'shots',           format: 'integer',  higherIsBetter: true  },
  { label: 'SH%',      description: 'Shooting Percentage — goals scored per shot on goal',                        key: 'shootingPctg',    format: 'percent',  higherIsBetter: true  },
  { label: 'PPG',      description: 'Power Play Goals — goals scored while the team has a man advantage',         key: 'powerPlayGoals',  format: 'integer',  higherIsBetter: true  },
  { label: 'PPP',      description: 'Power Play Points — points (goals + assists) scored on the power play',      key: 'powerPlayPoints', format: 'integer',  higherIsBetter: true  },
  { label: 'SHG',      description: 'Shorthanded Goals — goals scored while the team is a man down',              key: 'shorthandedGoals', format: 'integer', higherIsBetter: true  },
  { label: 'GWG',      description: 'Game-Winning Goals — goals that provided the final winning margin',          key: 'gameWinningGoals', format: 'integer', higherIsBetter: true  },
]

/** Goalie stat definitions for comparison */
export const GOALIE_STATS: ComparisonStat[] = [
  { label: 'GP',  description: 'Games Played',                                                                          key: 'gamesPlayed',    format: 'integer',  higherIsBetter: true  },
  { label: 'W',   description: 'Wins',                                                                                  key: 'wins',           format: 'integer',  higherIsBetter: true  },
  { label: 'L',   description: 'Regulation Losses',                                                                     key: 'losses',         format: 'integer',  higherIsBetter: false },
  { label: 'OTL', description: 'Overtime / Shootout Losses',                                                            key: 'otLosses',       format: 'integer',  higherIsBetter: false },
  { label: 'SV%', description: 'Save Percentage — saves made per shot faced (league average ~.905)',                    key: 'savePercentage', format: 'decimal3', higherIsBetter: true  },
  { label: 'GAA', description: 'Goals Against Average — goals allowed per 60 minutes played',                           key: 'goalsAgainstAvg', format: 'decimal2' as ComparisonStat['format'], higherIsBetter: false },
  { label: 'SO',  description: 'Shutouts — games where the goalie allowed zero goals',                                  key: 'shutouts',       format: 'integer',  higherIsBetter: true  },
]

/** Aggregate stats from an array of season totals */
export function aggregateStats(seasons: PlayerStats[]): Partial<PlayerStats> {
  const agg: Partial<PlayerStats> = { gamesPlayed: 0 }
  const numericKeys: (keyof PlayerStats)[] = [
    'gamesPlayed', 'goals', 'assists', 'points', 'plusMinus', 'pim',
    'shots', 'powerPlayGoals', 'powerPlayPoints', 'shorthandedGoals',
    'gameWinningGoals', 'wins', 'losses', 'otLosses', 'shutouts',
  ]
  for (const key of numericKeys) {
    const vals = seasons.map(s => s[key] as number | undefined).filter(v => v !== undefined)
    if (vals.length > 0) agg[key] = vals.reduce((a, b) => a + b!, 0) as never
  }
  // Recompute rate stats
  if (agg.gamesPlayed && agg.goals !== undefined) {
    agg.goalsPerGame = agg.goals / agg.gamesPlayed
  }
  if (agg.gamesPlayed && agg.points !== undefined) {
    agg.pointsPerGame = agg.points / agg.gamesPlayed
  }
  return agg
}
