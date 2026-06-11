import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import { requireUser } from '@/lib/auth'
import { cookieName } from '@/lib/session'

// Log out from all devices — deletes every session for this user.
export async function POST() {
  const { user, error } = await requireUser()
  if (error) return error

  const db = createServiceClient()
  await db.from('user_sessions').delete().eq('user_id', user.id)

  cookies().delete(cookieName())
  return NextResponse.json({ ok: true })
}
