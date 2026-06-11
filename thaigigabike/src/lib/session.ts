import { createHash, randomBytes } from 'node:crypto'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import type { CustomUser } from '@/types/user'

export function cookieName(): string {
  return process.env.CUSTOM_AUTH_SESSION_COOKIE || 'tgb_session'
}

function sessionDays(): number {
  return parseInt(process.env.CUSTOM_AUTH_SESSION_DAYS || '14', 10)
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function createSession(
  userId: string,
  meta?: { ipHash?: string; userAgent?: string }
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + sessionDays() * 86_400_000)
  const db = createServiceClient()
  await db.from('user_sessions').insert({
    user_id: userId,
    session_token_hash: hashToken(token),
    expires_at: expiresAt.toISOString(),
    ip_hash: meta?.ipHash ?? null,
    user_agent: meta?.userAgent?.slice(0, 200) ?? null,
  })
  return { token, expiresAt }
}

export async function getSessionUser(token: string): Promise<CustomUser | null> {
  const db = createServiceClient()
  // select(*) keeps this resilient to columns added by later migrations
  // (e.g. email_verified_at). NEVER return `u` directly — map explicit
  // fields only, password_hash must not escape this function.
  const { data } = await db
    .from('user_sessions')
    .select('users!inner(*)')
    .eq('session_token_hash', hashToken(token))
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!data?.users) return null
  const u = data.users as unknown as Record<string, unknown>
  return {
    id:                u.id as string,
    email:             u.email as string,
    full_name:         u.full_name as string | null,
    phone:             u.phone as string | null,
    line_id:           u.line_id as string | null,
    role:              u.role as CustomUser['role'],
    admin_active:      u.admin_active as boolean,
    status:            u.status as CustomUser['status'],
    email_verified_at: (u.email_verified_at as string | null) ?? null,
  }
}

export async function deleteSession(token: string): Promise<void> {
  const db = createServiceClient()
  await db.from('user_sessions').delete().eq('session_token_hash', hashToken(token))
}

export function getTokenFromCookie(): string | undefined {
  return cookies().get(cookieName())?.value
}
