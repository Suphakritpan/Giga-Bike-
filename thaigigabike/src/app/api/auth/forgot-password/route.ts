import { NextRequest } from 'next/server'
import { createHash, randomBytes } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { sendPasswordResetEmail } from '@/lib/email'
import { SITE_URL } from '@/lib/site'
import { apiOk, apiError, ERR, apiLog, isRateLimited, recordAttempt, hashIp, readJson } from '@/lib/api'

const ROUTE        = 'POST /api/auth/forgot-password'
const MAX_ATTEMPTS = 5
const WINDOW_MS    = 15 * 60 * 1000  // 15 min
const TOKEN_TTL_MS = 30 * 60 * 1000  // 30 min

// Always returns { ok: true } — never reveals whether the account exists.
export async function POST(req: NextRequest) {
  const body  = await readJson(req)
  const email = String(body.email ?? '').trim().toLowerCase()
  if (!email) return apiError(ERR.BAD_REQUEST, 'กรุณากรอกอีเมล')

  const ipHash = hashIp(req)

  // Rate-limit reset requests per IP (no enumeration: still return ok)
  if (await isRateLimited({ kind: 'reset', ipHash, max: MAX_ATTEMPTS, windowMs: WINDOW_MS })) {
    apiLog.warn(ROUTE, 'rate limited', { ipHash: ipHash.slice(0, 16) })
    return apiOk({ ok: true })
  }
  await recordAttempt({ kind: 'reset', email, ipHash, success: true })

  const db = createServiceClient()
  const { data: user } = await db.from('users')
    .select('id, status').eq('email', email).single()

  if (user && user.status === 'active') {
    // Invalidate previous unused tokens, then issue a fresh one
    await db.from('password_reset_tokens')
      .delete().eq('user_id', user.id).is('used_at', null)

    const token = randomBytes(32).toString('hex')
    await db.from('password_reset_tokens').insert({
      user_id:    user.id,
      token_hash: createHash('sha256').update(token).digest('hex'),
      expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
    })

    // Fire-and-forget: response identical whether or not the email sends
    sendPasswordResetEmail(email, `${SITE_URL}/reset-password?token=${token}`)
      .catch(err => apiLog.error(ROUTE, err))
  }

  return apiOk({ ok: true })
}
