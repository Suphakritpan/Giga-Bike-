import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/service'
import { hashPassword } from '@/lib/password'
import { createSession, cookieName } from '@/lib/session'
import { issueVerificationEmail } from '@/lib/verification'
import { apiOk, apiError, ERR, apiLog, isRateLimited, recordAttempt, hashIp, readJson } from '@/lib/api'

const ROUTE         = 'POST /api/auth/register'
const MAX_REGISTERS = 5
const WINDOW_MS     = 60 * 60 * 1000  // 1 hour
const EMAIL_RE      = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  const body     = await readJson(req)
  const email    = String(body.email ?? '').trim().toLowerCase()
  const password = String(body.password ?? '')
  const fullName = String(body.full_name ?? body.fullName ?? '').trim() || null
  // SECURITY: role / admin_active / status are never read from the client.

  if (!email || !password) {
    return apiError(ERR.BAD_REQUEST, 'กรุณากรอกอีเมลและรหัสผ่าน')
  }
  if (!EMAIL_RE.test(email)) {
    return apiError(ERR.BAD_REQUEST, 'รูปแบบอีเมลไม่ถูกต้อง')
  }
  if (password.length < 8) {
    return apiError(ERR.BAD_REQUEST, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
  }

  const ipHash = hashIp(req)

  // Spam-account guard: limit registrations per IP
  if (await isRateLimited({ kind: 'register', ipHash, max: MAX_REGISTERS, windowMs: WINDOW_MS })) {
    apiLog.warn(ROUTE, 'rate limited', { ipHash: ipHash.slice(0, 16) })
    return apiError(ERR.RATE_LIMITED, 'สมัครสมาชิกหลายครั้งเกินไป กรุณาลองใหม่ภายหลัง')
  }
  await recordAttempt({ kind: 'register', email, ipHash, success: true })

  const password_hash = await hashPassword(password)
  const db = createServiceClient()

  // Insert directly — the UNIQUE(email) constraint handles the duplicate race.
  const { data: newUser, error: insertError } = await db
    .from('users')
    .insert({ email, password_hash, full_name: fullName, role: 'customer', status: 'active', admin_active: false })
    .select('id, email, full_name')
    .single()

  if (insertError || !newUser) {
    if (insertError?.code === '23505') {
      return apiError(ERR.CONFLICT, 'อีเมลนี้ถูกใช้สมัครแล้ว — ลองเข้าสู่ระบบแทน')
    }
    apiLog.error(ROUTE, insertError?.message ?? 'insert returned no user')
    return apiError(ERR.INTERNAL, 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่')
  }

  // Create the profile row up-front so the account section works immediately
  await db.from('profiles')
    .upsert({ id: newUser.id, full_name: fullName }, { onConflict: 'id' })
    .then(() => {}, () => {})

  // Verification link — email-matched guest orders stay hidden until clicked
  issueVerificationEmail(newUser.id as string, email).catch(() => {})

  const { token, expiresAt } = await createSession(newUser.id as string, {
    ipHash,
    userAgent: req.headers.get('user-agent')?.slice(0, 200) ?? undefined,
  })

  cookies().set(cookieName(), token, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path:     '/',
    expires:  expiresAt,
  })

  apiLog.info(ROUTE, 'register success', { userId: newUser.id })
  return apiOk(
    { user: { id: newUser.id, email: newUser.email, full_name: newUser.full_name } },
    { status: 201 }
  )
}
