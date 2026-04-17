import { Suspense } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cacheLife, cacheTag } from 'next/cache'
import type { Metadata } from 'next'
import { getCachedLanding } from '@/lib/cached-landing'
import { playerDisplayName, teamLogoUrl } from '@/lib/nhl-api'
import {
  skaterHistoricalSeasons,
  goalieHistoricalSeasons,
  getSkaterSeasons,
  getGoalieSeasons,
  computePercentile,
  pointsPer82,
} from '@/lib/moneypuck'
import { formatSeason } from '@/lib/utils'
import ShareButton from '@/components/ShareButton'
import CareerArcChart from '@/components/CareerArcChart'
import SeasonTable from '@/components/SeasonTable'
import PercentileBars from '@/components/PercentileBars'
import HistoricalComps from '@/components/HistoricalComps'
import type { CareerArcPoint } from '@/components/CareerArcChart'
import type { PercentileEntry } from '@/components/PercentileBars'
import type { HistoricalComp } from '@/components/HistoricalComps'
import type { NHLSeasonTotal } from '@/types'

const CURRENT_SEASON = 20252026

// ─── Cached data fetch ────────────────────────────────────────────────────────

async function fetchProfile(playerId: number) {
  'use cache'
  cacheLife('hours')
  cacheTag(`player-${playerId}`)
  return getCachedLanding(playerId)
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata(
  props: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await props.params
  const landing = await fetchProfile(Number(id))
  if (!landing) return { title: 'Player — RinkPulse' }
  const name = playerDisplayName(landing)
  return {
    title: `${name} — RinkPulse`,
    description: `Career stats, advanced metrics, and historical comparisons for ${name}.`,
    openGraph: {
      title: `${name} — RinkPulse`,
      description: `Career arc, MoneyPuck percentiles, and comparable seasons for ${name}.`,
      images: [landing.headshot],
    },
  }
}

// ─── Page shell — params access deferred into Suspense per cacheComponents ───

export default function PlayerPage(props: { params: Promise<{ id: string }> }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Suspense fallback={<PlayerSkeleton />}>
        <PlayerContent params={props.params} />
      </Suspense>
    </div>
  )
}

function PlayerSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="card p-6">
        <div className="flex gap-6">
          <div className="skeleton w-24 h-24 rounded-full shrink-0" />
          <div className="flex flex-col gap-3 flex-1">
            <div className="skeleton h-8 w-48" />
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-4 w-56" />
          </div>
        </div>
      </div>
      <div className="card p-5 skeleton h-56" />
      <div className="card p-5 skeleton h-64" />
    </div>
  )
}

// ─── All dynamic data access is inside this component (inside Suspense) ───────

async function PlayerContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const playerId = Number(id)
  if (isNaN(playerId)) notFound()

  const landing = await fetchProfile(playerId)
  if (!landing) notFound()

  const name = playerDisplayName(landing)
  const isGoalie = landing.position === 'G'
  const teamAbbrev = landing.currentTeamAbbrev

  // ── NHL regular seasons only ──────────────────────────────────────────────
  const nhlRegular: NHLSeasonTotal[] = (landing.seasonTotals ?? [])
    .filter(s => s.leagueAbbrev === 'NHL' && s.gameTypeId === 2)
    .sort((a, b) => a.season - b.season)

  // ── Career arc chart data ─────────────────────────────────────────────────
  const chartData: CareerArcPoint[] = nhlRegular
    .filter(s => s.gamesPlayed >= 10)
    .map(s => ({
      season: formatSeason(s.season),
      points: s.points ?? null,
      goals: s.goals ?? null,
      wins: s.wins ?? null,
    }))

  // ── MoneyPuck percentiles ─────────────────────────────────────────────────
  const percentileEntries: PercentileEntry[] = []
  let refSeasonLabel: string | null = null

  if (!isGoalie) {
    const allSeasons = getSkaterSeasons(50)
    // Guard: if CSV data isn't loaded (Vercel cold boot edge case), skip percentiles
    // rather than showing everyone at 50th percentile
    const mpSeasons = allSeasons.length >= 100 ? skaterHistoricalSeasons(name) : []
    const refSeason = allSeasons.length >= 100
      ? (nhlRegular.find(s => s.season === CURRENT_SEASON && (s.gamesPlayed ?? 0) >= 5) ??
         [...nhlRegular].reverse().find(s => (s.gamesPlayed ?? 0) >= 5))
      : undefined
    refSeasonLabel = refSeason ? formatSeason(refSeason.season) : null
    const mpRef = mpSeasons.find(s => s.season === (refSeason?.season ?? CURRENT_SEASON)) ??
      mpSeasons[mpSeasons.length - 1]

    if (refSeason && refSeason.gamesPlayed >= 5) {
      const gp = refSeason.gamesPlayed

      const allPts82 = allSeasons.map(s => pointsPer82(s))
      const pts82 = ((refSeason.points ?? 0) / gp) * 82
      percentileEntries.push({
        label: 'Pts/82',
        description: 'Points per 82 games pace',
        value: pts82.toFixed(1),
        percentile: computePercentile(pts82, allPts82),
      })

      const allG82 = allSeasons.map(s => (s.I_F_goals / s.games_played) * 82)
      const g82 = ((refSeason.goals ?? 0) / gp) * 82
      percentileEntries.push({
        label: 'G/82',
        description: 'Goals per 82 games pace',
        value: g82.toFixed(1),
        percentile: computePercentile(g82, allG82),
      })

      if (mpRef) {
        const allXG82 = allSeasons.map(s => (s.I_F_xGoals / s.games_played) * 82)
        const xg82 = (mpRef.I_F_xGoals / mpRef.games_played) * 82
        percentileEntries.push({
          label: 'xG/82',
          description: 'Expected goals per 82 — shot quality metric',
          value: xg82.toFixed(1),
          percentile: computePercentile(xg82, allXG82),
        })

        const allCF = allSeasons.map(s => s.onIce_corsiPercentage)
        percentileEntries.push({
          label: 'CF%',
          description: 'Corsi For % — shot attempt share while on ice',
          value: `${(mpRef.onIce_corsiPercentage * 100).toFixed(1)}%`,
          percentile: computePercentile(mpRef.onIce_corsiPercentage, allCF),
        })

        const allGS = allSeasons.map(s => s.gameScore)
        percentileEntries.push({
          label: 'Game Score',
          description: 'MoneyPuck composite performance metric',
          value: mpRef.gameScore.toFixed(2),
          percentile: computePercentile(mpRef.gameScore, allGS),
        })
      }
    }
  }

  if (isGoalie) {
    const allGoalieSeasons = getGoalieSeasons(15)
    if (allGoalieSeasons.length >= 20) {
      // Reference season: current season or most recent with ≥5 GP
      const refSeason =
        nhlRegular.find(s => s.season === CURRENT_SEASON && (s.gamesPlayed ?? 0) >= 5) ??
        [...nhlRegular].reverse().find(s => (s.gamesPlayed ?? 0) >= 5)

      if (refSeason) {
        refSeasonLabel = formatSeason(refSeason.season)

        // SV% — higher is better; NHL API may return savePctg or savePercentage
        const svp = refSeason.savePercentage ?? refSeason.savePctg ?? null
        if (svp != null) {
          const allSvp = allGoalieSeasons.map(g => (g.ongoal - g.goals) / g.ongoal)
          percentileEntries.push({
            label: 'SV%',
            description: 'Save percentage',
            value: svp.toFixed(3),
            percentile: computePercentile(svp, allSvp),
          })
        }

        // GAA — lower is better, invert percentile
        if (refSeason.goalsAgainstAvg != null) {
          const allGAA = allGoalieSeasons.map(g => (g.goals / g.icetime) * 3600)
          percentileEntries.push({
            label: 'GAA',
            description: 'Goals against average — lower is better',
            value: refSeason.goalsAgainstAvg.toFixed(2),
            percentile: 100 - computePercentile(refSeason.goalsAgainstAvg, allGAA),
          })
        }

        // GSAA from MoneyPuck — higher is better
        const mpGoalieSeasons = goalieHistoricalSeasons(name)
        const mpRef = mpGoalieSeasons.find(s => s.season === refSeason.season) ??
          mpGoalieSeasons[mpGoalieSeasons.length - 1]
        if (mpRef) {
          const allGSAA = allGoalieSeasons.map(g => g.xGoals - g.goals)
          const gsaaVal = mpRef.xGoals - mpRef.goals
          percentileEntries.push({
            label: 'GSAA',
            description: 'Goals saved above average (MoneyPuck)',
            value: gsaaVal.toFixed(1),
            percentile: computePercentile(gsaaVal, allGSAA),
          })
        }
      }
    }
  }

  // ── Historical comps (skaters only) ───────────────────────────────────────
  const historicalComps: HistoricalComp[] = []

  if (!isGoalie) {
    const compRefSeason =
      nhlRegular.find(s => s.season === CURRENT_SEASON && (s.gamesPlayed ?? 0) >= 10) ??
      [...nhlRegular].reverse().find(s => (s.gamesPlayed ?? 0) >= 10)

    if (compRefSeason && compRefSeason.gamesPlayed >= 10) {
      const refPer82 = ((compRefSeason.points ?? 0) / compRefSeason.gamesPlayed) * 82
      const allSkaterSeasons = getSkaterSeasons(50)

      const comps = allSkaterSeasons
        .filter(s => s.name.toLowerCase() !== name.toLowerCase())
        .map(s => ({
          name: s.name,
          season: s.season,
          team: s.team,
          pointsPer82: pointsPer82(s),
          goalsPer82: (s.I_F_goals / s.games_played) * 82,
          delta: Math.abs(pointsPer82(s) - refPer82),
        }))
        .sort((a, b) => a.delta - b.delta)
        .slice(0, 5)

      historicalComps.push(...comps)
    }
  }

  // ── Bio details ───────────────────────────────────────────────────────────
  const careerGoals = nhlRegular.reduce((sum, s) => sum + (s.goals ?? 0), 0)
  const careerPoints = nhlRegular.reduce((sum, s) => sum + (s.points ?? 0), 0)
  const careerGP = nhlRegular.reduce((sum, s) => sum + (s.gamesPlayed ?? 0), 0)

  // Goalie career totals
  const careerWins = isGoalie ? nhlRegular.reduce((sum, s) => sum + (s.wins ?? 0), 0) : 0
  const careerLosses = isGoalie ? nhlRegular.reduce((sum, s) => sum + (s.losses ?? 0), 0) : 0
  const careerSvp = (() => {
    if (!isGoalie) return null
    const seasonsWithSvp = nhlRegular.filter(s => s.savePercentage != null && s.gamesPlayed > 0)
    if (seasonsWithSvp.length === 0) return null
    // Weight by games started (fall back to gamesPlayed)
    const totalGP = seasonsWithSvp.reduce((sum, s) => sum + (s.gamesStarted ?? s.gamesPlayed), 0)
    if (totalGP === 0) return null
    const weighted = seasonsWithSvp.reduce(
      (sum, s) => sum + (s.savePercentage ?? 0) * (s.gamesStarted ?? s.gamesPlayed),
      0
    )
    return weighted / totalGP
  })()

  const compRefSeason = !isGoalie
    ? (nhlRegular.find(s => s.season === CURRENT_SEASON && (s.gamesPlayed ?? 0) >= 10) ??
       [...nhlRegular].reverse().find(s => (s.gamesPlayed ?? 0) >= 10))
    : undefined

  return (
    <>
      {/* Back nav */}
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors mb-6"
      >
        ← Stories
      </Link>

      {/* Hero */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          {/* Headshot */}
          <div className="relative w-24 h-24 rounded-full overflow-hidden bg-[var(--border)] ring-2 ring-[var(--accent-blue)]/30 shrink-0">
            <Image
              src={landing.headshot}
              alt={name}
              fill
              className="object-cover object-top"
              unoptimized
              priority
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">{name}</h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <div className="relative w-6 h-6">
                    <Image
                      src={landing.currentTeamLogo || teamLogoUrl(teamAbbrev)}
                      alt={teamAbbrev}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                  <Link
                    href={`/teams/${teamAbbrev}`}
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors"
                  >
                    {teamAbbrev}
                  </Link>
                  <span className="text-[var(--text-muted)]">·</span>
                  <span className="text-sm text-[var(--text-secondary)]">{landing.position}</span>
                  {landing.sweaterNumber && (
                    <>
                      <span className="text-[var(--text-muted)]">·</span>
                      <span className="text-sm text-[var(--text-secondary)]">#{landing.sweaterNumber}</span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ShareButton />
                <Link
                  href={`/compare?p1=${playerId}`}
                  className="shrink-0 px-4 py-2 rounded-lg bg-[var(--accent-blue-dim)] text-[var(--accent-blue)] text-sm font-medium hover:bg-[var(--accent-blue)] hover:text-white transition-all border border-[var(--accent-blue)]/30"
                >
                  Compare →
                </Link>
              </div>
            </div>

            {/* Quick bio */}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
              {landing.birthDate && (
                <span>Born {new Date(landing.birthDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              )}
              {landing.birthCity?.default && (
                <span>{landing.birthCity.default}{landing.birthCountry ? `, ${landing.birthCountry}` : ''}</span>
              )}
              {landing.heightInInches && (
                <span>{Math.floor(landing.heightInInches / 12)}&apos;{landing.heightInInches % 12}&quot; · {landing.weightInPounds} lbs</span>
              )}
              {landing.draftDetails && (
                <span>
                  {landing.draftDetails.year} Draft · Rd {landing.draftDetails.round}, Pick {landing.draftDetails.overallPick} ({landing.draftDetails.teamAbbrev})
                </span>
              )}
            </div>

            {/* Career totals */}
            <div className="mt-4 flex gap-5 flex-wrap">
              {isGoalie ? [
                { label: 'Career GP', value: careerGP },
                { label: 'Career W', value: careerWins },
                { label: 'Career L', value: careerLosses },
                careerSvp != null && { label: 'Career SV%', value: careerSvp.toFixed(3) },
              ].filter(Boolean).map(item => {
                const { label, value } = item as { label: string; value: string | number }
                return (
                  <div key={label}>
                    <div className="text-xl font-bold tabular-nums text-[var(--text-primary)]">{value}</div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{label}</div>
                  </div>
                )
              }) : [
                { label: 'Career GP', value: careerGP },
                { label: 'Career G', value: careerGoals },
                { label: 'Career PTS', value: careerPoints },
              ].map(item => (
                <div key={item.label}>
                  <div className="text-xl font-bold tabular-nums text-[var(--text-primary)]">{item.value}</div>
                  <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Career arc */}
      {chartData.length >= 2 && (
        <div className="card p-5 mb-6">
          <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Career Arc</h2>
          <Suspense fallback={<div className="h-[200px] skeleton rounded-lg" />}>
            <CareerArcChart data={chartData} isGoalie={isGoalie} />
          </Suspense>
        </div>
      )}

      {/* Season table */}
      <div className="card p-5 mb-6">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Season Log — NHL Regular Season</h2>
        <SeasonTable seasons={nhlRegular} isGoalie={isGoalie} currentSeason={CURRENT_SEASON} />
      </div>

      {/* Two-column: percentiles + comps */}
      <div className="grid gap-6 sm:grid-cols-2">
        {percentileEntries.length > 0 && (
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
              Advanced Percentiles{refSeasonLabel ? ` · ${refSeasonLabel}` : ''}
            </h2>
            <PercentileBars entries={percentileEntries} season={refSeasonLabel ?? formatSeason(CURRENT_SEASON)} />
          </div>
        )}

        {historicalComps.length > 0 && (
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Comparable Seasons</h2>
            <HistoricalComps
              comps={historicalComps}
              playerName={name}
              referencePer82={
                compRefSeason ? ((compRefSeason.points ?? 0) / compRefSeason.gamesPlayed) * 82 : 0
              }
            />
          </div>
        )}
      </div>
    </>
  )
}
