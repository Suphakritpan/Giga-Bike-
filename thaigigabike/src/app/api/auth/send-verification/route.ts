import { NextRequest } from 'next/server'
import { createHash, randomBytes } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { requireUser } from '@/lib/auth'
import { sendVerifyEmail } from '@/lib/email'
import { SITE_URL } from '@/lib/site'
import { apiOk, apiError, ERR, apiLog, isRateLimited, recordAttempt, hashIp } from '@/lib/api'

const ROUTE        = 'POST /api/auth/send-verification'
const MAX_SENDS    = 3
const WINDOW_MS    = 15 * 60 * 1000       // 15 min
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000  // 24 h

// (Re)send the email-verification link for the logged-in user.
export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  if (user.email_verified_at) {
    return apiOk({ ok: true, already_verified: true })
  }

  const ipHash = hashIp(req)
  if (await isRateLimited({ kind: 'verify', email: user.email, max: MAX_SENDS, windowMs: WINDOW_MS })) {
    return apiError(ERR.RATE_LIMITED, 'ส่งลิงก์บ่อยเกินไป กรุณารอ 15 นาที')
  }
  await recordAttempt({ kind: 'verify', email: user.email, ipHash, success: true })

  const db = createServiceClient()
  await db.from('email_verification_tokens')
    .delete().eq('user_id', user.id).is('used_at', null)

  const token = randomBytes(32).toString('hex')
  const { error: insErr } = await db.from('email_verification_tokens').insert({
    user_id:    user.id,
    token_hash: createHash('sha256').update(token).digest('hex'),
    expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
  })
  if (insErr) {
    // Table missing = phase3 migration not applied yet
    apiLog.error(ROUTE, insErr.message, { userId: user.id })
    return apiError(ERR.INTERNAL, 'ระบบยืนยันอีเมลยังไม่พร้อมใช้งาน')
  }

  sendVerifyEmail(user.email, `${SITE_URL}/api/auth/verify-email?token=${token}`)
    .catch(err => apiLog.error(ROUTE, err))

  return apiOk({ ok: true })
}
