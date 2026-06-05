import { NextRequest, NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'

const MAX_ATTEMPTS = 5

function hashOTP(otp: string): string {
  return createHash('sha256').update(otp).digest('hex')
}

/** Constant-time string comparison (both must be 64-char SHA-256 hex). */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'))
}

function maskName(name: string): string {
  const first = (name ?? '').trim().split(/\s+/)[0] ?? ''
  return first || '•'
}

function maskAddress(address: string): string {
  if (!address) return '•••'
  const words = address.trim().split(/[\s,]+/).filter(Boolean)
  if (words.length <= 2) return words[0] + ' •••'
  // Show start + end; mask the middle (typically street detail in Thai)
  return words[0] + ' ••• ' + words[words.length - 1]
}

// What the public sees after successful OTP verification.
// No slip fields. No full address. No contact email. No phone.
const SAFE_COLUMNS =
  'id, status, created_at, recipient_name, recipient_address, ' +
  'shipping_method, shipping_fee, payment_method, ' +
  'items, subtotal, cod_fee, total, tracking_no'

/**
 * POST /api/order-lookup/verify
 * Body: { orderId: string, otp: string }
 *
 * Returns safe order data only if the OTP is correct and unexpired.
 * - OTP compared using timingSafeEqual (constant-time).
 * - Attempts incremented BEFORE comparison to prevent timing-based enumeration.
 * - OTP marked `used_at` after first successful verification.
 * - No slip fields, no phone, no full address in response.
 */
export async function POST(request: NextRequest) {
  try {
    const body    = await request.json().catch(() => ({}))
    const orderId = typeof body?.orderId === 'string' ? body.orderId.trim().toUpperCase() : ''
    const otp     = typeof body?.otp     === 'string' ? body.otp.replace(/\s/g, '')       : ''

    if (!orderId || !otp || !/^\d{6}$/.test(otp) || orderId.length > 40) {
      return NextResponse.json(
        { ok: false, error: 'Invalid code. Please check and try again.' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Fetch the most recent valid, unused OTP for this order
    const { data: rec, error: fetchErr } = await supabase
      .from('order_lookup_otps')
      .select('id, otp_hash, attempts')
      .eq('order_id', orderId)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fetchErr || !rec) {
      return NextResponse.json(
        { ok: false, error: 'Code expired or not found. Please request a new one.' },
        { status: 400 }
      )
    }

    const attempts = (rec.attempts as number) ?? 0

    if (attempts >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { ok: false, error: 'Too many failed attempts. Please request a new code.' },
        { status: 400 }
      )
    }

    // Increment attempts BEFORE verifying — prevents timing attacks / parallel requests
    await supabase
      .from('order_lookup_otps')
      .update({ attempts: attempts + 1 })
      .eq('id', rec.id)

    const provided = hashOTP(otp)
    const stored   = rec.otp_hash as string

    if (!safeCompare(provided, stored)) {
      return NextResponse.json(
        { ok: false, error: 'Incorrect code. Please try again.' },
        { status: 400 }
      )
    }

    // ── OTP valid ─────────────────────────────────────────────────────────
    // Mark as used (single-use guarantee)
    await supabase
      .from('order_lookup_otps')
      .update({ used_at: new Date().toISOString() })
      .eq('id', rec.id)

    // Fetch order (safe columns only).
    // `as unknown as ...` is needed because Supabase cannot infer the shape
    // from a runtime string; all column access goes through explicit casts below.
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select(SAFE_COLUMNS)
      .eq('id', orderId)
      .single() as unknown as { data: Record<string, unknown> | null; error: unknown }

    if (orderErr || !order) {
      return NextResponse.json(
        { ok: false, error: 'Order not found.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      order: {
        id:               order.id,
        status:           order.status,
        created_at:       order.created_at,
        shipping_method:  order.shipping_method,
        shipping_fee:     order.shipping_fee,
        payment_method:   order.payment_method,
        items:            order.items,
        subtotal:         order.subtotal,
        cod_fee:          order.cod_fee,
        total:            order.total,
        tracking_no:      order.tracking_no ?? null,
        // Masked PII — user knows their own name/address; no need to re-expose in full
        recipient_name:    maskName(order.recipient_name as string),
        recipient_address: maskAddress(order.recipient_address as string),
      },
    })
  } catch {
    console.error('[OTP] verify handler error')
    return NextResponse.json(
      { ok: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
