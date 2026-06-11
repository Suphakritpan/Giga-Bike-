import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { apiLog } from '@/lib/api'
import { SITE_URL } from '@/lib/site'

const ROUTE = 'GET /api/auth/verify-email'

// Clicked from the verification email → marks the email verified and
// redirects back to the account settings page with a status flag.
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') ?? ''
  const fail  = NextResponse.redirect(`${SITE_URL}/account/settings?verified=0`)
  if (!token) return fail

  const db = createServiceClient()
  const tokenHash = createHash('sha256').update(token).digest('hex')

  const { data: row } = await db.from('email_verification_tokens')
    .select('id, user_id, expires_at, used_at')
    .eq('token_hash', tokenHash).single()

  const invalid = !row || row.used_at !== null || new Date(row.expires_at as string) < new Date()
  if (invalid) return fail

  const { error: updErr } = await db.from('users')
    .update({ email_verified_at: new Date().toISOString() })
    .eq('id', row.user_id)
  if (updErr) {
    apiLog.error(ROUTE, updErr.message, { userId: row.user_id })
    return fail
  }

  await db.from('email_verification_tokens')
    .update({ used_at: new Date().toISOString() }).eq('id', row.id)

  apiLog.info(ROUTE, 'email verified', { userId: row.user_id })
  return NextResponse.redirect(`${SITE_URL}/account/settings?verified=1`)
}
