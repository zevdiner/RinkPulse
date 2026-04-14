import type { NextRequest } from 'next/server'
import { getPlayerGameLog } from '@/lib/nhl-api'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const playerId = Number(id)
  if (isNaN(playerId)) return Response.json({ error: 'Invalid player ID' }, { status: 400 })

  const games = await getPlayerGameLog(playerId)
  return Response.json(games)
}
