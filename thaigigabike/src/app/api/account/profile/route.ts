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

  const allowed = ['full_name', 'phone', 'avatar_url', 'locale', 'notify_order', 'notify_promo', 'notify_reply']
  const patch: Record<string, unknown> = {}
  for (const k of allowed) if (k in body) patch[k] = body[k]
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const db = createServiceClient()
  const { error: dbErr } = await db.from('profiles').upsert({ id: user.id, ...patch }, { onConflict: 'id' })
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  // Keep users table mirror fields in sync (used by /api/auth/me)
  const mirror: Record<string, unknown> = {}
  if ('full_name' in patch) mirror.full_name = patch.full_name
  if ('phone'     in patch) mirror.phone     = patch.phone
  if (Object.keys(mirror).length > 0) {
    await db.from('users').update(mirror).eq('id', user.id)
  }
  return NextResponse.json({ ok: true })
}
