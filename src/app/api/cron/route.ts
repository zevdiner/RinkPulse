import { revalidateTag } from 'next/cache'
import type { NextRequest } from 'next/server'

/**
 * Daily cron endpoint — busts the 'daily-stories' cache so the next
 * page load regenerates stories from live NHL API + MoneyPuck data.
 *
 * Called by Vercel Cron (see vercel.json) at 08:00 UTC daily.
 * Protected by CRON_SECRET env var.
 */
export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization')?.replace('Bearer ', '')
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  revalidateTag('daily-stories', { expire: 0 })
  return Response.json({ ok: true, revalidated: true, timestamp: new Date().toISOString() })
}
