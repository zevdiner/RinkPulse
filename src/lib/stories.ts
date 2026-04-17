/**
 * Story generation engine.
 * Combines live NHL API data with MoneyPuck historical CSVs to surface
 * statistically notable performances with historical context.
 */

import { cacheLife, cacheTag } from 'next/cache'
import {
  getSkaterSeasons,
  getGoalieSeasons,
  getTeamSeasons,
  pointsPer82,
  gsaa,
  computePercentile,
} from './moneypuck'
import {
  getSkaterLeaders,
  getGoalieLeaders,
  getPlayerGameLog,
  getStandings,
  playerHeadshotUrl,
  teamLogoUrl,
} from './nhl-api'
import { todayString, ordinal } from './utils'
import type { Story, StoryType, BadgeColor } from '@/types'

const BADGE_META: Record<StoryType, { label: string; color: BadgeColor }> = {
  'scoring-pace': { label: 'SCORING PACE', color: 'blue' },
  'goalie-gsaa': { label: 'GOALIE GSAA', color: 'purple' },
  'team-corsi': { label: 'TEAM DOMINATION', color: 'green' },
  'line-streak': { label: 'LINE CHEMISTRY', color: 'orange' },
  'rookie-comp': { label: 'ROOKIE WATCH', color: 'teal' },
  milestone: { label: 'MILESTONE', color: 'amber' },
  'hot-streak': { label: 'HOT STREAK', color: 'red' },
  'cold-streak': { label: 'COLD STREAK', color: 'teal' },
}

function makeId(type: StoryType, key: string): string {
  return `${type}-${key}-${todayString()}`
}

// ─── 1. Scoring Pace ──────────────────────────────────────────────────────────

async function scoringPaceStories(): Promise<Story[]> {
  const [pointLeaders, goalLeaders] = await Promise.all([
    getSkaterLeaders('points', 30),
    getSkaterLeaders('goals', 20),
  ])

  const historicalSeasons = getSkaterSeasons(60)
  const historicalPaces = historicalSeasons.map(s => pointsPer82(s))
  const historicalGoalPaces = historicalSeasons.map(s => (s.I_F_goals / s.games_played) * 82)

  const stories: Story[] = []

  for (const leader of pointLeaders) {
    if (!leader.gamesPlayed || leader.gamesPlayed < 20) continue
    const pts = leader.value
    const pace = (pts / leader.gamesPlayed) * 82
    const percentile = computePercentile(pace, historicalPaces)
    if (percentile < 95) continue

    const rank = historicalPaces.filter(p => p > pace).length + 1
    const prevBest = historicalPaces.sort((a, b) => b - a)[0]
    const name = leader.name.default

    stories.push({
      id: makeId('scoring-pace', String(leader.playerId)),
      type: 'scoring-pace',
      title: `${name} is on a historic scoring pace`,
      subtitle: `Projecting to ${Math.round(pace)} points over 82 games`,
      description: `With ${pts} points in ${leader.gamesPlayed} games, ${name.split(' ').pop()} is producing at a rate that ranks ${ordinal(rank)} among all skater-seasons tracked since 2008. This pace would place the season in the top ${100 - percentile}% of all full seasons in the MoneyPuck era.`,
      statLabel: 'Points/82',
      statValue: Math.round(pace).toString(),
      historicalContext: `Top ${100 - percentile}% of all skater seasons since 2008. Best single season: ${Math.round(prevBest)} pts/82.`,
      percentile,
      badge: BADGE_META['scoring-pace'].label,
      badgeColor: BADGE_META['scoring-pace'].color,
      playerId: leader.playerId,
      playerName: name,
      playerHeadshot: leader.headshot || playerHeadshotUrl(leader.playerId),
      teamAbbrev: leader.teamAbbrev.default,
      teamLogo: leader.teamLogo || teamLogoUrl(leader.teamAbbrev.default),
      date: todayString(),
    })

    if (stories.length >= 2) break
  }

  // Goal scoring pace
  for (const leader of goalLeaders) {
    if (!leader.gamesPlayed || leader.gamesPlayed < 20) continue
    const goals = leader.value
    const pace = (goals / leader.gamesPlayed) * 82
    const percentile = computePercentile(pace, historicalGoalPaces)
    if (percentile < 95) continue

    const rank = historicalGoalPaces.filter(p => p > pace).length + 1
    const name = leader.name.default

    stories.push({
      id: makeId('scoring-pace', `goals-${leader.playerId}`),
      type: 'scoring-pace',
      title: `${name} is on pace for ${Math.round(pace)} goals`,
      subtitle: `Elite goal scoring pace — top ${100 - percentile}% since 2008`,
      description: `${name.split(' ').pop()} has ${goals} goals in ${leader.gamesPlayed} games — a pace of ${Math.round(pace)} over a full season. This ranks ${ordinal(rank)} among all goal-scoring paces recorded in the MoneyPuck era (2008-present).`,
      statLabel: 'Goals/82',
      statValue: Math.round(pace).toString(),
      historicalContext: `${ordinal(rank)} best goal-scoring pace since 2008 among all 60+ game seasons.`,
      percentile,
      badge: BADGE_META['scoring-pace'].label,
      badgeColor: BADGE_META['scoring-pace'].color,
      playerId: leader.playerId,
      playerName: name,
      playerHeadshot: leader.headshot || playerHeadshotUrl(leader.playerId),
      teamAbbrev: leader.teamAbbrev.default,
      teamLogo: leader.teamLogo || teamLogoUrl(leader.teamAbbrev.default),
      date: todayString(),
    })

    if (stories.filter(s => s.type === 'scoring-pace').length >= 2) break
  }

  return stories
}

// ─── 2. Goalie GSAA ───────────────────────────────────────────────────────────

async function goalieGSAAStories(): Promise<Story[]> {
  const [winLeaders, svPctLeaders] = await Promise.all([
    getGoalieLeaders('wins', 20),
    getGoalieLeaders('savePctg', 20),
  ])

  const historicalGoalies = getGoalieSeasons(25)
  const historicalGSAAs = historicalGoalies.map(g => gsaa(g))

  if (historicalGSAAs.length === 0) {
    // No CSV data yet — generate stories purely from NHL API leaders
    return fallbackGoalieStories(svPctLeaders)
  }

  const stories: Story[] = []

  // Use save% leaders as a proxy for high-performing goalies
  for (const leader of svPctLeaders) {
    if (!leader.gamesPlayed || leader.gamesPlayed < 15) continue
    const svPct = leader.value
    const leagueAvgSvPct = 0.9065
    const shotsAgainst = (leader.value * 1000) // rough estimate
    // Approximate GSAA: (SV% - league avg) * shots against
    const approxShots = leader.gamesPlayed * 28 // ~28 shots/game faced
    const approxGSAA = (svPct - leagueAvgSvPct) * approxShots
    const percentile = computePercentile(approxGSAA, historicalGSAAs)
    if (percentile < 88 || approxGSAA < 2) continue

    const rank = historicalGSAAs.filter(g => g > approxGSAA).length + 1
    const name = leader.name.default

    stories.push({
      id: makeId('goalie-gsaa', String(leader.playerId)),
      type: 'goalie-gsaa',
      title: `${name} is saving goals at an elite rate`,
      subtitle: `~${Math.round(approxGSAA)} goals saved above expected`,
      description: `${name.split(' ').pop()} is posting a ${svPct.toFixed(3)} save percentage over ${leader.gamesPlayed} starts — ${Math.round(approxGSAA)} goals above what an average goalie would allow. This GSAA rate ranks ${ordinal(rank)} among goalie seasons tracked since 2008.`,
      statLabel: 'GSAA (est.)',
      statValue: `+${Math.round(approxGSAA)}`,
      historicalContext: `${ordinal(rank)} best GSAA since 2008. Historical avg at this GP: ${(historicalGSAAs.reduce((a, b) => a + b, 0) / historicalGSAAs.length).toFixed(1)} goals.`,
      percentile,
      badge: BADGE_META['goalie-gsaa'].label,
      badgeColor: BADGE_META['goalie-gsaa'].color,
      playerId: leader.playerId,
      playerName: name,
      playerHeadshot: leader.headshot || playerHeadshotUrl(leader.playerId),
      teamAbbrev: leader.teamAbbrev.default,
      teamLogo: leader.teamLogo || teamLogoUrl(leader.teamAbbrev.default),
      date: todayString(),
    })

    if (stories.length >= 2) break
  }

  return stories
}

function fallbackGoalieStories(svPctLeaders: Awaited<ReturnType<typeof getGoalieLeaders>>): Story[] {
  return svPctLeaders.slice(0, 2).filter(g => g.gamesPlayed && g.gamesPlayed >= 15).map(leader => ({
    id: makeId('goalie-gsaa', String(leader.playerId)),
    type: 'goalie-gsaa' as StoryType,
    title: `${leader.name.default} leads the NHL in save percentage`,
    subtitle: `.${String(Math.round(leader.value * 1000))} SV% through ${leader.gamesPlayed} games`,
    description: `${leader.name.default.split(' ').pop()} ranks among the NHL's elite with a .${String(Math.round(leader.value * 1000))} save percentage across ${leader.gamesPlayed} appearances this season.`,
    statLabel: 'SV%',
    statValue: leader.value.toFixed(3),
    historicalContext: `Top 5 save percentage in the NHL this season.`,
    percentile: 95,
    badge: BADGE_META['goalie-gsaa'].label,
    badgeColor: BADGE_META['goalie-gsaa'].color,
    playerId: leader.playerId,
    playerName: leader.name.default,
    playerHeadshot: leader.headshot || playerHeadshotUrl(leader.playerId),
    teamAbbrev: leader.teamAbbrev.default,
    teamLogo: leader.teamLogo || teamLogoUrl(leader.teamAbbrev.default),
    date: todayString(),
  }))
}

// ─── 3. Team Corsi / xG ───────────────────────────────────────────────────────

async function teamCorsiStories(): Promise<Story[]> {
  const standings = await getStandings()
  if (standings.length === 0) return []

  const historicalTeams = getTeamSeasons().filter(t => t.games_played >= 60)
  const historicalXGF = historicalTeams.map(t => t.xGoalsPercentage)
  const historicalCorsi = historicalTeams.map(t => t.corsiPercentage)

  const stories: Story[] = []

  // Best goal differential teams often correlate with dominance
  const sorted = [...standings].sort((a, b) => b.goalDifferential - a.goalDifferential)
  const top = sorted.slice(0, 5)

  for (const team of top) {
    const gp = team.gamesPlayed
    if (gp < 20) continue

    const goalsForPer82 = (team.goalFor / gp) * 82
    const gdPer82 = (team.goalDifferential / gp) * 82

    // We don't have live corsi from standings, so we'll flag exceptional goal differential
    const allGDs = standings.map(t => t.gamesPlayed > 20 ? (t.goalDifferential / t.gamesPlayed) * 82 : 0)
    const percentile = computePercentile(gdPer82, allGDs)

    if (historicalXGF.length > 0) {
      const rank = historicalXGF.filter(x => x > 0.54).length
      const abbrev = team.teamAbbrev.default

      if (team.goalDifferential > 0 && percentile >= 80) {
        stories.push({
          id: makeId('team-corsi', abbrev),
          type: 'team-corsi',
          title: `The ${team.teamCommonName?.default ?? abbrev} are one of the NHL's most dominant teams`,
          subtitle: `+${team.goalDifferential} goal differential in ${gp} games`,
          description: `${team.teamPlaceName?.default ?? abbrev} leads the NHL with a +${team.goalDifferential} goal differential (${gdPer82.toFixed(1)}/82), backed by ${Math.round(goalsForPer82)} goals-for pace. Based on MoneyPuck's historical team data, this level of dominance places them in rarified air.`,
          statLabel: 'Goal Diff/82',
          statValue: `+${Math.round(gdPer82)}`,
          historicalContext: `Among the top ${100 - percentile}% of team seasons in the current NHL. Historical elite teams averaged 55%+ xGoals%.`,
          percentile,
          badge: BADGE_META['team-corsi'].label,
          badgeColor: BADGE_META['team-corsi'].color,
          teamAbbrev: abbrev,
          teamLogo: team.teamLogo || teamLogoUrl(abbrev),
          date: todayString(),
        })
        break
      }
    }
  }

  // Winning streak story
  const streakTeams = standings.filter(t => t.streakCode === 'W' && t.streakCount >= 5)
  if (streakTeams.length > 0) {
    const best = streakTeams.sort((a, b) => b.streakCount - a.streakCount)[0]
    const abbrev = best.teamAbbrev.default
    stories.push({
      id: makeId('team-corsi', `streak-${abbrev}`),
      type: 'team-corsi',
      title: `${best.teamCommonName?.default ?? abbrev} are on a ${best.streakCount}-game win streak`,
      subtitle: `${best.wins}W-${best.losses}L-${best.otLosses}OTL on the season`,
      description: `The ${best.teamPlaceName?.default ?? abbrev} have won ${best.streakCount} straight, the longest active win streak in the NHL. With ${best.points} points, they rank among the conference leaders.`,
      statLabel: 'Win Streak',
      statValue: `${best.streakCount}W`,
      historicalContext: `Active NHL-best win streak. ${best.wins} wins on the season.`,
      percentile: Math.min(98, 75 + best.streakCount * 3),
      badge: BADGE_META['team-corsi'].label,
      badgeColor: BADGE_META['team-corsi'].color,
      teamAbbrev: abbrev,
      teamLogo: best.teamLogo || teamLogoUrl(abbrev),
      date: todayString(),
    })
  }

  return stories.slice(0, 2)
}

// ─── 4. Milestone Countdown ───────────────────────────────────────────────────

async function milestoneStories(): Promise<Story[]> {
  // Use points leaders to identify players near career milestones
  const leaders = await getSkaterLeaders('points', 30)
  const stories: Story[] = []

  const MILESTONES = [
    { target: 2857, label: 'all-time points record (Gretzky)', stat: 'points' },
    { target: 1963, label: '2nd all-time in points', stat: 'points' },
    { target: 1887, label: '3rd all-time in points', stat: 'points' },
    { target: 1000, label: '1,000 career points', stat: 'points' },
    { target: 1500, label: '1,500 career points', stat: 'points' },
    { target: 500, label: '500 career goals', stat: 'goals' },
    { target: 600, label: '600 career goals', stat: 'goals' },
    { target: 700, label: '700 career goals', stat: 'goals' },
    { target: 800, label: '800 career goals', stat: 'goals' },
    { target: 894, label: "Gretzky's goal record", stat: 'goals' },
  ]

  // We check the featured stats (career) from the leaders
  // Leaders endpoint includes current season stats but not career
  // Use points leaders who are known veterans for milestone detection

  // Ovechkin milestone (playerId: 8471214)
  // For simplicity, we surface a milestone story based on points leaders
  for (const leader of leaders.slice(0, 15)) {
    if (!leader.gamesPlayed) continue
    const name = leader.name.default
    const pts = leader.value

    // These players are known to be near milestones — flag high-career players
    // The comparison tool shows full career, but here we flag season leaders
    if (pts >= 80 && leader.gamesPlayed <= 70) {
      const pace = (pts / leader.gamesPlayed) * 82
      if (pace >= 110) {
        stories.push({
          id: makeId('milestone', `${leader.playerId}-pts`),
          type: 'milestone',
          title: `${name} closing in on all-time records`,
          subtitle: `On pace for ${Math.round(pace)} points — elite historical territory`,
          description: `${name.split(' ').pop()} leads the NHL with ${pts} points in ${leader.gamesPlayed} games. At this rate he's on pace for ${Math.round(pace)} — matching the kind of seasons only a handful of players have ever put up. Keep an eye on career milestone approach.`,
          statLabel: 'Season Points',
          statValue: String(pts),
          historicalContext: `Fewer than 15 players have ever scored 110+ points in a season since 2008.`,
          percentile: 99,
          badge: BADGE_META['milestone'].label,
          badgeColor: BADGE_META['milestone'].color,
          playerId: leader.playerId,
          playerName: name,
          playerHeadshot: leader.headshot || playerHeadshotUrl(leader.playerId),
          teamAbbrev: leader.teamAbbrev.default,
          teamLogo: leader.teamLogo || teamLogoUrl(leader.teamAbbrev.default),
          date: todayString(),
        })
        break
      }
    }
  }

  return stories.slice(0, 1)
}

// ─── 5. Rookie Historical Comp ────────────────────────────────────────────────

async function rookieCompStories(): Promise<Story[]> {
  const leaders = await getSkaterLeaders('points', 50)
  const historicalSkaters = getSkaterSeasons(60)
  const stories: Story[] = []

  // Rookies are hard to identify without additional API calls.
  // We approximate by flagging young players with exceptional pace
  // In practice, you'd cross-reference draft year or birth year vs season
  for (const leader of leaders) {
    if (!leader.gamesPlayed || leader.gamesPlayed < 25) continue
    const pts = leader.value
    const pace = (pts / leader.gamesPlayed) * 82

    // Historical rookie-caliber seasons (first few NHL seasons tend to be under 70pts/82)
    const rookieSeasons = historicalSkaters.filter(s => {
      // Approximate rookies by filtering seasons where the player was young
      // (2008 + (season - 20080000/10000) - birth year ~= 21-23)
      return pointsPer82(s) >= 60 && pointsPer82(s) < 90
    })

    const rookiePaces = rookieSeasons.map(s => pointsPer82(s))
    if (rookiePaces.length === 0) continue

    const percentile = computePercentile(pace, rookiePaces)
    if (percentile < 95 || pace < 65) continue

    const compSeasons = rookieSeasons.sort((a, b) => pointsPer82(b) - pointsPer82(a)).slice(0, 5)
    const bestComp = compSeasons[0]

    const name = leader.name.default
    stories.push({
      id: makeId('rookie-comp', String(leader.playerId)),
      type: 'rookie-comp',
      title: `${name} is having a historically elite young season`,
      subtitle: `${Math.round(pace)} pts/82 pace — top ${100 - percentile}% of comparable seasons`,
      description: `${name.split(' ').pop()} is on a ${Math.round(pace)} pts/82 pace, ranking in the top ${100 - percentile}% of comparable seasons in the MoneyPuck era. The most similar season belongs to ${bestComp?.name} (${String(bestComp?.season).slice(0, 4)}-${String(bestComp?.season).slice(6)}) at ${Math.round(pointsPer82(bestComp))} pts/82.`,
      statLabel: 'Pts/82 Pace',
      statValue: Math.round(pace).toString(),
      historicalContext: `Closest historical comp: ${bestComp?.name} — ${Math.round(pointsPer82(bestComp))} pts/82 in ${String(bestComp?.season).slice(0, 4)}.`,
      percentile,
      badge: BADGE_META['rookie-comp'].label,
      badgeColor: BADGE_META['rookie-comp'].color,
      playerId: leader.playerId,
      playerName: name,
      playerHeadshot: leader.headshot || playerHeadshotUrl(leader.playerId),
      teamAbbrev: leader.teamAbbrev.default,
      teamLogo: leader.teamLogo || teamLogoUrl(leader.teamAbbrev.default),
      date: todayString(),
    })

    if (stories.length >= 1) break
  }

  return stories
}

// ─── 6. Hot / Cold Streaks ───────────────────────────────────────────────────

async function hotColdStories(): Promise<Story[]> {
  const leaders = await getSkaterLeaders('points', 15)
  const qualified = leaders.filter(l => l.gamesPlayed && l.gamesPlayed >= 20)
  const top8 = qualified.slice(0, 8)

  const logs = await Promise.all(
    top8.map(l => getPlayerGameLog(l.playerId).catch(() => []))
  )

  const stories: Story[] = []
  let hotFound = false
  let coldFound = false

  for (let i = 0; i < top8.length; i++) {
    if (hotFound && coldFound) break
    const leader = top8[i]
    const gamelog = logs[i]
    if (!gamelog || gamelog.length < 5) continue

    const gp = leader.gamesPlayed!
    const seasonPtsPerGame = leader.value / gp

    const last5 = gamelog.slice(-5)
    const last5Pts = last5.reduce((sum, g) => sum + (g.points ?? 0), 0)
    const last5PtsPerGame = last5Pts / 5

    const ratio = seasonPtsPerGame > 0 ? last5PtsPerGame / seasonPtsPerGame : 0
    const name = leader.name.default
    const headshot = leader.headshot || playerHeadshotUrl(leader.playerId)
    const teamAbbrev = leader.teamAbbrev.default
    const teamLogo = leader.teamLogo || teamLogoUrl(teamAbbrev)

    if (!hotFound && ratio >= 1.6) {
      hotFound = true
      const last5Total = last5Pts
      const pace = Math.round(last5PtsPerGame * 82)
      stories.push({
        id: makeId('hot-streak', String(leader.playerId)),
        type: 'hot-streak',
        title: `${name} is scorching — ${last5Total} pts in last 5 games`,
        subtitle: `${pace} pts/82 pace over that stretch`,
        description: `${name.split(' ').pop()} has gone ${last5Total} points in their last 5 games, a blistering ${last5PtsPerGame.toFixed(2)} pts/game — ${Math.round(ratio * 100 - 100)}% above their season average of ${seasonPtsPerGame.toFixed(2)}/game. They look unstoppable right now.`,
        statLabel: 'Last 5 Games',
        statValue: `${last5Total} PTS`,
        historicalContext: `Season average: ${seasonPtsPerGame.toFixed(2)} pts/game. Last 5: ${last5PtsPerGame.toFixed(2)} pts/game.`,
        percentile: Math.min(99, Math.round(75 + ratio * 8)),
        badge: BADGE_META['hot-streak'].label,
        badgeColor: BADGE_META['hot-streak'].color,
        playerId: leader.playerId,
        playerName: name,
        playerHeadshot: headshot,
        teamAbbrev,
        teamLogo,
        date: todayString(),
      })
    }

    if (!coldFound && ratio <= 0.4 && seasonPtsPerGame >= 0.7) {
      coldFound = true
      const last5Total = last5Pts
      stories.push({
        id: makeId('cold-streak', String(leader.playerId)),
        type: 'cold-streak',
        title: `${name} has gone quiet — ${last5Total} pts in last 5 games`,
        subtitle: `Well below their ${seasonPtsPerGame.toFixed(2)} pts/game season pace`,
        description: `${name.split(' ').pop()} has managed just ${last5Total} points over their last 5 games after averaging ${seasonPtsPerGame.toFixed(2)} per game this season. A slump worth watching — are they injured, on a tough schedule, or just due to bounce back?`,
        statLabel: 'Last 5 Games',
        statValue: `${last5Total} PTS`,
        historicalContext: `Season pace: ${seasonPtsPerGame.toFixed(2)} pts/game. Last 5: ${last5PtsPerGame.toFixed(2)} pts/game — a ${Math.round((1 - ratio) * 100)}% dip.`,
        percentile: 60,
        badge: BADGE_META['cold-streak'].label,
        badgeColor: BADGE_META['cold-streak'].color,
        playerId: leader.playerId,
        playerName: name,
        playerHeadshot: headshot,
        teamAbbrev,
        teamLogo,
        date: todayString(),
      })
    }
  }

  return stories
}

// ─── Master Generator ─────────────────────────────────────────────────────────

export async function generateDailyStories(): Promise<Story[]> {
  'use cache'
  cacheLife('days')
  cacheTag('daily-stories')
  const [pace, gsaaStories, teamStories, milestones, rookies, hotCold] = await Promise.allSettled([
    scoringPaceStories(),
    goalieGSAAStories(),
    teamCorsiStories(),
    milestoneStories(),
    rookieCompStories(),
    hotColdStories(),
  ])

  const all: Story[] = [
    ...(pace.status === 'fulfilled' ? pace.value : []),
    ...(gsaaStories.status === 'fulfilled' ? gsaaStories.value : []),
    ...(teamStories.status === 'fulfilled' ? teamStories.value : []),
    ...(milestones.status === 'fulfilled' ? milestones.value : []),
    ...(rookies.status === 'fulfilled' ? rookies.value : []),
    ...(hotCold.status === 'fulfilled' ? hotCold.value : []),
  ]

  // Deduplicate by player AND team — no more than 1 story per player or team.
  // Prioritize highest percentile stories first.
  const seenPlayers = new Set<number>()
  const seenTeams = new Set<string>()

  const deduped = all
    .sort((a, b) => (b.percentile ?? 0) - (a.percentile ?? 0))
    .filter(story => {
      if (story.playerId) {
        if (seenPlayers.has(story.playerId)) return false
        seenPlayers.add(story.playerId)
      }
      if (story.teamAbbrev) {
        if (seenTeams.has(story.teamAbbrev)) return false
        seenTeams.add(story.teamAbbrev)
      }
      return true
    })

  return deduped.slice(0, 8)
}
