import type {
  NHLPlayerLanding,
  NHLPlayerSearchResult,
  NHLStatLeader,
  NHLStandingsTeam,
} from '@/types'

const BASE = 'https://api-web.nhle.com/v1'
const CURRENT_SEASON = '20242025'

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
    const data = await nhlfetch<{ players: NHLPlayerSearchResult[] }>(
      `/player-search?q=${encodeURIComponent(query)}&culture=en-us&limit=20`,
    )
    return (data.players ?? []).filter(p => p.active !== false)
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
) {
  try {
    return await nhlfetch<{ gameLog: unknown[] }>(
      `/player/${playerId}/game-log/${season}/${gameType}`,
    )
  } catch {
    return null
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function playerDisplayName(landing: NHLPlayerLanding): string {
  return `${landing.firstName.default} ${landing.lastName.default}`
}

export function playerHeadshotUrl(playerId: number): string {
  return `https://assets.nhle.com/mugs/nhl/20242025/${playerId}.png`
}

export function teamLogoUrl(abbrev: string): string {
  return `https://assets.nhle.com/logos/nhl/svg/${abbrev}_light.svg`
}
