import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/require-user'

export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error
  const db = createClient()
  const { data } = await db.from('profiles').select('*').eq('id', user.id).single()
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

  const db = createClient()
  const { error: dbErr } = await db.from('profiles').update(patch).eq('id', user.id)
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
