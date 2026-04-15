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
    }))

  // ── MoneyPuck percentiles (skaters only) ──────────────────────────────────
  const percentileEntries: PercentileEntry[] = []

  if (!isGoalie) {
    const allSeasons = getSkaterSeasons(50)
    // Guard: if CSV data isn't loaded (Vercel cold boot edge case), skip percentiles
    // rather than showing everyone at 50th percentile
    const mpSeasons = allSeasons.length >= 100 ? skaterHistoricalSeasons(name) : []
    const currentSeason = allSeasons.length >= 100
      ? nhlRegular.find(s => s.season === CURRENT_SEASON)
      : undefined
    const mpCurrent = mpSeasons.find(s => s.season === CURRENT_SEASON) ??
      mpSeasons[mpSeasons.length - 1]

    if (currentSeason && currentSeason.gamesPlayed >= 10) {
      const gp = currentSeason.gamesPlayed

      const allPts82 = allSeasons.map(s => pointsPer82(s))
      const pts82 = ((currentSeason.points ?? 0) / gp) * 82
      percentileEntries.push({
        label: 'Pts/82',
        description: 'Points per 82 games pace',
        value: pts82.toFixed(1),
        percentile: computePercentile(pts82, allPts82),
      })

      const allG82 = allSeasons.map(s => (s.I_F_goals / s.games_played) * 82)
      const g82 = ((currentSeason.goals ?? 0) / gp) * 82
      percentileEntries.push({
        label: 'G/82',
        description: 'Goals per 82 games pace',
        value: g82.toFixed(1),
        percentile: computePercentile(g82, allG82),
      })

      if (mpCurrent) {
        const allXG82 = allSeasons.map(s => (s.I_F_xGoals / s.games_played) * 82)
        const xg82 = (mpCurrent.I_F_xGoals / mpCurrent.games_played) * 82
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
          value: `${(mpCurrent.onIce_corsiPercentage * 100).toFixed(1)}%`,
          percentile: computePercentile(mpCurrent.onIce_corsiPercentage, allCF),
        })

        const allGS = allSeasons.map(s => s.gameScore)
        percentileEntries.push({
          label: 'Game Score',
          description: 'MoneyPuck composite performance metric',
          value: mpCurrent.gameScore.toFixed(2),
          percentile: computePercentile(mpCurrent.gameScore, allGS),
        })
      }
    }
  }

  // ── Historical comps (skaters only) ───────────────────────────────────────
  const historicalComps: HistoricalComp[] = []

  if (!isGoalie) {
    const currentSeason = nhlRegular.find(s => s.season === CURRENT_SEASON)
    if (currentSeason && currentSeason.gamesPlayed >= 20) {
      const refPer82 = ((currentSeason.points ?? 0) / currentSeason.gamesPlayed) * 82
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
                  <span className="text-sm text-[var(--text-secondary)]">{teamAbbrev}</span>
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
              {[
                { label: 'Career GP', value: careerGP },
                !isGoalie && { label: 'Career G', value: careerGoals },
                !isGoalie && { label: 'Career PTS', value: careerPoints },
              ].filter(Boolean).map(item => {
                const { label, value } = item as { label: string; value: number }
                return (
                  <div key={label}>
                    <div className="text-xl font-bold tabular-nums text-[var(--text-primary)]">{value}</div>
                    <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">{label}</div>
                  </div>
                )
              })}
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
              Advanced Percentiles · {formatSeason(CURRENT_SEASON)}
            </h2>
            <PercentileBars entries={percentileEntries} season={formatSeason(CURRENT_SEASON)} />
          </div>
        )}

        {historicalComps.length > 0 && (
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Comparable Seasons</h2>
            <HistoricalComps
              comps={historicalComps}
              playerName={name}
              referencePer82={
                (() => {
                  const cur = nhlRegular.find(s => s.season === CURRENT_SEASON)
                  return cur ? ((cur.points ?? 0) / cur.gamesPlayed) * 82 : 0
                })()
              }
            />
          </div>
        )}
      </div>
    </>
  )
}
