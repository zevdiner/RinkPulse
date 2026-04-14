import { NextRequest } from 'next/server'
import { searchPlayers } from '@/lib/nhl-api'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''
  const results = await searchPlayers(q)
  return Response.json(results)
}
