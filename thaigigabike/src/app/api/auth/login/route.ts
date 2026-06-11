import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import { verifyPassword } from '@/lib/password'
import { createSession, cookieName } from '@/lib/session'
import { apiOk, apiError, ERR, apiLog, isRateLimited, recordAttempt, hashIp, readJson } from '@/lib/api'

const ROUTE        = 'POST /api/auth/login'
const MAX_ATTEMPTS = 10
const WINDOW_MS    = 15 * 60 * 1000  // 15 min

export async function POST(req: NextRequest) {
  const body     = await readJson(req)
  const email    = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')

  if (!email || !password) {
    return apiError(ERR.BAD_REQUEST, 'กรุณากรอกอีเมลและรหัสผ่าน')
  }

  const ipHash = hashIp(req)

  // Rate-limit failed attempts by IP and by email (separately)
  const [byIp, byEmail] = await Promise.all([
    isRateLimited({ kind: 'login', ipHash, max: MAX_ATTEMPTS, windowMs: WINDOW_MS, failuresOnly: true }),
    isRateLimited({ kind: 'login', email, max: MAX_ATTEMPTS, windowMs: WINDOW_MS, failuresOnly: true }),
  ])
  if (byIp || byEmail) {
    apiLog.warn(ROUTE, 'rate limited', { ipHash: ipHash.slice(0, 16) })
    return apiError(ERR.RATE_LIMITED, 'พยายามเข้าสู่ระบบหลายครั้งเกินไป กรุณารอ 15 นาที')
  }

  const db = createServiceClient()
  const { data: user } = await db
    .from('users')
    .select('id, email, password_hash, role, admin_active, status')
    .eq('email', email)
    .single()

  // Always run bcrypt to prevent timing attacks
  const valid = user ? await verifyPassword(password, user.password_hash as string) : false

  await recordAttempt({ kind: 'login', email, ipHash, success: valid && !!user })

  if (!valid || !user) {
    return apiError(ERR.UNAUTHORIZED, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง')
  }

  if ((user.status as string) !== 'active') {
    apiLog.warn(ROUTE, 'suspended account login attempt', { userId: user.id })
    return apiError(ERR.FORBIDDEN, 'บัญชีนี้ถูกระงับการใช้งาน')
  }

  const userAgent = req.headers.get('user-agent')?.slice(0, 200) ?? null

  // Best-effort housekeeping — never blocks the login result
  await Promise.allSettled([
    db.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', user.id),
    db.from('login_events').insert({
      user_id: user.id, ip_hash: ipHash.slice(0, 16), user_agent: userAgent,
    }),
    db.rpc('cleanup_expired_sessions'),
  ])

  const { token, expiresAt } = await createSession(user.id as string, { ipHash, userAgent: userAgent ?? undefined })

  cookies().set(cookieName(), token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    expires:  expiresAt,
  })

  apiLog.info(ROUTE, 'login success', { userId: user.id })
  return apiOk({ user: { id: user.id, email: user.email, role: user.role } })
}
