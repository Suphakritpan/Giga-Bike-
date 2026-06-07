import 'server-only'

export type EmailResult = { success: boolean; error?: string }

type OrderItem = {
  code: string; nameTh: string; name: string
  price: number; quantity: number; color: string
}

type ConfirmationPayload = {
  orderId: string
  recipientName: string
  items: OrderItem[]
  subtotal: number
  shippingFee: number
  codFee: number
  total: number
  shippingMethod: string
  paymentMethod: string
}

/**
 * Send an order confirmation email to the customer.
 *
 * Fire-and-forget from the checkout route — a send failure does NOT affect
 * the order result returned to the customer.
 */
export async function sendOrderConfirmationEmail(
  to: string,
  payload: ConfirmationPayload,
): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from   = process.env.EMAIL_FROM ?? 'orders@thaigigabike.com'

  const { orderId, recipientName, items, subtotal, shippingFee, codFee, total, shippingMethod, paymentMethod } = payload

  const shippingLabel: Record<string, string> = { kerry: 'Kerry Express', flash: 'Flash Express', pickup: 'รับเอง' }
  const payLabel: Record<string, string> = { transfer: 'โอนเงิน', cod: 'เก็บเงินปลายทาง (COD)' }
  const fmt = (n: number) => `฿${n.toLocaleString('th-TH')}`

  const itemRows = items.map(it =>
    `<tr>
      <td style="padding:6px 0;font-size:14px;border-bottom:1px solid #f0f0f0">${it.nameTh || it.name} (${it.color})</td>
      <td style="padding:6px 0;font-size:14px;border-bottom:1px solid #f0f0f0;text-align:center">${it.quantity}</td>
      <td style="padding:6px 0;font-size:14px;border-bottom:1px solid #f0f0f0;text-align:right">${fmt(it.price * it.quantity)}</td>
    </tr>`
  ).join('')

  const html = `
<div style="font-family:'Helvetica Neue',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff">
  <div style="margin-bottom:24px">
    <span style="font-size:22px;font-weight:800;color:#16a34a">⚡ Thai</span><span style="font-size:22px;font-weight:800">GigaBike</span>
  </div>
  <h2 style="font-size:20px;font-weight:700;margin:0 0 4px">ยืนยันคำสั่งซื้อ</h2>
  <p style="font-size:14px;color:#555;margin:0 0 24px">สวัสดีคุณ ${recipientName} — ขอบคุณที่สั่งซื้อสินค้ากับเรา</p>

  <div style="background:#f9fafb;border-radius:10px;padding:16px 20px;margin-bottom:20px">
    <div style="font-size:13px;color:#888;margin-bottom:4px">หมายเลขออเดอร์</div>
    <div style="font-size:20px;font-weight:800;letter-spacing:1px;color:#111">${orderId}</div>
  </div>

  <table style="width:100%;border-collapse:collapse;margin-bottom:16px">
    <thead>
      <tr style="border-bottom:2px solid #111">
        <th style="text-align:left;font-size:12px;font-weight:600;padding-bottom:6px;color:#888">สินค้า</th>
        <th style="text-align:center;font-size:12px;font-weight:600;padding-bottom:6px;color:#888">จำนวน</th>
        <th style="text-align:right;font-size:12px;font-weight:600;padding-bottom:6px;color:#888">รวม</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <tr><td style="font-size:14px;padding:3px 0;color:#555">สินค้ารวม</td><td style="font-size:14px;text-align:right">${fmt(subtotal)}</td></tr>
    <tr><td style="font-size:14px;padding:3px 0;color:#555">ค่าจัดส่ง (${shippingLabel[shippingMethod] ?? shippingMethod})</td><td style="font-size:14px;text-align:right">${fmt(shippingFee)}</td></tr>
    ${codFee > 0 ? `<tr><td style="font-size:14px;padding:3px 0;color:#555">ค่าบริการ COD</td><td style="font-size:14px;text-align:right">${fmt(codFee)}</td></tr>` : ''}
    <tr style="border-top:2px solid #111">
      <td style="font-size:16px;font-weight:700;padding-top:8px">รวมทั้งหมด</td>
      <td style="font-size:16px;font-weight:700;text-align:right;padding-top:8px;color:#16a34a">${fmt(total)}</td>
    </tr>
  </table>

  <div style="font-size:14px;color:#555;margin-bottom:20px">
    <strong>การชำระเงิน:</strong> ${payLabel[paymentMethod] ?? paymentMethod}
  </div>

  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 16px;font-size:13px;color:#166534;margin-bottom:24px">
    ติดตามสถานะออเดอร์ได้ที่ <a href="https://thaigigabike.com/order" style="color:#16a34a;font-weight:600">thaigigabike.com/order</a> โดยใช้หมายเลขออเดอร์ด้านบน
  </div>

  <hr style="border:none;border-top:1px solid #eee;margin:0 0 16px">
  <p style="font-size:12px;color:#aaa;margin:0">
    Order confirmation for ${orderId} · ThaiGigaBike<br>
    Track at: https://thaigigabike.com/order
  </p>
</div>`

  if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV EMAIL] Order confirmation for ${orderId} → ${to}`)
      return { success: true }
    }
    console.error('[EMAIL] RESEND_API_KEY not set — order confirmation could not be sent')
    return { success: false, error: 'Email provider not configured' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to:      [to],
        subject: `ยืนยันคำสั่งซื้อ ${orderId} | GigaBike`,
        html,
      }),
    })
    if (!res.ok) {
      console.error('[EMAIL] Resend API error (confirmation):', res.status)
      return { success: false, error: 'Email send failed' }
    }
    return { success: true }
  } catch {
    console.error('[EMAIL] Network error sending order confirmation')
    return { success: false, error: 'Email send failed' }
  }
}

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

/**
 * Notify customer when their order status changes.
 * Fire-and-forget: never throws, never blocks the caller.
 */
export async function sendStatusUpdateEmail(
  to: string,
  payload: { orderId: string; recipientName: string; status: string; trackingNo: string | null }
): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  const from   = process.env.EMAIL_FROM ?? 'orders@thaigigabike.com'

  const STATUS_TH: Record<string, string> = {
    pending:   'รอชำระเงิน',
    paid:      'ยืนยันการชำระเงินแล้ว — กำลังเตรียมจัดส่ง',
    shipping:  'จัดส่งสินค้าแล้ว',
    delivered: 'ส่งสำเร็จแล้ว',
    cancelled: 'ยกเลิกออเดอร์',
  }
  const STATUS_EN: Record<string, string> = {
    pending:   'Pending payment',
    paid:      'Payment confirmed — preparing to ship',
    shipping:  'Your order has been shipped',
    delivered: 'Your order has been delivered',
    cancelled: 'Order cancelled',
  }
  const statusTh = STATUS_TH[payload.status] ?? payload.status
  const statusEn = STATUS_EN[payload.status] ?? payload.status

  const trackingHtml = payload.trackingNo
    ? `<p style="margin:12px 0;font-size:14px;color:#555">
        <strong>Tracking / เลขพัสดุ:</strong>
        <span style="font-family:monospace;font-weight:700;color:#111"> ${payload.trackingNo}</span>
       </p>`
    : ''

  const html = `
<div style="font-family:'Helvetica Neue',sans-serif;max-width:500px;margin:0 auto;padding:32px 24px;background:#fff">
  <div style="margin-bottom:20px">
    <span style="font-size:22px;font-weight:800;color:#16a34a">⚡ Thai</span><span style="font-size:22px;font-weight:800">GigaBike</span>
  </div>
  <h2 style="font-size:19px;font-weight:700;margin:0 0 4px">อัปเดตสถานะออเดอร์</h2>
  <p style="font-size:14px;color:#555;margin:0 0 20px">สวัสดีคุณ ${payload.recipientName}</p>
  <div style="background:#f9fafb;border-radius:10px;padding:16px 20px;margin-bottom:16px">
    <div style="font-size:13px;color:#888;margin-bottom:4px">ออเดอร์ / Order ID</div>
    <div style="font-size:20px;font-weight:800;letter-spacing:1px;color:#111">${payload.orderId}</div>
  </div>
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-bottom:16px">
    <div style="font-size:13px;color:#166534;font-weight:600;margin-bottom:4px">สถานะใหม่ / New Status</div>
    <div style="font-size:18px;font-weight:800;color:#16a34a">${statusTh}</div>
    <div style="font-size:13px;color:#555;margin-top:2px">${statusEn}</div>
  </div>
  ${trackingHtml}
  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;font-size:13px;color:#166534;margin-bottom:20px">
    ติดตามออเดอร์ได้ที่ <a href="https://thaigigabike.com/order?id=${payload.orderId}" style="color:#16a34a;font-weight:600">thaigigabike.com/order</a>
  </div>
  <hr style="border:none;border-top:1px solid #eee;margin:0 0 14px">
  <p style="font-size:12px;color:#aaa">Order ${payload.orderId} · ThaiGigaBike · thaigigabike.com</p>
</div>`

  if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEV EMAIL] Status update for ${payload.orderId} → ${to} : ${payload.status}`)
      return { success: true }
    }
    return { success: false, error: 'Email provider not configured' }
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method:  'POST',
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from, to: [to],
        subject: `อัปเดตออเดอร์ ${payload.orderId} — ${statusTh} | GigaBike`,
        html,
      }),
    })
    if (!res.ok) return { success: false, error: 'Email send failed' }
    return { success: true }
  } catch {
    return { success: false, error: 'Email send failed' }
  }
}
