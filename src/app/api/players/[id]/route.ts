import type { NextRequest } from 'next/server'
import { getPlayerLanding } from '@/lib/nhl-api'
import { getPlayerStatsByTimeframe } from '@/lib/player-stats'
import type { Timeframe } from '@/types'

export async function GET(request: NextRequest, ctx: RouteContext<'/api/players/[id]'>) {
  const { id } = await ctx.params
  const playerId = Number(id)
  if (isNaN(playerId)) return Response.json({ error: 'Invalid player ID' }, { status: 400 })

  const timeframe = (request.nextUrl.searchParams.get('timeframe') ?? 'season') as Timeframe

  const landing = await getPlayerLanding(playerId)
  if (!landing) return Response.json({ error: 'Player not found' }, { status: 404 })

  const stats = getPlayerStatsByTimeframe(landing, timeframe)
  return Response.json(stats)
}
