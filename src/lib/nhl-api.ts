import type {
  NHLGameLogEntry,
  NHLPlayerLanding,
  NHLPlayerSearchResult,
  NHLStatLeader,
  NHLStandingsTeam,
} from '@/types'

const BASE = 'https://api-web.nhle.com/v1'
const STATS_BASE = 'https://api.nhle.com/stats/rest/en'
const CURRENT_SEASON = '20252026'

async function nhlfetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`NHL API ${res.status}: ${path}`)
  return res.json()
}

// ─── Player Search ────────────────────────────────────────────────────────────

export async function searchPlayers(query: string): Promise<NHLPlayerSearchResult[]> {
  if (!query || query.length < 2) return []
  try {
    const skaterExp = `seasonId=${CURRENT_SEASON} and skaterFullName likeIgnoreCase "%${query}%"`
    const goalieExp = `seasonId=${CURRENT_SEASON} and goalieFullName likeIgnoreCase "%${query}%"`

    const [skaterRes, goalieRes] = await Promise.all([
      fetch(`${STATS_BASE}/skater/summary?limit=20&cayenneExp=${encodeURIComponent(skaterExp)}`, {
        headers: { Accept: 'application/json' },
      }),
      fetch(`${STATS_BASE}/goalie/summary?limit=10&cayenneExp=${encodeURIComponent(goalieExp)}`, {
        headers: { Accept: 'application/json' },
      }),
    ])

    const results: NHLPlayerSearchResult[] = []

    if (skaterRes.ok) {
      const data = await skaterRes.json() as { data: Array<{ playerId: number; skaterFullName: string; positionCode: string; teamAbbrevs: string }> }
      for (const s of data.data ?? []) {
        const abbrev = s.teamAbbrevs?.split(',')[0].trim() ?? ''
        results.push({
          playerId: s.playerId,
          name: s.skaterFullName,
          position: s.positionCode,
          teamAbbrev: abbrev,
          headshot: playerHeadshotUrl(s.playerId),
          active: true,
        })
      }
    }

    if (goalieRes.ok) {
      const data = await goalieRes.json() as { data: Array<{ playerId: number; goalieFullName: string; teamAbbrevs: string }> }
      for (const g of data.data ?? []) {
        const abbrev = g.teamAbbrevs?.split(',')[0].trim() ?? ''
        results.push({
          playerId: g.playerId,
          name: g.goalieFullName,
          position: 'G',
          teamAbbrev: abbrev,
          headshot: playerHeadshotUrl(g.playerId),
          active: true,
        })
      }
    }

    return results
  } catch {
    return []
  }
}

// ─── Player Landing ───────────────────────────────────────────────────────────

export async function getPlayerLanding(playerId: number): Promise<NHLPlayerLanding | null> {
  try {
    return await nhlfetch<NHLPlayerLanding>(`/player/${playerId}/landing`)
  } catch {
    return null
  }
}

// ─── Stat Leaders ─────────────────────────────────────────────────────────────

export async function getSkaterLeaders(
  category: string,
  limit = 25,
): Promise<NHLStatLeader[]> {
  try {
    const data = await nhlfetch<Record<string, NHLStatLeader[]>>(
      `/skater-stats-leaders/current?categories=${category}&limit=${limit}`,
    )
    return data[category] ?? []
  } catch {
    return []
  }
}

export async function getGoalieLeaders(
  category: string,
  limit = 25,
): Promise<NHLStatLeader[]> {
  try {
    const data = await nhlfetch<Record<string, NHLStatLeader[]>>(
      `/goalie-stats-leaders/current?categories=${category}&limit=${limit}`,
    )
    return data[category] ?? []
  } catch {
    return []
  }
}

// ─── Standings ────────────────────────────────────────────────────────────────

export async function getStandings(): Promise<NHLStandingsTeam[]> {
  try {
    const data = await nhlfetch<{ standings: NHLStandingsTeam[] }>('/standings/now')
    return data.standings ?? []
  } catch {
    return []
  }
}

// ─── Team Stats ───────────────────────────────────────────────────────────────

export async function getTeamStats(teamAbbrev: string): Promise<Record<string, unknown> | null> {
  try {
    return await nhlfetch(`/club-stats/${teamAbbrev}/now`)
  } catch {
    return null
  }
}

// ─── Player Game Log ──────────────────────────────────────────────────────────

export async function getPlayerGameLog(
  playerId: number,
  season = CURRENT_SEASON,
  gameType = 2,
): Promise<NHLGameLogEntry[]> {
  try {
    const data = await nhlfetch<{ gameLog: NHLGameLogEntry[] }>(
      `/player/${playerId}/game-log/${season}/${gameType}`,
    )
    return data.gameLog ?? []
  } catch {
    return []
  }
}

// ─── Skater Stats (stats/rest summary endpoint) ───────────────────────────────

export interface NHLSkaterStats {
  playerId: number
  skaterFullName: string
  positionCode: string
  teamAbbrevs: string
  gamesPlayed: number
  goals: number
  assists: number
  points: number
  plusMinus: number
  shots: number
  shootingPctg: number
  powerPlayGoals: number
  powerPlayPoints: number
}

export async function getSkaterStats(
  sort: 'points' | 'goals' | 'assists' = 'points',
  limit = 100,
  teamAbbrev?: string,
): Promise<NHLSkaterStats[]> {
  let exp = `seasonId=${CURRENT_SEASON} and gameTypeId=2`
  if (teamAbbrev) exp += ` and teamAbbrevs likeIgnoreCase "%${teamAbbrev}%"`
  const sortParam = encodeURIComponent(JSON.stringify([{ property: sort, direction: 'DESC' }]))
  try {
    const res = await fetch(
      `${STATS_BASE}/skater/summary?limit=${limit}&sort=${sortParam}&cayenneExp=${encodeURIComponent(exp)}`,
      { headers: { Accept: 'application/json' } },
    )
    if (!res.ok) return []
    const data = await res.json() as { data: NHLSkaterStats[] }
    return data.data ?? []
  } catch {
    return []
  }
}

// ─── Goalie Stats (stats/rest summary endpoint) ───────────────────────────────

export interface NHLGoalieStats {
  playerId: number
  goalieFullName: string
  teamAbbrevs: string
  gamesPlayed: number
  gamesStarted: number
  wins: number
  losses: number
  otLosses: number
  savePctg: number
  goalsAgainstAverage: number
  shutouts: number
}

export async function getGoalieStats(
  limit = 50,
  teamAbbrev?: string,
): Promise<NHLGoalieStats[]> {
  let exp = `seasonId=${CURRENT_SEASON} and gameTypeId=2`
  if (teamAbbrev) exp += ` and teamAbbrevs likeIgnoreCase "%${teamAbbrev}%"`
  const sortParam = encodeURIComponent(JSON.stringify([{ property: 'wins', direction: 'DESC' }]))
  try {
    const res = await fetch(
      `${STATS_BASE}/goalie/summary?limit=${limit}&sort=${sortParam}&cayenneExp=${encodeURIComponent(exp)}`,
      { headers: { Accept: 'application/json' } },
    )
    if (!res.ok) return []
    const data = await res.json() as { data: NHLGoalieStats[] }
    return data.data ?? []
  } catch {
    return []
  }
}

// ─── Historical Games by Date ─────────────────────────────────────────────────

export interface NHLHistoricalGame {
  season: number
  gameType: number // 2=regular, 3=playoff
  gameDate: string
  homeTeam: { abbrev: string; score: number; commonName?: { default: string } }
  awayTeam: { abbrev: string; score: number; commonName?: { default: string } }
  gameOutcome?: { lastPeriodType: string } // REG, OT, SO
}

export async function getGamesOnDate(dateStr: string): Promise<NHLHistoricalGame[]> {
  try {
    const data = await nhlfetch<{ games: NHLHistoricalGame[] }>(`/score/${dateStr}`)
    return data.games ?? []
  } catch { return [] }
}

// ─── Club / Team Stats ────────────────────────────────────────────────────────

export interface NHLClubSkaterStat {
  playerId: number
  headshot: string
  firstName: { default: string }
  lastName: { default: string }
  positionCode: string
  gamesPlayed: number
  goals: number
  assists: number
  points: number
  plusMinus: number
  pim: number
  shots: number
  shootingPctg: number
  powerPlayGoals: number
  powerPlayPoints: number
  shorthandedGoals: number
  gameWinningGoals: number
}

export interface NHLClubGoalieStat {
  playerId: number
  headshot: string
  firstName: { default: string }
  lastName: { default: string }
  gamesPlayed: number
  gamesStarted: number
  wins: number
  losses: number
  otLosses: number
  goalsAgainstAvg: number
  savePctg: number
  shutouts: number
}

export interface NHLClubStatsResponse {
  skaters: NHLClubSkaterStat[]
  goalies: NHLClubGoalieStat[]
}

export async function getClubStats(abbrev: string): Promise<NHLClubStatsResponse | null> {
  try {
    return await nhlfetch<NHLClubStatsResponse>(`/club-stats/${abbrev}/now`)
  } catch {
    return null
  }
}

// ─── Team Recent Games ────────────────────────────────────────────────────────

export interface NHLScheduleGame {
  id: number
  gameDate: string
  gameState: string // FINAL, LIVE, PRE, FUT
  gameType: number
  awayTeam: { abbrev: string; score?: number; logo?: string }
  homeTeam: { abbrev: string; score?: number; logo?: string }
  gameOutcome?: { lastPeriodType: string }
}

export async function getTeamRecentGames(abbrev: string): Promise<NHLScheduleGame[]> {
  try {
    // Fetches the week schedule; we'll call month to get more history
    const data = await nhlfetch<{ games?: NHLScheduleGame[]; previousSeason?: NHLScheduleGame[] }>(
      `/club-schedule/${abbrev}/month/now`
    )
    const games: NHLScheduleGame[] = data.games ?? []
    return games
      .filter(g => g.gameState === 'FINAL' || g.gameState === 'OFF')
      .sort((a, b) => b.gameDate.localeCompare(a.gameDate))
      .slice(0, 10)
  } catch {
    return []
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function playerDisplayName(landing: NHLPlayerLanding): string {
  return `${landing.firstName.default} ${landing.lastName.default}`
}

export function playerHeadshotUrl(playerId: number): string {
  return `https://assets.nhle.com/mugs/nhl/20252026/${playerId}.png`
}

export function teamLogoUrl(abbrev: string): string {
  return `https://assets.nhle.com/logos/nhl/svg/${abbrev}_light.svg`
}
