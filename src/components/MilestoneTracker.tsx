import Image from 'next/image'
import Link from 'next/link'
import { getMilestoneAlerts } from '@/lib/milestone-tracker'
import type { MilestoneAlert } from '@/lib/milestone-tracker'

export default async function MilestoneTracker() {
  const alerts = await getMilestoneAlerts()
  if (alerts.length === 0) return null

  return (
    <section className="mt-10">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Milestone Watch</h2>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
          Players within 30 of a career milestone
        </p>
      </div>

      {/* Horizontal scroll row */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
        {alerts.map(alert => (
          <MilestoneCard key={`${alert.playerId}-${alert.target}`} alert={alert} />
        ))}
      </div>
    </section>
  )
}

function MilestoneCard({ alert }: { alert: MilestoneAlert }) {
  const progress = Math.round((alert.current / alert.target) * 100)

  return (
    <Link
      href={`/players/${alert.playerId}`}
      className="card flex flex-col gap-3 p-4 hover:border-[var(--border-bright)] hover:bg-[var(--bg-card-hover)] transition-all shrink-0 w-52"
    >
      {/* Player identity */}
      <div className="flex items-center gap-3">
        <div className="relative w-10 h-10 rounded-full overflow-hidden bg-[var(--border)] shrink-0">
          <Image
            src={alert.headshot}
            alt={alert.playerName}
            fill
            className="object-cover object-top"
            unoptimized
          />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
            {alert.playerName}
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">{alert.teamAbbrev}</div>
        </div>
      </div>

      {/* Milestone label */}
      <div>
        <div className="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mb-1">
          {alert.stat === 'goals' ? '🎯 Goals' : '🏒 Points'} milestone
        </div>
        <div className="text-xs text-[var(--text-secondary)] leading-snug">{alert.targetLabel}</div>
      </div>

      {/* Progress */}
      <div>
        <div className="flex justify-between text-[10px] text-[var(--text-muted)] mb-1">
          <span>{alert.current.toLocaleString()} / {alert.target.toLocaleString()}</span>
          <span className="font-semibold text-amber-400">{alert.remaining} away</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/8 overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-400 transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
    </Link>
  )
}
