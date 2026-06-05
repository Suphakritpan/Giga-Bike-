import 'server-only'

export type EmailResult = { success: boolean; error?: string }

/**
 * Send a 6-digit OTP to the given address.
 *
 * Provider strategy:
 *   1. RESEND_API_KEY present → send via Resend (production-ready).
 *   2. NODE_ENV !== 'production' + no key → log OTP to console (dev only).
 *   3. NODE_ENV === 'production' + no key → fail gracefully; log internally;
 *      never expose OTP or order data in the response.
 *
 * The caller always returns a generic API response regardless of this result,
 * so a send failure does not reveal order existence to the client.
 */
export async function sendOtpEmail(
  to: string,
  orderId: string,
  otp: string,
): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from   = process.env.EMAIL_FROM ?? 'orders@thaigigabike.com'

  // ── Development fallback ───────────────────────────────────────────────
  if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      // Safe to log in dev — never appears in production builds.
      console.log(`[DEV EMAIL] OTP for order ${orderId} → ${to} : ${otp}`)
      return { success: true }
    }
    // Production with no provider configured — fail internally, generic externally.
    console.error('[EMAIL] RESEND_API_KEY not set — OTP could not be delivered')
    return { success: false, error: 'Email provider not configured' }
  }

  // ── Resend ─────────────────────────────────────────────────────────────
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type':  'application/json',
      },
      body: JSON.stringify({
        from,
        to:      [to],
        subject: `รหัสยืนยันคำสั่งซื้อ ${orderId} | GigaBike`,
        html: `
<div style="font-family:'Helvetica Neue',sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#fff">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px">
    <span style="font-size:22px;font-weight:800;color:#16a34a">⚡ Thai</span><span style="font-size:22px;font-weight:800">GigaBike</span>
  </div>
  <h2 style="font-size:18px;font-weight:600;margin:0 0 8px">รหัสยืนยันคำสั่งซื้อ</h2>
  <p style="font-size:14px;color:#555;margin:0 0 24px">
    ออเดอร์ <strong>${orderId}</strong> · กรอกรหัสด้านล่างเพื่อดูสถานะออเดอร์
  </p>
  <div style="font-size:40px;font-weight:800;letter-spacing:10px;color:#111;text-align:center;background:#f4f4f4;border-radius:12px;padding:20px 0;margin-bottom:20px">
    ${otp}
  </div>
  <p style="font-size:13px;color:#888;margin:0 0 8px">รหัสหมดอายุใน 10 นาที · ใช้ได้ครั้งเดียว</p>
  <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
  <p style="font-size:12px;color:#aaa">
    Your verification code for order ${orderId}: <strong>${otp}</strong><br>
    Expires in 10 minutes · Single-use only<br><br>
    If you did not request this code, please ignore this email.
  </p>
</div>`,
      }),
    })

    if (!res.ok) {
      console.error('[EMAIL] Resend API error:', res.status)
      return { success: false, error: 'Email send failed' }
    }

    return { success: true }
  } catch {
    console.error('[EMAIL] Network error sending OTP email')
    return { success: false, error: 'Email send failed' }
  }
}
