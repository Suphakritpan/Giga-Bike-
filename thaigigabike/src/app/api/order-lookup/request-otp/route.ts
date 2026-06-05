import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomInt } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { sendOtpEmail } from '@/lib/email'

const OTP_TTL_SECONDS      = 600  // 10 minutes
const RESEND_COOLDOWN_SEC  = 120  // 2 minutes between requests per order
const MAX_ATTEMPTS         = 5    // max bad-verify attempts per OTP

function generateOTP(): string {
  return randomInt(100000, 999999).toString()
}

function hashOTP(otp: string): string {
  return createHash('sha256').update(otp).digest('hex')
}

// Always return the same generic shape — never reveal whether the order exists
// or whether an email was actually sent (prevents order enumeration).
const GENERIC_OK = NextResponse.json({
  ok: true,
  message: 'If this order exists, a verification code has been sent to the associated email.',
})

/**
 * POST /api/order-lookup/request-otp
 * Body: { orderId: string }
 *
 * Security:
 *  - Response is ALWAYS the same generic success, regardless of outcome.
 *  - Cooldown: will not create a new OTP if a valid one was issued < 2 min ago.
 *  - OTP is hashed (SHA-256) before storage; plaintext never persisted.
 *  - Dev mode logs plaintext OTP to console; never in production.
 */
export async function POST(request: NextRequest) {
  try {
    const body    = await request.json().catch(() => ({}))
    const orderId = typeof body?.orderId === 'string' ? body.orderId.trim().toUpperCase() : ''

    // Basic shape check — never reveal "not found" to the caller.
    if (!orderId || orderId.length > 40 || !/^[A-Z0-9\-]+$/.test(orderId)) {
      return GENERIC_OK
    }

    const supabase = createServiceClient()

    // Fetch the order's contact email — never expose whether the order exists.
    const { data: order } = await supabase
      .from('orders')
      .select('id, contact_email')
      .eq('id', orderId)
      .maybeSingle()

    // Order not found or no email → return generic (do not reveal).
    if (!order?.contact_email) return GENERIC_OK

    // ── Cooldown: prevent OTP spam per order ──────────────────────────────
    const cooldownAfter = new Date(Date.now() - RESEND_COOLDOWN_SEC * 1000).toISOString()
    const { data: recent } = await supabase
      .from('order_lookup_otps')
      .select('id')
      .eq('order_id', orderId)
      .gt('created_at', cooldownAfter)
      .gt('expires_at', new Date().toISOString())
      .is('used_at', null)
      .lt('attempts', MAX_ATTEMPTS)
      .maybeSingle()

    if (recent) return GENERIC_OK  // cooldown active, but return generic

    // ── Generate + hash + store OTP ───────────────────────────────────────
    const otp       = generateOTP()
    const otpHash   = hashOTP(otp)
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000).toISOString()

    const { error: insertErr } = await supabase
      .from('order_lookup_otps')
      .insert({ order_id: orderId, otp_hash: otpHash, expires_at: expiresAt })

    if (insertErr) {
      console.error('[OTP] Insert failed')
      return GENERIC_OK
    }

    // ── Send email (non-fatal — generic response either way) ───────────────
    await sendOtpEmail(order.contact_email as string, orderId, otp)

    return GENERIC_OK
  } catch {
    console.error('[OTP] request-otp handler error')
    return GENERIC_OK
  }
}
