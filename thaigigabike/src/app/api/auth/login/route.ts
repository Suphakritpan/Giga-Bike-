import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import { verifyPassword } from '@/lib/password'
import { createSession, cookieName } from '@/lib/session'

const MAX_ATTEMPTS = 10
const WINDOW_MS    = 15 * 60 * 1000  // 15 min

export async function POST(req: NextRequest) {
  const body     = await req.json()
  const email    = (body.email    || '').trim().toLowerCase()
  const password = (body.password || '')

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  }

  const db     = createServiceClient()
  const ipRaw  = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const ipHash = createHash('sha256').update(ipRaw).digest('hex')
  const since  = new Date(Date.now() - WINDOW_MS).toISOString()

  // Rate-limit by IP
  const { count: ipCount } = await db
    .from('login_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .eq('success', false)
    .gte('created_at', since)

  if ((ipCount ?? 0) >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 })
  }

  // Rate-limit by email
  const { count: emailCount } = await db
    .from('login_attempts')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .eq('success', false)
    .gte('created_at', since)

  if ((emailCount ?? 0) >= MAX_ATTEMPTS) {
    return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 })
  }

  // Fetch user
  const { data: user } = await db
    .from('users')
    .select('id, email, password_hash, role, admin_active, status')
    .eq('email', email)
    .single()

  // Always run bcrypt to prevent timing attacks
  const valid = user ? await verifyPassword(password, user.password_hash as string) : false

  // Log attempt
  await db.from('login_attempts').insert({ email, ip_hash: ipHash, success: valid && !!user })

  if (!valid || !user) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  if ((user.status as string) !== 'active') {
    return NextResponse.json({ error: 'Account suspended' }, { status: 403 })
  }

  // Update last login (fire-and-forget)
  db.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', user.id)

  const { token, expiresAt } = await createSession(user.id as string, { ipHash })

  cookies().set(cookieName(), token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    expires:  expiresAt,
  })

  return NextResponse.json({
    user: { id: user.id, email: user.email, role: user.role },
  })
}
