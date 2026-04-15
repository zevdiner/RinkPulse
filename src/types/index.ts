// ─── NHL API Types ────────────────────────────────────────────────────────────

export interface NHLPlayerSearchResult {
  playerId: number
  name: string
  position: string
  sweaterNumber?: number
  teamAbbrev: string
  teamName?: string
  headshot: string
  active: boolean
}

export interface NHLPlayerLanding {
  playerId: number
  firstName: { default: string }
  lastName: { default: string }
  position: string
  headshot: string
  currentTeamAbbrev: string
  currentTeamName: { default: string }
  currentTeamLogo: string
  sweaterNumber: number
  heightInInches: number
  weightInPounds: number
  birthDate: string
  birthCity: { default: string }
  birthCountry: string
  draftDetails?: {
    year: number
    teamAbbrev: string
    round: number
    pickInRound: number
    overallPick: number
  }
  seasonTotals: NHLSeasonTotal[]
  featuredStats?: {
    season: number
    regularSeason: {
      subSeason: PlayerSubStats
      career: PlayerSubStats
    }
  }
}

export interface PlayerSubStats {
  gamesPlayed: number
  goals?: number
  assists?: number
  points?: number
  plusMinus?: number
  pim?: number
  shots?: number
  shootingPctg?: number
  powerPlayGoals?: number
  powerPlayPoints?: number
  shorthandedGoals?: number
  gameWinningGoals?: number
  // Goalie
  wins?: number
  losses?: number
  otLosses?: number
  savePercentage?: number
  goalsAgainstAvg?: number
  shutouts?: number
  saves?: number
  shotsAgainst?: number
}

export interface NHLSeasonTotal {
  season: number
  gameTypeId: number // 2=regular, 3=playoffs
  teamName: { default: string }
  teamAbbrev?: { default: string }
  leagueAbbrev: string
  gamesPlayed: number
  goals?: number
  assists?: number
  points?: number
  plusMinus?: number
  pim?: number
  shots?: number
  shootingPctg?: number
  powerPlayGoals?: number
  powerPlayPoints?: number
  shorthandedGoals?: number
  gameWinningGoals?: number
  // Goalie
  wins?: number
  losses?: number
  otLosses?: number
  savePercentage?: number
  goalsAgainstAvg?: number
  shutouts?: number
  saves?: number
  shotsAgainst?: number
  gamesStarted?: number
}

export interface NHLStatLeader {
  playerId: number
  name: { default: string }
  headshot: string
  teamAbbrev: { default: string }
  teamLogo: string
  position: string
  value: number
  // Extended fields depending on category
  gamesPlayed?: number
  goals?: number
  assists?: number
  points?: number
  wins?: number
  losses?: number
  savePctg?: number
  goalsAgainstAvg?: number
  shutouts?: number
}

export interface NHLStandingsTeam {
  teamAbbrev: { default: string }
  teamName: { default: string }
  teamLogo: string
  teamCommonName: { default: string }
  teamPlaceName: { default: string }
  points: number
  wins: number
  losses: number
  otLosses: number
  gamesPlayed: number
  goalFor: number
  goalAgainst: number
  goalDifferential: number
  streakCode: string
  streakCount: number
  divisionAbbrev: string
  conferenceAbbrev: string
  homeWins?: number
  homeLosses?: number
  roadWins?: number
  roadLosses?: number
  l10Wins?: number
  l10Losses?: number
}

// ─── MoneyPuck Types ──────────────────────────────────────────────────────────

export interface MPSkater {
  playerId: number
  season: number
  name: string
  team: string
  position: string
  situation: string
  games_played: number
  icetime: number
  gameScore: number
  onIce_corsiPercentage: number
  onIce_fenwickPercentage: number
  I_F_points: number
  I_F_goals: number
  I_F_primaryAssists: number
  I_F_secondaryAssists: number
  I_F_xGoals: number
  I_F_highDangerGoals: number
  I_F_highDangerShots: number
}

export interface MPGoalie {
  playerId: number
  season: number
  name: string
  team: string
  situation: string
  games_played: number
  icetime: number
  xGoals: number
  goals: number
  ongoal: number
  highDangerGoals: number
  highDangerShots: number
}

export interface MPLine {
  lineId: string
  season: number
  name: string
  team: string
  position: string
  situation: string
  games_played: number
  icetime: number
  xGoalsPercentage: number
  corsiPercentage: number
  fenwickPercentage: number
  goalsFor: number
  goalsAgainst: number
}

export interface MPTeam {
  team: string
  season: number
  situation: string
  games_played: number
  xGoalsPercentage: number
  corsiPercentage: number
  fenwickPercentage: number
  goalsFor: number
  goalsAgainst: number
  shotsOnGoalFor: number
  shotsOnGoalAgainst: number
}

// ─── Story Types ──────────────────────────────────────────────────────────────

export type StoryType =
  | 'scoring-pace'
  | 'goalie-gsaa'
  | 'team-corsi'
  | 'line-streak'
  | 'rookie-comp'
  | 'milestone'
  | 'hot-streak'
  | 'cold-streak'

export type BadgeColor = 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'teal' | 'orange'

export interface Story {
  id: string
  type: StoryType
  title: string
  subtitle: string
  description: string
  statLabel: string
  statValue: string
  historicalContext: string
  percentile?: number
  badge: string
  badgeColor: BadgeColor
  playerId?: number
  playerName?: string
  playerHeadshot?: string
  teamAbbrev?: string
  teamLogo?: string
  date: string
}

// ─── Comparison Types ─────────────────────────────────────────────────────────

export type Timeframe = 'season' | 'career' | 'last3' | 'playoffs'

export interface PlayerStats {
  playerId: number
  name: string
  headshot: string
  teamAbbrev: string
  teamLogo: string
  position: string
  isGoalie: boolean
  gamesPlayed: number
  goals?: number
  assists?: number
  points?: number
  plusMinus?: number
  pim?: number
  shots?: number
  shootingPctg?: number
  powerPlayGoals?: number
  powerPlayPoints?: number
  shorthandedGoals?: number
  gameWinningGoals?: number
  wins?: number
  losses?: number
  otLosses?: number
  savePercentage?: number
  goalsAgainstAvg?: number
  shutouts?: number
  pointsPerGame?: number
  goalsPerGame?: number
}

export interface ComparisonStat {
  label: string
  description: string
  key: keyof PlayerStats
  format: 'integer' | 'decimal1' | 'decimal2' | 'decimal3' | 'percent' | 'plusminus'
  higherIsBetter: boolean
}

// ─── Game Log Types ───────────────────────────────────────────────────────────

export type SparkMetric = 'points' | 'plusMinus' | 'toi'

// ─── Leaderboard Types ───────────────────────────────────────────────────────

export interface LeaderboardRow {
  playerId: number
  name: string
  team: string
  position: string
  season: string
  headshot: string
  gamesPlayed: number
  goals: number
  assists: number
  points: number
  pointsPer82: number
  goalsPer82: number
  xGoalsPer82?: number
  gameScore?: number
}

export interface NHLGameLogEntry {
  gameId: number
  teamAbbrev: string
  homeRoadFlag: string
  gameDate: string
  opponentAbbrev?: string
  goals: number
  assists: number
  points: number
  plusMinus: number
  powerPlayGoals: number
  shots: number
  hits: number
  blockedShots: number
  pim: number
  toi: string // "MM:SS"
}
