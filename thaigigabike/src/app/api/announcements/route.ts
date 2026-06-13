import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/announcements — public, reads from Supabase anon client
export async function GET() {
  const db = createClient()
  // select('*') (not explicit columns) so this keeps working before the
  // scheduling/image/CTA migration is applied — missing columns are just absent.
  const { data, error } = await db
    .from('announcements')
    .select('*')
    .eq('published', true)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(40)

  if (error) {
    // Table may not exist yet — return empty gracefully
    return NextResponse.json({ announcements: [] })
  }

  // Scheduling done in JS (works whether or not starts_at/ends_at exist):
  // show only entries whose window is currently open.
  const now = Date.now()
  const live = (data ?? []).filter((a) => {
    const r = a as { starts_at?: string | null; ends_at?: string | null }
    const startsOk = !r.starts_at || new Date(r.starts_at).getTime() <= now
    const endsOk = !r.ends_at || new Date(r.ends_at).getTime() >= now
    return startsOk && endsOk
  }).slice(0, 20)

  // CDN cache: 60s fresh, serve stale for 5 min while revalidating
  return NextResponse.json(
    { announcements: live },
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
  )
}
