import { NextRequest, NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { apiLog, isRateLimited, recordAttempt, hashIp, readJson } from '@/lib/api'

const ROUTE        = 'POST /api/admin/setup-owner'
const MAX_ATTEMPTS = 5
const WINDOW_MS    = 60 * 60 * 1000 // 1 hour

function secretMatches(given: string, expected: string): boolean {
  // Hash both sides so lengths are equal — timingSafeEqual requires it
  const a = createHash('sha256').update(given).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}

/**
 * One-time bootstrap: elevates an existing user to owner.
 *
 * Defense in depth — this endpoint is the keys to the admin panel:
 *  1. Disabled when ADMIN_SETUP_SECRET is unset or still the default.
 *  2. In production additionally requires ALLOW_ADMIN_SETUP=true
 *     (set it only for the bootstrap deploy, then remove it).
 *  3. Permanently disabled (410) once any owner exists.
 *  4. Rate-limited per IP; every attempt is logged.
 *  5. Secret compared timing-safe.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_SETUP_SECRET
  if (!secret || secret === 'change-me-in-local-env') {
    return NextResponse.json({ error: 'Setup disabled' }, { status: 403 })
  }
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_ADMIN_SETUP !== 'true') {
    apiLog.warn(ROUTE, 'attempt while ALLOW_ADMIN_SETUP is not enabled')
    return NextResponse.json({ error: 'Setup disabled' }, { status: 403 })
  }

  const db = createServiceClient()

  // Once an owner exists this endpoint is dead — role changes go through
  // PATCH /api/admin/users/[id]/role (owner-only, audited).
  const { data: existingOwner } = await db.from('users')
    .select('id').eq('role', 'owner').limit(1).maybeSingle()
  if (existingOwner) {
    apiLog.warn(ROUTE, 'attempt after owner already exists')
    return NextResponse.json({ error: 'Setup already completed' }, { status: 410 })
  }

  const ipHash = hashIp(req)
  if (await isRateLimited({ kind: 'setup', ipHash, max: MAX_ATTEMPTS, windowMs: WINDOW_MS })) {
    apiLog.warn(ROUTE, 'rate limited', { ipHash: ipHash.slice(0, 16) })
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
  }

  const body = await readJson(req)
  const validSecret = typeof body.secret === 'string' && secretMatches(body.secret, secret)
  await recordAttempt({ kind: 'setup', email: String(body.email ?? ''), ipHash, success: validSecret })

  if (!validSecret) {
    apiLog.warn(ROUTE, 'invalid secret', { ipHash: ipHash.slice(0, 16) })
    return NextResponse.json({ error: 'Invalid secret' }, { status: 403 })
  }

  const email = String(body.email ?? '').trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const { data, error } = await db
    .from('users')
    .update({ role: 'owner', admin_active: true })
    .eq('email', email)
    .select('id, email, role')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  apiLog.info(ROUTE, 'owner bootstrapped', { userId: data.id })
  return NextResponse.json({ ok: true, user: { id: data.id, email: data.email, role: data.role } })
}
