import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createServiceClient } from '@/lib/supabase/service'

const TYPES = ['info', 'promo', 'update', 'shipping']

// GET /api/admin/announcements — all entries (incl. unpublished) for the admin tab
export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const db = createServiceClient()
  const { data, error } = await db
    .from('announcements')
    .select('*')
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ announcements: data ?? [] })
}

// POST /api/admin/announcements — create
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* ignore */ }

  const title_th = typeof body.title_th === 'string' ? body.title_th.trim() : ''
  if (!title_th) return NextResponse.json({ error: 'ต้องมีหัวข้อ (ไทย)' }, { status: 400 })

  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)
  const dt = (v: unknown) => {
    if (typeof v !== 'string' || !v.trim()) return null
    const d = new Date(v)
    return isNaN(d.getTime()) ? null : d.toISOString()
  }
  const row = {
    title_th,
    title_en: str(body.title_en),
    body_th: str(body.body_th),
    body_en: str(body.body_en),
    type: typeof body.type === 'string' && TYPES.includes(body.type) ? body.type : 'info',
    published: body.published !== false,
    pinned: body.pinned === true,
    starts_at: dt(body.starts_at),
    ends_at: dt(body.ends_at),
    image_url: str(body.image_url),
    link_url: str(body.link_url),
    link_label: str(body.link_label),
  }

  const db = createServiceClient()
  const { data, error } = await db.from('announcements').insert(row).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ announcement: data })
}
