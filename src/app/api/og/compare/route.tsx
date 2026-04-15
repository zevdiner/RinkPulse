import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { getPlayerLanding, playerDisplayName, playerHeadshotUrl, teamLogoUrl } from '@/lib/nhl-api'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const p1 = Number(searchParams.get('p1'))
  const p2 = Number(searchParams.get('p2'))

  // Fallback image when params are missing
  if (!p1 || !p2) {
    return new ImageResponse(
      <FallbackImage />,
      { width: 1200, height: 630 }
    )
  }

  const [l1, l2] = await Promise.all([
    getPlayerLanding(p1).catch(() => null),
    getPlayerLanding(p2).catch(() => null),
  ])

  const name1 = l1 ? playerDisplayName(l1) : 'Player 1'
  const name2 = l2 ? playerDisplayName(l2) : 'Player 2'
  const headshot1 = l1?.headshot ?? playerHeadshotUrl(p1)
  const headshot2 = l2?.headshot ?? playerHeadshotUrl(p2)
  const team1 = l1?.currentTeamAbbrev ?? ''
  const team2 = l2?.currentTeamAbbrev ?? ''
  const pos1 = l1?.position ?? ''
  const pos2 = l2?.position ?? ''

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#05091a',
        fontFamily: 'sans-serif',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div style={{
        position: 'absolute',
        top: -100,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 800,
        height: 400,
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(74,144,247,0.12) 0%, transparent 70%)',
      }} />

      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '32px 56px 0',
        color: '#4a90f7',
        fontSize: 18,
        fontWeight: 700,
        letterSpacing: 3,
      }}>
        RINKPULSE
      </div>

      {/* Main comparison */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        gap: 0,
        padding: '0 56px',
      }}>
        {/* Player 1 */}
        <PlayerCard name={name1} headshot={headshot1} team={team1} position={pos1} accent="#4a90f7" />

        {/* VS divider */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
          padding: '0 48px',
        }}>
          <div style={{ color: '#1a2a4a', fontSize: 48, fontWeight: 900, letterSpacing: 4 }}>VS</div>
          <div style={{
            fontSize: 13,
            color: '#4a5f88',
            letterSpacing: 2,
            textTransform: 'uppercase',
          }}>
            Player Comparison
          </div>
        </div>

        {/* Player 2 */}
        <PlayerCard name={name2} headshot={headshot2} team={team2} position={pos2} accent="#ef4444" />
      </div>

      {/* Bottom bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 56px 32px',
        color: '#4a5f88',
        fontSize: 14,
      }}>
        rinkpulse.vercel.app/compare
      </div>
    </div>,
    { width: 1200, height: 630 }
  )
}

function PlayerCard({
  name, headshot, team, position, accent,
}: {
  name: string
  headshot: string
  team: string
  position: string
  accent: string
}) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 16,
      flex: 1,
    }}>
      {/* Headshot */}
      <div style={{
        width: 140,
        height: 140,
        borderRadius: '50%',
        overflow: 'hidden',
        border: `3px solid ${accent}66`,
        background: '#0c1428',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={headshot} alt={name} width={140} height={140} style={{ objectFit: 'cover', objectPosition: 'top' }} />
      </div>

      {/* Name */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#e8f0ff', textAlign: 'center' }}>{name}</div>
        <div style={{ fontSize: 14, color: '#4a5f88' }}>
          {position}{team ? ` · ${team}` : ''}
        </div>
      </div>
    </div>
  )
}

function FallbackImage() {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#05091a',
      color: '#4a90f7',
      fontSize: 32,
      fontWeight: 700,
      fontFamily: 'sans-serif',
      letterSpacing: 4,
    }}>
      RINKPULSE
      <div style={{ fontSize: 16, color: '#4a5f88', marginTop: 12, letterSpacing: 2 }}>
        NHL STAT STORIES & PLAYER COMPARISON
      </div>
    </div>
  )
}
