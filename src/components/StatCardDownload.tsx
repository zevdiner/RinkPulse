'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { Download, Loader2 } from 'lucide-react'
import type { PlayerStats, Timeframe } from '@/types'
import { SKATER_STATS, GOALIE_STATS, formatStat } from '@/lib/utils'

interface Props {
  p1: PlayerStats
  p2: PlayerStats
  timeframe: Timeframe
}

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  season: '2024–25 Season',
  career: 'Career',
  last3: 'Last 3 Seasons',
  playoffs: 'Playoffs',
}

export default function StatCardDownload({ p1, p2, timeframe }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    if (!cardRef.current) return
    setLoading(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: '#0c1428',
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
      })
      const link = document.createElement('a')
      link.download = `rinkpulse-${p1.name.replace(/\s+/g, '-')}-vs-${p2.name.replace(/\s+/g, '-')}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Download failed:', err)
    } finally {
      setLoading(false)
    }
  }

  const statDefs = p1.isGoalie || p2.isGoalie ? GOALIE_STATS : SKATER_STATS
  const topStats = statDefs.slice(0, 6)

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-bright)] hover:bg-white/4 transition-all disabled:opacity-50"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
        Download Card
      </button>

      {/* Off-screen render target */}
      <div className="fixed -left-[9999px] top-0 z-[-1]" aria-hidden="true">
        <div
          ref={cardRef}
          style={{
            width: 600,
            background: 'linear-gradient(135deg, #0c1428 0%, #050918 100%)',
            padding: '28px 28px 20px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            color: '#e8f0ff',
            border: '1px solid #1a2a4a',
            borderRadius: 16,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 22, height: 22, background: '#4a90f7', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <ellipse cx="7" cy="7" rx="6" ry="3.5" stroke="white" strokeWidth="1.5"/>
                  <line x1="1" y1="7" x2="13" y2="7" stroke="white" strokeWidth="1.5"/>
                </svg>
              </div>
              <span style={{ fontWeight: 700, color: '#e8f0ff', fontSize: 14 }}>RinkPulse</span>
            </div>
            <span style={{ fontSize: 11, color: '#4a5f88', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              {TIMEFRAME_LABELS[timeframe]}
            </span>
          </div>

          {/* Players */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            {[p1, p2].map((p, i) => (
              <div key={p.playerId} style={{ display: 'flex', flexDirection: 'column', alignItems: i === 0 ? 'flex-start' : 'flex-end', gap: 6 }}>
                <img
                  src={p.headshot}
                  alt={p.name}
                  width={56}
                  height={56}
                  style={{ borderRadius: '50%', background: '#1a2a4a', objectFit: 'cover', objectPosition: 'top' }}
                  crossOrigin="anonymous"
                />
                <div style={{ textAlign: i === 0 ? 'left' : 'right' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#e8f0ff' }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: '#8ba0c8', marginTop: 2 }}>
                    {p.position} · {p.teamAbbrev}
                  </div>
                </div>
              </div>
            ))}
            <div style={{ textAlign: 'center', fontWeight: 800, color: '#4a5f88', fontSize: 18, letterSpacing: 2 }}>
              VS
            </div>
          </div>

          {/* Stats */}
          <div style={{ borderTop: '1px solid #1a2a4a' }}>
            {topStats.map(stat => {
              const v1 = p1[stat.key] as number | undefined
              const v2 = p2[stat.key] as number | undefined
              const n1 = v1 ?? 0
              const n2 = v2 ?? 0
              const p1Wins = stat.higherIsBetter ? n1 > n2 : n1 < n2
              const p2Wins = stat.higherIsBetter ? n2 > n1 : n2 < n1

              return (
                <div key={stat.key as string} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #0e1c30' }}>
                  <span style={{ fontWeight: 700, fontSize: 16, color: p1Wins ? '#e8f0ff' : '#4a5f88', textAlign: 'left' }}>
                    {formatStat(v1, stat.format)}
                  </span>
                  <span style={{ fontSize: 10, color: '#4a5f88', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {stat.label}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: 16, color: p2Wins ? '#e8f0ff' : '#4a5f88', textAlign: 'right' }}>
                    {formatStat(v2, stat.format)}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div style={{ marginTop: 14, fontSize: 10, color: '#2a3f6a', textAlign: 'center', letterSpacing: '0.05em' }}>
            rinkpulse.vercel.app · NHL data via api-web.nhle.com
          </div>
        </div>
      </div>
    </div>
  )
}
