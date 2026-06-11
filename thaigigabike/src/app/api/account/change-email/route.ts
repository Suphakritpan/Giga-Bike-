import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireUser } from '@/lib/auth'
import { verifyPassword } from '@/lib/password'
import { issueVerificationEmail } from '@/lib/verification'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Change account email. Requires password re-confirmation.
export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* ignore */ }
  const password = String(body.password ?? '')
  const newEmail = String(body.new_email ?? '').trim().toLowerCase()

  if (!password || !newEmail) {
    return NextResponse.json({ error: 'กรุณากรอกรหัสผ่านและอีเมลใหม่' }, { status: 400 })
  }
  if (!EMAIL_RE.test(newEmail)) {
    return NextResponse.json({ error: 'รูปแบบอีเมลไม่ถูกต้อง' }, { status: 400 })
  }
  if (newEmail === user.email) {
    return NextResponse.json({ error: 'อีเมลใหม่ซ้ำกับอีเมลเดิม' }, { status: 400 })
  }

  const db = createServiceClient()

  const { data: row } = await db.from('users')
    .select('password_hash').eq('id', user.id).single()
  const ok = row ? await verifyPassword(password, row.password_hash as string) : false
  if (!ok) {
    return NextResponse.json({ error: 'รหัสผ่านไม่ถูกต้อง' }, { status: 401 })
  }

  const { data: taken } = await db.from('users')
    .select('id').eq('email', newEmail).single()
  if (taken) {
    return NextResponse.json({ error: 'อีเมลนี้ถูกใช้งานแล้ว' }, { status: 409 })
  }

  const { error: updErr } = await db.from('users')
    .update({ email: newEmail }).eq('id', user.id)
  if (updErr) {
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด กรุณาลองใหม่' }, { status: 500 })
  }

  // New address starts UNVERIFIED — email-matched guest data is hidden again
  // until the new link is clicked. Separate best-effort update so this still
  // works if the phase3 migration hasn't been applied yet.
  await db.from('users')
    .update({ email_verified_at: null }).eq('id', user.id)
    .then(() => {}, () => {})

  issueVerificationEmail(user.id, newEmail).catch(() => {})

  return NextResponse.json({ ok: true, email: newEmail })
}
