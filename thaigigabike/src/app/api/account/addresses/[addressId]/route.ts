import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireUser } from '@/lib/auth/require-user'

export async function PATCH(req: NextRequest, { params }: { params: { addressId: string } }) {
  const { user, error } = await requireUser()
  if (error) return error

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* ignore */ }

  const db = createServiceClient()

  // Set-default: clear others then set this one
  if (body.is_default === true) {
    await db.from('addresses').update({ is_default: false }).eq('user_id', user.id)
  }

  const allowed = ['label', 'recipient_name', 'phone', 'address', 'is_default']
  const patch: Record<string, unknown> = {}
  for (const k of allowed) if (k in body) patch[k] = body[k]
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  // Service role bypasses RLS — the user_id filter IS the ownership check
  const { error: dbErr } = await db.from('addresses').update(patch)
    .eq('id', params.addressId).eq('user_id', user.id)
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { addressId: string } }) {
  const { user, error } = await requireUser()
  if (error) return error
  const db = createServiceClient()
  const { error: dbErr } = await db.from('addresses').delete()
    .eq('id', params.addressId).eq('user_id', user.id)
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
