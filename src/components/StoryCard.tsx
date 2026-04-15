'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Share2, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Story } from '@/types'

interface Props {
  story: Story
}

export default function StoryCard({ story }: Props) {
  const handleShare = async () => {
    const url = `${window.location.origin}/?story=${story.id}`
    if (navigator.share) {
      await navigator.share({ title: story.title, url }).catch(() => {})
    } else {
      await navigator.clipboard.writeText(url).catch(() => {})
    }
  }

  return (
    <article className="card group relative flex flex-col gap-4 p-5 hover:cursor-default">
      {/* Badge */}
      <div className="flex items-center justify-between gap-2">
        <span className={cn('badge text-xs font-semibold tracking-widest px-2.5 py-1 rounded-full', `badge-${story.badgeColor}`)}>
          {story.badge}
        </span>
        <button
          onClick={handleShare}
          aria-label="Share story"
          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/8 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
        >
          <Share2 size={14} />
        </button>
      </div>

      {/* Player/Team identity */}
      {story.playerId ? (
        <Link href={`/players/${story.playerId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <PlayerIdentity story={story} />
        </Link>
      ) : (
        <div className="flex items-center gap-3">
          <PlayerIdentity story={story} />
        </div>
      )}

      {/* Big stat */}
      <div className="flex items-end gap-3">
        <div className="flex flex-col">
          <span className="text-3xl font-bold text-[var(--text-primary)] leading-none tabular-nums">
            {story.statValue}
          </span>
          <span className="text-xs text-[var(--text-muted)] mt-1 uppercase tracking-wider">
            {story.statLabel}
          </span>
        </div>

        {story.percentile !== undefined && (
          <PercentilePill percentile={story.percentile} />
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-[var(--text-secondary)] leading-relaxed line-clamp-3">
        {story.description}
      </p>

      {/* Historical context */}
      <div className="flex items-start gap-2 rounded-lg bg-white/3 border border-[var(--border)] px-3 py-2.5 mt-auto">
        <TrendingUp size={13} className="shrink-0 mt-0.5 text-[var(--accent-blue)]" />
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          {story.historicalContext}
        </p>
      </div>
    </article>
  )
}

function PlayerIdentity({ story }: { story: Story }) {
  return (
    <>
      {story.playerHeadshot ? (
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-[var(--border)] shrink-0">
          <Image
            src={story.playerHeadshot}
            alt={story.playerName ?? ''}
            fill
            className="object-cover object-top"
            unoptimized
          />
        </div>
      ) : story.teamLogo ? (
        <div className="relative w-10 h-10 shrink-0">
          <Image
            src={story.teamLogo}
            alt={story.teamAbbrev ?? ''}
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      ) : null}
      <div className="min-w-0">
        <h2 className="font-semibold text-[var(--text-primary)] leading-snug truncate">
          {story.title}
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5 truncate">{story.subtitle}</p>
      </div>
    </>
  )
}

function PercentilePill({ percentile }: { percentile: number }) {
  const color =
    percentile >= 97 ? 'text-amber-400' :
    percentile >= 90 ? 'text-[var(--accent-blue)]' :
    'text-green-400'

  return (
    <div className={cn('flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 bg-white/5 border border-white/10', color)}>
      <span>{percentile}th %ile</span>
    </div>
  )
}
