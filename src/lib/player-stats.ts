/**
 * Derives PlayerStats from NHL API landing data based on timeframe.
 */

import type { NHLPlayerLanding, NHLSeasonTotal, PlayerStats, Timeframe } from '@/types'
import { playerDisplayName } from './nhl-api'

const CURRENT_SEASON = 20252026
const RECENT_SEASONS = [20252026, 20242025, 20232024]
const REGULAR = 2
const PLAYOFFS = 3

function isGoalie(landing: NHLPlayerLanding): boolean {
  return landing.position === 'G'
}

function sumSeasons(seasons: NHLSeasonTotal[]): Partial<NHLSeasonTotal> {
  if (seasons.length === 0) return {}

  const sum: Partial<NHLSeasonTotal> & { _count: number } = { _count: seasons.length }
  const addKeys: (keyof NHLSeasonTotal)[] = [
    'gamesPlayed', 'goals', 'assists', 'points', 'plusMinus', 'pim',
    'shots', 'powerPlayGoals', 'powerPlayPoints', 'shorthandedGoals',
    'gameWinningGoals', 'wins', 'losses', 'otLosses', 'shutouts', 'saves', 'shotsAgainst',
  ]
  for (const key of addKeys) {
    const vals = seasons.map(s => s[key] as number | undefined).filter((v): v is number => v !== undefined)
    if (vals.length > 0) (sum as unknown as Record<string, number>)[key] = vals.reduce((a, b) => a + b, 0)
  }

  // Weighted average for rate stats
  const gp = (sum.gamesPlayed as number | undefined) ?? 0
  if ((sum.saves as number | undefined) && (sum.shotsAgainst as number | undefined)) {
    sum.savePercentage = (sum.saves as number) / (sum.shotsAgainst as number)
  } else {
    // Weighted avg SV%
    const svSeasons = seasons.filter(s => s.savePercentage !== undefined && s.shotsAgainst)
    if (svSeasons.length > 0) {
      const totalShotsAgainst = svSeasons.reduce((a, s) => a + (s.shotsAgainst ?? 0), 0)
      sum.savePercentage = totalShotsAgainst
        ? svSeasons.reduce((a, s) => a + (s.savePercentage ?? 0) * (s.shotsAgainst ?? 0), 0) / totalShotsAgainst
        : svSeasons[svSeasons.length - 1].savePercentage
    }
  }
  if (gp > 0 && (sum.goals as number | undefined) !== undefined) {
    const totalGoals = (sum.goals as number | undefined) ?? 0
    // GAA = (total goals allowed * 60) / total icetime — approximate from GP
    const gaSeasons = seasons.filter(s => s.goalsAgainstAvg !== undefined)
    if (gaSeasons.length > 0) {
      sum.goalsAgainstAvg = gaSeasons.reduce((a, s) => a + (s.goalsAgainstAvg ?? 0), 0) / gaSeasons.length
    }
  }

  return sum
}

function buildPlayerStats(
  landing: NHLPlayerLanding,
  seasons: NHLSeasonTotal[],
): PlayerStats {
  const sum = sumSeasons(seasons)
  const gp = (sum.gamesPlayed as number) ?? 0
  const goals = sum.goals as number | undefined
  const points = sum.points as number | undefined

  return {
    playerId: landing.playerId,
    name: playerDisplayName(landing),
    headshot: landing.headshot,
    teamAbbrev: landing.currentTeamAbbrev,
    teamLogo: `https://assets.nhle.com/logos/nhl/svg/${landing.currentTeamAbbrev}_light.svg`,
    position: landing.position,
    isGoalie: isGoalie(landing),
    gamesPlayed: gp,
    goals,
    assists: sum.assists as number | undefined,
    points,
    plusMinus: sum.plusMinus as number | undefined,
    pim: sum.pim as number | undefined,
    shots: sum.shots as number | undefined,
    shootingPctg: gp > 0 && goals !== undefined && (sum.shots as number | undefined)
      ? goals / ((sum.shots as number) || 1)
      : undefined,
    powerPlayGoals: sum.powerPlayGoals as number | undefined,
    powerPlayPoints: sum.powerPlayPoints as number | undefined,
    shorthandedGoals: sum.shorthandedGoals as number | undefined,
    gameWinningGoals: sum.gameWinningGoals as number | undefined,
    wins: sum.wins as number | undefined,
    losses: sum.losses as number | undefined,
    otLosses: sum.otLosses as number | undefined,
    savePercentage: sum.savePercentage as number | undefined,
    goalsAgainstAvg: sum.goalsAgainstAvg as number | undefined,
    shutouts: sum.shutouts as number | undefined,
    pointsPerGame: gp > 0 && points !== undefined ? points / gp : undefined,
    goalsPerGame: gp > 0 && goals !== undefined ? goals / gp : undefined,
  }
}

export function getPlayerStatsByTimeframe(
  landing: NHLPlayerLanding,
  timeframe: Timeframe,
): PlayerStats {
  const allSeasons = landing.seasonTotals ?? []

  // Only consider NHL regular/playoff seasons
  const nhlSeasons = allSeasons.filter(s => s.leagueAbbrev === 'NHL')

  let relevant: NHLSeasonTotal[]
  if (timeframe === 'season') {
    relevant = nhlSeasons.filter(s => s.season === CURRENT_SEASON && s.gameTypeId === REGULAR)
  } else if (timeframe === 'playoffs') {
    relevant = nhlSeasons.filter(s => s.gameTypeId === PLAYOFFS)
  } else if (timeframe === 'last3') {
    relevant = nhlSeasons.filter(s => RECENT_SEASONS.includes(s.season) && s.gameTypeId === REGULAR)
  } else {
    // career
    relevant = nhlSeasons.filter(s => s.gameTypeId === REGULAR)
  }

  return buildPlayerStats(landing, relevant)
}
