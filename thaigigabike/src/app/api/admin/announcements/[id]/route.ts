import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createServiceClient } from '@/lib/supabase/service'

const TYPES = ['info', 'promo', 'update', 'shipping']

// PATCH /api/admin/announcements/[id] — edit fields / toggle published / pinned
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* ignore */ }

  const str = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null)
  const patch: Record<string, unknown> = {}
  if (typeof body.title_th === 'string' && body.title_th.trim()) patch.title_th = body.title_th.trim()
  if ('title_en' in body) patch.title_en = str(body.title_en)
  if ('body_th' in body) patch.body_th = str(body.body_th)
  if ('body_en' in body) patch.body_en = str(body.body_en)
  if (typeof body.type === 'string' && TYPES.includes(body.type)) patch.type = body.type
  if (typeof body.published === 'boolean') patch.published = body.published
  if (typeof body.pinned === 'boolean') patch.pinned = body.pinned

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const db = createServiceClient()
  const { error } = await db.from('announcements').update(patch).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// DELETE /api/admin/announcements/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const db = createServiceClient()
  const { error } = await db.from('announcements').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
