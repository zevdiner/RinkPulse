import { cacheLife, cacheTag } from 'next/cache'
import { getSkaterLeaders, getPlayerLanding, playerHeadshotUrl, teamLogoUrl } from './nhl-api'

export interface MilestoneAlert {
  playerId: number
  playerName: string
  headshot: string
  teamAbbrev: string
  teamLogo: string
  stat: 'goals' | 'points'
  target: number
  targetLabel: string
  current: number
  remaining: number
}

const GOAL_MILESTONES = [
  { target: 500, label: '500 career goals' },
  { target: 600, label: '600 career goals' },
  { target: 700, label: '700 career goals' },
  { target: 800, label: '800 career goals' },
  { target: 894, label: "Gretzky's all-time goal record" },
]

const POINT_MILESTONES = [
  { target: 1000, label: '1,000 career points' },
  { target: 1500, label: '1,500 career points' },
  { target: 2000, label: '2,000 career points' },
  { target: 2857, label: "Gretzky's all-time points record" },
]

export async function getMilestoneAlerts(): Promise<MilestoneAlert[]> {
  'use cache'
  cacheLife('days')
  cacheTag('milestone-tracker')

  // Gather candidate players from both goal and point leaders
  const [goalLeaders, pointLeaders] = await Promise.all([
    getSkaterLeaders('goals', 20).catch(() => []),
    getSkaterLeaders('points', 20).catch(() => []),
  ])

  const uniqueIds = [...new Set([
    ...goalLeaders.map(l => l.playerId),
    ...pointLeaders.map(l => l.playerId),
  ])]

  // Fetch landing pages for all candidates in parallel
  const landings = await Promise.all(
    uniqueIds.map(id => getPlayerLanding(id).catch(() => null))
  )

  const alerts: MilestoneAlert[] = []

  for (const landing of landings) {
    if (!landing) continue

    // Sum career NHL regular-season goals and points
    const nhlRegular = (landing.seasonTotals ?? []).filter(
      s => s.leagueAbbrev === 'NHL' && s.gameTypeId === 2
    )
    const careerGoals = nhlRegular.reduce((sum, s) => sum + (s.goals ?? 0), 0)
    const careerPoints = nhlRegular.reduce((sum, s) => sum + (s.points ?? 0), 0)

    const name = `${landing.firstName.default} ${landing.lastName.default}`
    const teamAbbrev = landing.currentTeamAbbrev
    const headshot = landing.headshot || playerHeadshotUrl(landing.playerId)
    const logo = landing.currentTeamLogo || teamLogoUrl(teamAbbrev)

    for (const m of GOAL_MILESTONES) {
      const remaining = m.target - careerGoals
      if (remaining > 0 && remaining <= 30) {
        alerts.push({
          playerId: landing.playerId,
          playerName: name,
          headshot,
          teamAbbrev,
          teamLogo: logo,
          stat: 'goals',
          target: m.target,
          targetLabel: m.label,
          current: careerGoals,
          remaining,
        })
      }
    }

    for (const m of POINT_MILESTONES) {
      const remaining = m.target - careerPoints
      if (remaining > 0 && remaining <= 30) {
        alerts.push({
          playerId: landing.playerId,
          playerName: name,
          headshot,
          teamAbbrev,
          teamLogo: logo,
          stat: 'points',
          target: m.target,
          targetLabel: m.label,
          current: careerPoints,
          remaining,
        })
      }
    }
  }

  // Sort by closest first
  return alerts.sort((a, b) => a.remaining - b.remaining)
}
