import { type NextRequest } from 'next/server'
import { getSkaterStats, playerHeadshotUrl } from '@/lib/nhl-api'
import { getSkaterSeasons, pointsPer82 } from '@/lib/moneypuck'
import type { LeaderboardRow } from '@/types'

function fmtSeason(s: number): string {
  const str = String(s)
  return `${str.slice(0, 4)}–${str.slice(6)}`
}

async function currentLeaderboard(preset: string): Promise<LeaderboardRow[]> {
  const sortKey =
    preset === 'goals'   ? 'goals' :
    preset === 'assists' ? 'assists' : 'points'

  const skaters = await getSkaterStats(sortKey, 100)

  const rows: LeaderboardRow[] = skaters.map(s => {
    const gp = s.gamesPlayed || 1
    return {
      playerId:    s.playerId,
      name:        s.skaterFullName,
      team:        s.teamAbbrevs?.split(',')[0].trim() ?? '',
      position:    s.positionCode,
      season:      '2025–26',
      headshot:    playerHeadshotUrl(s.playerId),
      gamesPlayed: s.gamesPlayed,
      goals:       s.goals,
      assists:     s.assists,
      points:      s.points,
      pointsPer82: (s.points / gp) * 82,
      goalsPer82:  (s.goals  / gp) * 82,
    }
  })

  return rows
}

function historicalLeaderboard(preset: string): LeaderboardRow[] {
  const allSeasons = getSkaterSeasons(50)

  // Guard: CSV not loaded (skaters_slim.csv missing on this deployment)
  if (allSeasons.length < 100) return []

  let filtered = allSeasons

  if (preset === 'hist-50goals') {
    filtered = allSeasons.filter(s => (s.I_F_goals / s.games_played) * 82 >= 50)
  } else if (preset === 'hist-100pts') {
    filtered = allSeasons.filter(s => s.I_F_points >= 100)
  }

  const sorted = filtered.sort((a, b) => {
    if (preset === 'hist-xg82')      return (b.I_F_xGoals / b.games_played) - (a.I_F_xGoals / a.games_played)
    if (preset === 'hist-gamescore') return b.gameScore - a.gameScore
    if (preset === 'hist-50goals')   return (b.I_F_goals / b.games_played) - (a.I_F_goals / a.games_played)
    return b.I_F_points - a.I_F_points
  })

  return sorted.slice(0, 100).map(s => ({
    playerId:    s.playerId,
    name:        s.name,
    team:        s.team,
    position:    s.position,
    season:      fmtSeason(s.season),
    headshot:    playerHeadshotUrl(s.playerId),
    gamesPlayed: s.games_played,
    goals:       Math.round(s.I_F_goals),
    assists:     Math.round(s.I_F_primaryAssists + s.I_F_secondaryAssists),
    points:      Math.round(s.I_F_points),
    pointsPer82: pointsPer82(s),
    goalsPer82:  (s.I_F_goals / s.games_played) * 82,
    xGoalsPer82: (s.I_F_xGoals / s.games_played) * 82,
    gameScore:   s.gameScore,
  }))
}

export async function GET(request: NextRequest) {
  const preset = new URL(request.url).searchParams.get('preset') ?? 'points'
  try {
    const rows = preset.startsWith('hist-')
      ? historicalLeaderboard(preset)
      : await currentLeaderboard(preset)
    return Response.json(rows)
  } catch {
    return Response.json([])
  }
}
