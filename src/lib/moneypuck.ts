import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import type { MPSkater, MPGoalie, MPLine, MPTeam } from '@/types'

const DATA_DIR = path.join(process.cwd(), 'data')

// Only parse the columns the story engine actually uses.
// This cuts peak memory by ~85% for the large skaters/lines files.
const SKATER_COLS = new Set([
  'playerId', 'season', 'name', 'team', 'position', 'situation',
  'games_played', 'icetime', 'gameScore',
  'onIce_corsiPercentage', 'onIce_fenwickPercentage',
  'I_F_points', 'I_F_goals', 'I_F_primaryAssists', 'I_F_secondaryAssists',
  'I_F_xGoals', 'I_F_highDangerGoals', 'I_F_highDangerShots',
])

const GOALIE_COLS = new Set([
  'playerId', 'season', 'name', 'team', 'situation',
  'games_played', 'icetime', 'xGoals', 'goals',
  'ongoal', 'highDangerGoals', 'highDangerShots',
])

const LINE_COLS = new Set([
  'lineId', 'season', 'name', 'team', 'position', 'situation',
  'games_played', 'icetime',
  'xGoalsPercentage', 'corsiPercentage', 'fenwickPercentage',
  'goalsFor', 'goalsAgainst',
])

const TEAM_COLS = new Set([
  'team', 'season', 'situation', 'games_played',
  'xGoalsPercentage', 'corsiPercentage', 'fenwickPercentage',
  'goalsFor', 'goalsAgainst', 'shotsOnGoalFor', 'shotsOnGoalAgainst',
])

function readCSV<T>(filename: string, keepCols: Set<string>): T[] {
  const filePath = path.join(DATA_DIR, filename)
  if (!fs.existsSync(filePath)) return []
  try {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const results: T[] = []

    Papa.parse<Record<string, unknown>>(raw, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      step: (row) => {
        // Only keep the columns we need — drops ~85-90% of the parsed data
        const slim: Record<string, unknown> = {}
        for (const col of keepCols) {
          if (col in row.data) slim[col] = row.data[col]
        }
        results.push(slim as T)
      },
    })

    return results
  } catch {
    return []
  }
}

// Module-level cache — survives across requests in the same warm serverless instance
let _skaters: MPSkater[] | null = null
let _goalies: MPGoalie[] | null = null
let _lines: MPLine[] | null = null
let _teams: MPTeam[] | null = null

export function getSkaters(): MPSkater[] {
  if (!_skaters) _skaters = readCSV<MPSkater>('skaters.csv', SKATER_COLS)
  return _skaters
}

export function getGoalies(): MPGoalie[] {
  if (!_goalies) _goalies = readCSV<MPGoalie>('goalies.csv', GOALIE_COLS)
  return _goalies
}

export function getLines(): MPLine[] {
  if (!_lines) {
    // lines_slim.csv is the committed, Vercel-safe version (situation=all, key cols only).
    // Fall back to the full lines.csv when running locally with the original file.
    _lines = readCSV<MPLine>('lines_slim.csv', LINE_COLS)
    if (_lines.length === 0) _lines = readCSV<MPLine>('lines.csv', LINE_COLS)
  }
  return _lines
}

/** Search lines by player last name (case-insensitive substring match on the name field) */
export function searchLines(query: string, limit = 60): MPLine[] {
  if (!query || query.length < 2) return []
  const lower = query.toLowerCase()
  return getLines()
    .filter(l => l.name.toLowerCase().includes(lower))
    .sort((a, b) => b.season - a.season)
    .slice(0, limit)
}

export function getTeams(): MPTeam[] {
  if (!_teams) _teams = readCSV<MPTeam>('teams.csv', TEAM_COLS)
  return _teams
}

// ─── Derived Queries ──────────────────────────────────────────────────────────

/** All-situations skater seasons with minimum games played */
export function getSkaterSeasons(minGames = 50): MPSkater[] {
  return getSkaters().filter(
    s => s.situation === 'all' && s.games_played >= minGames,
  )
}

/** All-situations goalie seasons with minimum games played */
export function getGoalieSeasons(minGames = 20): MPGoalie[] {
  return getGoalies().filter(
    g => g.situation === 'all' && g.games_played >= minGames,
  )
}

/** All-situations team seasons */
export function getTeamSeasons(): MPTeam[] {
  return getTeams().filter(t => t.situation === 'all')
}

/** Points-per-82 for a skater season */
export function pointsPer82(s: MPSkater): number {
  if (!s.games_played) return 0
  return (s.I_F_points / s.games_played) * 82
}

/** GSAA (Goals Saved Above Average) for a goalie season.
 *  MoneyPuck: xGoals = expected goals against, goals = actual goals against
 *  GSAA = xGoals - goals (positive = better than expected) */
export function gsaa(g: MPGoalie): number {
  return g.xGoals - g.goals
}

/** GSAA rate per 60 minutes */
export function gsaaPer60(g: MPGoalie): number {
  if (!g.icetime) return 0
  return (gsaa(g) / g.icetime) * 3600
}

/** Returns percentile rank (0-100) of value among all values in array */
export function computePercentile(value: number, values: number[]): number {
  if (values.length === 0) return 50
  const sorted = [...values].sort((a, b) => a - b)
  const below = sorted.filter(v => v < value).length
  return Math.round((below / sorted.length) * 100)
}

/** Historical skater seasons sorted by pts/82 descending */
export function topHistoricalSkatersBy82(minGames = 60): MPSkater[] {
  return getSkaterSeasons(minGames)
    .sort((a, b) => pointsPer82(b) - pointsPer82(a))
}

/** Historical goalie seasons sorted by GSAA descending */
export function topHistoricalGoaliesByGSAA(minGames = 25): MPGoalie[] {
  return getGoalieSeasons(minGames)
    .sort((a, b) => gsaa(b) - gsaa(a))
}

/** Historical team seasons sorted by xGoals% descending */
export function topHistoricalTeamsByXGF(minGames = 60): MPTeam[] {
  return getTeamSeasons()
    .filter(t => t.games_played >= minGames)
    .sort((a, b) => b.xGoalsPercentage - a.xGoalsPercentage)
}

/** Normalize a player name for fuzzy matching:
 *  lowercases, strips diacritics, collapses hyphens/apostrophes/dots */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // strip accent marks
    .replace(/['\u2019\-\.]/g, '')    // strip apostrophes, hyphens, dots
    .replace(/\s+/g, ' ')
    .trim()
}

/** Find historical seasons for a specific player by name */
export function skaterHistoricalSeasons(name: string): MPSkater[] {
  const norm = normalizeName(name)
  return getSkaterSeasons(20).filter(s => normalizeName(s.name) === norm)
}

/** Find historical seasons for a specific goalie by name */
export function goalieHistoricalSeasons(name: string): MPGoalie[] {
  const norm = normalizeName(name)
  return getGoalieSeasons(10).filter(g => normalizeName(g.name) === norm)
}

/** Whether any data files are present */
export function hasData(): boolean {
  return fs.existsSync(path.join(DATA_DIR, 'skaters.csv'))
}
