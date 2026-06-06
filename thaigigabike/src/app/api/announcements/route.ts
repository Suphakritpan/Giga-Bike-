import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/announcements — public, reads from Supabase anon client
export async function GET() {
  const db = createClient()
  const { data, error } = await db
    .from('announcements')
    .select('id, title_th, title_en, body_th, body_en, type, pinned, created_at')
    .eq('published', true)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    // Table may not exist yet — return empty gracefully
    return NextResponse.json({ announcements: [] })
  }
  return NextResponse.json({ announcements: data ?? [] })
}
