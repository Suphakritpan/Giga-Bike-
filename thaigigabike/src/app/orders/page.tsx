'use client'
import { Suspense, useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Mail, Lock, RefreshCw, Package, Truck, CheckCircle,
  XCircle, Clock, ChevronRight,
} from 'lucide-react'
import { useLang } from '@/lib/lang'

type OrderStatus = 'pending' | 'paid' | 'shipping' | 'delivered' | 'cancelled'

type HistoryOrder = {
  id: string
  status: OrderStatus
  created_at: string
  items: { name: string; nameTh: string; quantity: number; price: number }[]
  subtotal: number
  cod_fee: number
  total: number
  shipping_method: string
  shipping_fee: number
  tracking_no: string | null
}

const STATUS_ICON: Record<OrderStatus, React.ReactNode> = {
  pending:   <Clock       size={14} />,
  paid:      <Package     size={14} />,
  shipping:  <Truck       size={14} />,
  delivered: <CheckCircle size={14} />,
  cancelled: <XCircle     size={14} />,
}
const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: 'var(--text3)', paid: 'var(--green)',
  shipping: 'var(--orange)', delivered: 'var(--green)', cancelled: 'var(--red)',
}
const STATUS_TH: Record<OrderStatus, string> = {
  pending: 'รอชำระ', paid: 'ชำระแล้ว', shipping: 'กำลังส่ง', delivered: 'สำเร็จ', cancelled: 'ยกเลิก',
}
const STATUS_EN: Record<OrderStatus, string> = {
  pending: 'Pending', paid: 'Paid', shipping: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled',
}

const RESEND_COOLDOWN = 120

function OrdersContent() {
  const searchParams = useSearchParams()
  const { locale } = useLang()

  type Step = 'email' | 'otp' | 'list'
  const [step, setStep]         = useState<Step>('email')
  const [email, setEmail]       = useState(searchParams.get('email') || '')
  const [orderId, setOrderId]   = useState(searchParams.get('id') || '')
  const [otp, setOtp]           = useState('')
  const [orders, setOrders]     = useState<HistoryOrder[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN)
    timerRef.current = setInterval(() => {
      setCooldown(v => {
        if (v <= 1) { clearInterval(timerRef.current!); return 0 }
        return v - 1
      })
    }, 1000)
  }

  const requestOtp = async () => {
    if (!email.trim() || !orderId.trim()) {
      setError(locale === 'th' ? 'กรุณากรอกอีเมลและเลขออเดอร์' : 'Enter your email and order number')
      return
    }
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/order-lookup/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: orderId.trim().toUpperCase() }),
      })
      if (!res.ok) throw new Error()
      setStep('otp')
      startCooldown()
    } catch {
      setError(locale === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่' : 'Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  const verifyAndLoad = async () => {
    const code = otp.replace(/\s/g, '')
    if (!/^\d{6}$/.test(code)) {
      setError(locale === 'th' ? 'รหัสต้องเป็น 6 หลัก' : 'Code must be 6 digits')
      return
    }
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/order-lookup/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), orderId: orderId.trim().toUpperCase(), otp: code }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error ?? (locale === 'th' ? 'รหัสไม่ถูกต้อง' : 'Invalid code'))
        return
      }
      setOrders(data.orders ?? [])
      setStep('list')
    } catch {
      setError(locale === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่' : 'Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB', {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px', fontSize: 16,
    border: '0.5px solid var(--border2)', borderRadius: 8,
    background: 'var(--bg3)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div>
      <section style={{ background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)', padding: '32px 0' }}>
        <div className="container" style={{ maxWidth: 640 }}>
          <h1 style={{ fontSize: 34, marginBottom: 4 }}>
            {locale === 'th' ? 'ประวัติออเดอร์' : 'Order History'}
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 16 }}>
            {locale === 'th'
              ? 'ดูออเดอร์ทั้งหมดที่สั่งซื้อด้วย email นี้'
              : 'View all orders placed with your email address'}
          </p>
        </div>
      </section>

      <div className="container section" style={{ maxWidth: 640 }}>

        {/* Step 1: Email + order ID */}
        {step === 'email' && (
          <div>
            <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 20, lineHeight: 1.6 }}>
              {locale === 'th'
                ? 'กรอกอีเมลและเลขออเดอร์ใดๆ ของคุณ เพื่อรับรหัสยืนยันแล้วดูออเดอร์ทั้งหมด'
                : 'Enter your email and any order number you placed. We\'ll send a code to show all your orders.'}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>
                  {locale === 'th' ? 'อีเมลที่ใช้สั่งซื้อ' : 'Email used at checkout'} *
                </label>
                <input style={inp} type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  onKeyDown={e => e.key === 'Enter' && requestOtp()} />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>
                  {locale === 'th' ? 'เลขออเดอร์ใดๆ (เพื่อยืนยัน)' : 'Any order number (to verify)'} *
                </label>
                <input style={{ ...inp, fontFamily: 'var(--font-display)', letterSpacing: 1 }}
                  value={orderId} onChange={e => setOrderId(e.target.value.toUpperCase())}
                  placeholder="GGB-XXXXX"
                  onKeyDown={e => e.key === 'Enter' && requestOtp()} />
              </div>
            </div>
            {error && <ErrorBanner message={error} />}
            <button className="btn-primary" onClick={requestOtp} disabled={loading}
              style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
              <Mail size={15} />
              {loading
                ? (locale === 'th' ? 'กำลังส่ง...' : 'Sending…')
                : (locale === 'th' ? 'รับรหัสทาง Email' : 'Get code by Email')}
            </button>
            <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 12, lineHeight: 1.6 }}>
              🔒 {locale === 'th'
                ? 'รหัสจะส่งไปยังอีเมลนั้นเท่านั้น ไม่มีใครอื่นดูได้'
                : 'Code is sent only to that email — no one else can access it.'}
            </p>
          </div>
        )}

        {/* Step 2: OTP */}
        {step === 'otp' && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 10,
              background: 'rgba(34,197,94,.06)', border: '0.5px solid rgba(34,197,94,.3)', marginBottom: 20,
            }}>
              <Mail size={18} color="var(--green)" />
              <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.5 }}>
                {locale === 'th'
                  ? <>ส่งรหัสยืนยัน 6 หลักไปยัง <strong>{email}</strong> แล้ว</>
                  : <>A 6-digit code has been sent to <strong>{email}</strong>.</>}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input style={{ ...inp, flex: 1, fontSize: 26, textAlign: 'center', fontFamily: 'var(--font-display)', letterSpacing: 6 }}
                placeholder="000000" value={otp} maxLength={6} inputMode="numeric"
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && verifyAndLoad()} autoFocus />
              <button className="btn-primary" onClick={verifyAndLoad}
                disabled={loading || otp.length !== 6}
                style={{ whiteSpace: 'nowrap', opacity: (loading || otp.length !== 6) ? 0.7 : 1 }}>
                <Lock size={15} />
                {loading ? (locale === 'th' ? 'กำลังตรวจสอบ...' : 'Verifying…') : (locale === 'th' ? 'ยืนยัน' : 'Verify')}
              </button>
            </div>
            {error && <ErrorBanner message={error} />}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button className="btn-ghost" style={{ fontSize: 14, opacity: cooldown > 0 ? 0.4 : 1 }}
                disabled={cooldown > 0}
                onClick={async () => { setOtp(''); setError(null); await requestOtp() }}>
                <RefreshCw size={13} />
                {cooldown > 0
                  ? (locale === 'th' ? `ส่งใหม่ใน ${cooldown}ว` : `Resend in ${cooldown}s`)
                  : (locale === 'th' ? 'ส่งรหัสใหม่' : 'Resend code')}
              </button>
              <button className="btn-ghost" style={{ fontSize: 14 }} onClick={() => { setStep('email'); setOtp(''); setError(null) }}>
                {locale === 'th' ? '← แก้ไขอีเมล' : '← Edit email'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Order list */}
        {step === 'list' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
              <p style={{ fontSize: 15, color: 'var(--text2)' }}>
                {locale === 'th'
                  ? <>{orders.length} ออเดอร์สำหรับ <strong>{email}</strong></>
                  : <>{orders.length} orders for <strong>{email}</strong></>}
              </p>
              <button className="btn-ghost" style={{ fontSize: 14 }}
                onClick={() => { setStep('email'); setOrders([]); setOtp('') }}>
                {locale === 'th' ? '← ค้นหาใหม่' : '← Search again'}
              </button>
            </div>

            {orders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text3)' }}>
                <Package size={40} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.4 }} />
                <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>
                  {locale === 'th' ? 'ไม่พบออเดอร์' : 'No orders found'}
                </p>
                <p style={{ fontSize: 14 }}>
                  {locale === 'th' ? 'อีเมลนี้ยังไม่มีประวัติออเดอร์' : 'No order history for this email'}
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {orders.map(order => {
                  const statusColor = STATUS_COLOR[order.status]
                  const statusLabel = locale === 'th' ? STATUS_TH[order.status] : STATUS_EN[order.status]
                  return (
                    <div key={order.id} style={{
                      background: 'var(--bg2)', border: '0.5px solid var(--border)',
                      borderRadius: 12, padding: '16px 20px',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: .5 }}>
                            {order.id}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                            {fmtDate(order.created_at)}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: statusColor, display: 'flex' }}>{STATUS_ICON[order.status]}</span>
                          <span style={{ fontSize: 14, fontWeight: 600, color: statusColor }}>{statusLabel}</span>
                        </div>
                      </div>

                      <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 8 }}>
                        {order.items?.length ?? 0} {locale === 'th' ? 'รายการ' : 'items'}
                        {order.tracking_no && (
                          <span style={{ marginLeft: 10, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>
                            · {locale === 'th' ? 'พัสดุ:' : 'Tracking:'} {order.tracking_no}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>
                          ฿{order.total.toLocaleString()}
                        </div>
                        <Link href={`/order?id=${encodeURIComponent(order.id)}`}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            fontSize: 14, color: 'var(--green)', textDecoration: 'none', fontWeight: 600,
                          }}>
                          {locale === 'th' ? 'รายละเอียด' : 'Details'} <ChevronRight size={13} />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 14,
      background: 'rgba(220,38,38,.06)', border: '0.5px solid rgba(220,38,38,.25)', color: 'var(--red)',
    }}>
      <XCircle size={14} color="var(--red)" style={{ flexShrink: 0, marginTop: 2 }} />
      {message}
    </div>
  )
}

export default function OrdersPage() {
  return (
    <Suspense fallback={
      <div className="section">
        <div className="container" style={{ maxWidth: 640 }}>
          <div style={{ height: 40, background: 'var(--bg3)', borderRadius: 8, maxWidth: 300, marginBottom: 24 }} />
          <div style={{ height: 52, background: 'var(--bg3)', borderRadius: 10, marginBottom: 16 }} />
        </div>
      </div>
    }>
      <OrdersContent />
    </Suspense>
  )
}
