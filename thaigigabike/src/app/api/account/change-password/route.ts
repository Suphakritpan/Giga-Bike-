import { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireUser } from '@/lib/auth'
import { verifyPassword, hashPassword } from '@/lib/password'
import { hashToken, getTokenFromCookie } from '@/lib/session'
import { apiOk, apiError, ERR, apiLog, isRateLimited, recordAttempt, hashIp, readJson } from '@/lib/api'

const ROUTE        = 'POST /api/account/change-password'
const MAX_ATTEMPTS = 5
const WINDOW_MS    = 15 * 60 * 1000 // 15 min

// Change password — requires the current password. All OTHER sessions are
// revoked (the device making the change stays logged in).
export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const body            = await readJson(req)
  const currentPassword = String(body.current_password ?? '')
  const newPassword     = String(body.new_password ?? '')

  if (!currentPassword || !newPassword) {
    return apiError(ERR.BAD_REQUEST, 'กรุณากรอกรหัสผ่านปัจจุบันและรหัสผ่านใหม่')
  }
  if (newPassword.length < 8) {
    return apiError(ERR.BAD_REQUEST, 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร')
  }
  if (newPassword === currentPassword) {
    return apiError(ERR.BAD_REQUEST, 'รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม')
  }

  // Brute-force guard on the current-password check
  const ipHash = hashIp(req)
  if (await isRateLimited({ kind: 'password', email: user.email, max: MAX_ATTEMPTS, windowMs: WINDOW_MS, failuresOnly: true })) {
    return apiError(ERR.RATE_LIMITED, 'พยายามหลายครั้งเกินไป กรุณารอ 15 นาที')
  }

  const db = createServiceClient()
  const { data: row } = await db.from('users')
    .select('password_hash').eq('id', user.id).single()
  const ok = row ? await verifyPassword(currentPassword, row.password_hash as string) : false
  await recordAttempt({ kind: 'password', email: user.email, ipHash, success: ok })

  if (!ok) {
    return apiError(ERR.UNAUTHORIZED, 'รหัสผ่านปัจจุบันไม่ถูกต้อง')
  }

  const password_hash = await hashPassword(newPassword)
  const { error: updErr } = await db.from('users')
    .update({ password_hash }).eq('id', user.id)
  if (updErr) {
    apiLog.error(ROUTE, updErr.message, { userId: user.id })
    return apiError(ERR.INTERNAL, 'เกิดข้อผิดพลาด กรุณาลองใหม่')
  }

  // Revoke every other session — this device stays logged in
  const currentToken = getTokenFromCookie()
  let revoke = db.from('user_sessions').delete().eq('user_id', user.id)
  if (currentToken) revoke = revoke.neq('session_token_hash', hashToken(currentToken))
  await revoke

  apiLog.info(ROUTE, 'password changed', { userId: user.id })
  return apiOk({ ok: true })
}
