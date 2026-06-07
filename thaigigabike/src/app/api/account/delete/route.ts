import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireUser } from '@/lib/auth/require-user'

// Permanently delete the account. Requires password re-confirmation.
export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* ignore */ }
  const password = String(body.password ?? '')

  if (!user.email || !password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 })
  }

  // Re-authenticate to confirm identity before destructive action
  const db = createClient()
  const { error: signInErr } = await db.auth.signInWithPassword({ email: user.email, password })
  if (signInErr) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  }

  // Delete auth user (cascades to profiles/addresses/wishlists/tickets via FK).
  // Orders/reviews keep rows with user_id set NULL (order history preserved for the shop).
  const svc = createServiceClient()
  const { error: delErr } = await svc.auth.admin.deleteUser(user.id)
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  await db.auth.signOut()
  return NextResponse.json({ ok: true })
}
