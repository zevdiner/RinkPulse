import { searchLines } from '@/lib/moneypuck'

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get('q') ?? ''
  const results = searchLines(q)
  return Response.json(results)
}
