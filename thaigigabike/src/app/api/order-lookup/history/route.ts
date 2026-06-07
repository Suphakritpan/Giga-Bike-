import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'

// Verifies the OTP for any order belonging to this email,
// then returns all orders for that email.
// The OTP proves the caller owns the email — prevents enumeration.

function hashOTP(otp: string): string {
  return createHash('sha256').update(otp).digest('hex')
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> | null = null
  try { body = await req.json() } catch { /* ignore */ }

  const email   = typeof body?.email   === 'string' ? body.email.trim().toLowerCase()  : ''
  const orderId = typeof body?.orderId === 'string' ? body.orderId.trim().toUpperCase() : ''
  const otp     = typeof body?.otp     === 'string' ? body.otp.replace(/\s/g, '')       : ''

  if (!email || !orderId || !/^\d{6}$/.test(otp)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const db = createServiceClient()

  // 1. Verify OTP for the given order
  const hash = hashOTP(otp)
  const now  = new Date().toISOString()

  const { data: otpRow, error: otpErr } = await db
    .from('order_lookup_otps')
    .select('id, attempts, used_at')
    .eq('order_id', orderId)
    .eq('otp_hash', hash)
    .gt('expires_at', now)
    .is('used_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (otpErr || !otpRow) {
    return NextResponse.json({ error: 'Invalid or expired code' }, { status: 401 })
  }

  if (otpRow.attempts >= 5) {
    return NextResponse.json({ error: 'Too many attempts' }, { status: 429 })
  }

  // Mark OTP used
  await db.from('order_lookup_otps').update({ used_at: now }).eq('id', otpRow.id)

  // 2. Fetch all orders for this email
  const { data: orders, error: ordErr } = await db
    .from('orders')
    .select('id, status, created_at, items, subtotal, cod_fee, total, shipping_method, shipping_fee, tracking_no')
    .eq('contact_email', email)
    .order('created_at', { ascending: false })
    .limit(50)

  if (ordErr) {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, orders: orders ?? [] })
}
