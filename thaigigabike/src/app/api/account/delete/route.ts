import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import { requireUser } from '@/lib/auth/require-user'
import { verifyPassword } from '@/lib/password'
import { cookieName } from '@/lib/session'

// Permanently delete the account. Requires password re-confirmation.
export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* ignore */ }
  const password = String(body.password ?? '')

  if (!password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 })
  }

  const svc = createServiceClient()

  // Re-authenticate against the stored hash before the destructive action
  const { data: row } = await svc.from('users')
    .select('password_hash').eq('id', user.id).single()
  const ok = row ? await verifyPassword(password, row.password_hash as string) : false
  if (!ok) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  // Delete the user row — cascades to sessions/profiles/addresses/wishlists
  // via FK. Orders/reviews/tickets keep rows with user_id set NULL
  // (order history preserved for the shop).
  const { error: delErr } = await svc.from('users').delete().eq('id', user.id)
  if (delErr) return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })

  cookies().delete(cookieName())
  return NextResponse.json({ ok: true })
}
