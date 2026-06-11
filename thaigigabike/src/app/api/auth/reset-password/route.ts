import { NextRequest } from 'next/server'
import { createHash } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { hashPassword } from '@/lib/password'
import { apiOk, apiError, ERR, apiLog, readJson } from '@/lib/api'

const ROUTE = 'POST /api/auth/reset-password'

export async function POST(req: NextRequest) {
  const body     = await readJson(req)
  const token    = String(body.token ?? '')
  const password = String(body.password ?? '')

  if (!token) {
    return apiError(ERR.BAD_REQUEST, 'ลิงก์ไม่ถูกต้อง — กรุณาขอลิงก์ใหม่')
  }
  if (password.length < 8) {
    return apiError(ERR.BAD_REQUEST, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
  }

  const db = createServiceClient()
  const tokenHash = createHash('sha256').update(token).digest('hex')

  const { data: row } = await db.from('password_reset_tokens')
    .select('id, user_id, expires_at, used_at')
    .eq('token_hash', tokenHash).single()

  const expired = !row || row.used_at !== null || new Date(row.expires_at as string) < new Date()
  if (expired) {
    return apiError(ERR.BAD_REQUEST, 'ลิงก์หมดอายุหรือถูกใช้ไปแล้ว — กรุณาขอลิงก์ใหม่')
  }

  const password_hash = await hashPassword(password)
  const { error: updErr } = await db.from('users')
    .update({ password_hash }).eq('id', row.user_id)
  if (updErr) {
    apiLog.error(ROUTE, updErr.message, { userId: row.user_id })
    return apiError(ERR.INTERNAL, 'เกิดข้อผิดพลาด กรุณาลองใหม่')
  }

  // Single-use token + force re-login everywhere
  await db.from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() }).eq('id', row.id)
  await db.from('user_sessions').delete().eq('user_id', row.user_id)

  apiLog.info(ROUTE, 'password reset', { userId: row.user_id })
  return apiOk({ ok: true })
}
