import { createHash } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

/**
 * DB-backed rate limiting (login_attempts table).
 *
 * Works across serverless instances — in-memory counters reset on every
 * cold start on Netlify, so the source of truth lives in Postgres.
 *
 * kind values in use: 'login' | 'register' | 'reset'
 * (extend freely — the column is plain TEXT).
 */

export function hashIp(req: NextRequest): string {
  const raw = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || 'unknown'
  return createHash('sha256').update(raw).digest('hex')
}

type LimitQuery = {
  kind: string
  max: number
  windowMs: number
  /** Match attempts by hashed IP. */
  ipHash?: string
  /** Match attempts by email. */
  email?: string
  /** Count only failures (login) or every attempt (register/reset). */
  failuresOnly?: boolean
}

/** Returns true when the caller is over the limit and must be rejected. */
export async function isRateLimited(q: LimitQuery): Promise<boolean> {
  const db    = createServiceClient()
  const since = new Date(Date.now() - q.windowMs).toISOString()

  let query = db.from('login_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('kind', q.kind)
    .gte('created_at', since)
  if (q.ipHash)       query = query.eq('ip_hash', q.ipHash)
  if (q.email)        query = query.eq('email', q.email)
  if (q.failuresOnly) query = query.eq('success', false)

  const { count } = await query
  return (count ?? 0) >= q.max
}

/** Record an attempt so future isRateLimited() calls see it. */
export async function recordAttempt(p: {
  kind: string
  email: string
  ipHash: string
  success: boolean
}): Promise<void> {
  const db = createServiceClient()
  await db.from('login_attempts')
    .insert({ kind: p.kind, email: p.email, ip_hash: p.ipHash, success: p.success })
    .then(() => {}, () => {}) // best-effort
}
