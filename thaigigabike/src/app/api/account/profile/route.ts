import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireUser } from '@/lib/auth/require-user'

export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error
  const db = createServiceClient()
  let { data } = await db.from('profiles').select('*').eq('id', user.id).single()
  // Self-heal: create the profile row on first access (e.g. accounts
  // registered before profile auto-creation was added).
  if (!data) {
    const { data: created } = await db.from('profiles')
      .upsert({ id: user.id, full_name: user.full_name, phone: user.phone }, { onConflict: 'id' })
      .select().single()
    data = created
  }
  return NextResponse.json({ profile: data, email: user.email })
}

export async function PATCH(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* ignore */ }

  // profiles-table columns
  const allowed = ['full_name', 'phone', 'avatar_url', 'locale', 'notify_order', 'notify_promo', 'notify_reply']
  const patch: Record<string, unknown> = {}
  for (const k of allowed) if (k in body) patch[k] = body[k]

  // users-table mirror fields (read back via /api/auth/me)
  const mirror: Record<string, unknown> = {}
  if ('full_name' in patch) mirror.full_name = patch.full_name
  if ('phone'     in patch) mirror.phone     = patch.phone
  // line_id lives only on the users table (not in profiles)
  if ('line_id' in body) {
    mirror.line_id = String(body.line_id ?? '').trim().slice(0, 100) || null
  }

  if (Object.keys(patch).length === 0 && Object.keys(mirror).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const db = createServiceClient()
  if (Object.keys(patch).length > 0) {
    const { error: dbErr } = await db.from('profiles').upsert({ id: user.id, ...patch }, { onConflict: 'id' })
    if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }
  if (Object.keys(mirror).length > 0) {
    const { error: mErr } = await db.from('users').update(mirror).eq('id', user.id)
    if (mErr) return NextResponse.json({ error: mErr.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
