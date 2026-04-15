import { type NextRequest } from 'next/server'
import { getSkaterLeaders, playerHeadshotUrl } from '@/lib/nhl-api'
import { getSkaterSeasons, pointsPer82 } from '@/lib/moneypuck'
import type { LeaderboardRow, NHLStatLeader } from '@/types'

function fmtSeason(s: number): string {
  const str = String(s)
  return `${str.slice(0, 4)}–${str.slice(6)}`
}

async function currentLeaderboard(preset: string): Promise<LeaderboardRow[]> {
  // Determine which stat to sort by on the NHL API side
  const category =
    preset === 'goals'         ? 'goals' :
    preset === 'assists'       ? 'assists' :
    preset === '50-goal-pace'  ? 'goals' : 'points'

  // Fetch more rows for pace presets since we'll filter down
  const limit = ['ppg-pace', '100-pt-pace', '50-goal-pace'].includes(preset) ? 150 : 50

  const leaders: NHLStatLeader[] = await getSkaterLeaders(category, limit)

  let rows: LeaderboardRow[] = leaders.map(p => {
    const gp   = p.gamesPlayed ?? 1
    const g    = p.goals    ?? (category === 'goals'   ? p.value : 0)
    const a    = p.assists  ?? (category === 'assists'  ? p.value : 0)
    const pts  = p.points   ?? (category === 'points'  ? p.value : 0)
    return {
      playerId:    p.playerId,
      name:        p.name?.default ?? '',
      team:        p.teamAbbrev?.default ?? '',
      position:    p.position,
      season:      '2025–26',
      headshot:    p.headshot,
      gamesPlayed: gp,
      goals:       Math.round(g),
      assists:     Math.round(a),
      points:      Math.round(pts),
      pointsPer82: pts > 0 ? (pts / gp) * 82 : 0,
      goalsPer82:  g   > 0 ? (g   / gp) * 82 : 0,
    }
  })

  // Apply pace filters
  if (preset === 'ppg-pace') {
    rows = rows
      .filter(r => r.gamesPlayed >= 20 && r.pointsPer82 >= 82)
      .sort((a, b) => b.pointsPer82 - a.pointsPer82)
  } else if (preset === '100-pt-pace') {
    rows = rows
      .filter(r => r.gamesPlayed >= 20 && r.pointsPer82 >= 100)
      .sort((a, b) => b.pointsPer82 - a.pointsPer82)
  } else if (preset === '50-goal-pace') {
    rows = rows
      .filter(r => r.gamesPlayed >= 20)
      .sort((a, b) => b.goalsPer82 - a.goalsPer82)
      .slice(0, 50)
  }

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
