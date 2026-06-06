'use client'
import { Suspense, useState, useEffect, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Search, CheckCircle, Truck, XCircle, Clock, Check,
  Mail, RefreshCw, Lock, Package, CalendarCheck,
} from 'lucide-react'
import { useLang } from '@/lib/lang'

// ── Types ──────────────────────────────────────────────────────────────────
type Step = 'input' | 'sent' | 'verified'
type OrderStatus = 'pending' | 'paid' | 'shipping' | 'delivered' | 'cancelled'

type OrderItem = {
  productId: string; code: string; name: string; nameTh: string
  price: number; quantity: number; color: string
}

type VerifiedOrder = {
  id: string; status: OrderStatus; created_at: string
  recipient_name: string; recipient_address: string
  shipping_method: string; shipping_fee: number
  payment_method: string
  items: OrderItem[]
  subtotal: number; cod_fee: number; total: number
  tracking_no: string | null
}

const STATUS_STEPS: OrderStatus[] = ['pending', 'paid', 'shipping', 'delivered']
const RESEND_COOLDOWN = 120 // seconds

const SHIPPING_LABEL: Record<string, { th: string; en: string }> = {
  kerry:  { th: 'Kerry Express', en: 'Kerry Express' },
  flash:  { th: 'Flash Express', en: 'Flash Express' },
  pickup: { th: 'รับเองที่ร้าน', en: 'Pick up at store' },
}

// ── Status helpers ─────────────────────────────────────────────────────────
function statusLabel(s: OrderStatus, locale: string) {
  const th: Record<OrderStatus, string> = {
    pending: 'รอชำระเงิน', paid: 'ชำระแล้ว', shipping: 'กำลังจัดส่ง',
    delivered: 'ส่งแล้ว', cancelled: 'ยกเลิก',
  }
  const en: Record<OrderStatus, string> = {
    pending: 'Pending payment', paid: 'Paid', shipping: 'Shipping',
    delivered: 'Delivered', cancelled: 'Cancelled',
  }
  return locale === 'th' ? th[s] : en[s]
}

function StatusIcon({ s }: { s: OrderStatus }) {
  if (s === 'delivered') return <CheckCircle size={18} color="var(--green)" />
  if (s === 'shipping')  return <Truck       size={18} color="var(--orange)" />
  if (s === 'cancelled') return <XCircle     size={18} color="var(--red)" />
  if (s === 'paid')      return <Package     size={18} color="var(--green)" />
  return <Clock size={18} color="var(--text3)" />
}

// ── Main component (client) ────────────────────────────────────────────────
function OrderContent() {
  const searchParams = useSearchParams()
  const router       = useRouter()
  const { locale }   = useLang()

  const [step, setStep]       = useState<Step>('input')
  const [orderId, setOrderId] = useState(searchParams.get('id') || '')
  const [otp, setOtp]         = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [order, setOrder]     = useState<VerifiedOrder | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Clean up interval on unmount
  useEffect(() => () => { if (cooldownRef.current) clearInterval(cooldownRef.current) }, [])

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN)
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  // ── Step 1: request OTP ────────────────────────────────────────────────
  const handleRequestOtp = async () => {
    const id = orderId.trim().toUpperCase()
    if (!id) {
      setError(locale === 'th' ? 'กรุณากรอกเลขออเดอร์' : 'Please enter an order ID')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/order-lookup/request-otp', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orderId: id }),
      })
      if (!res.ok) throw new Error()
      setStep('sent')
      startCooldown()
      router.replace(`/order?id=${encodeURIComponent(id)}`, { scroll: false })
    } catch {
      setError(locale === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่' : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: verify OTP ─────────────────────────────────────────────────
  const handleVerify = async () => {
    const code = otp.replace(/\s/g, '')
    if (!/^\d{6}$/.test(code)) {
      setError(locale === 'th' ? 'รหัสต้องเป็นตัวเลข 6 หลัก' : 'Code must be 6 digits')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch('/api/order-lookup/verify', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ orderId: orderId.trim().toUpperCase(), otp: code }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error ?? (locale === 'th' ? 'รหัสไม่ถูกต้อง' : 'Invalid code'))
        return
      }
      setOrder(data.order)
      setStep('verified')
      setError(null)
    } catch {
      setError(locale === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่' : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 3: restart ────────────────────────────────────────────────────
  const handleReset = () => {
    setStep('input')
    setOtp('')
    setOrder(null)
    setError(null)
    setCooldown(0)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
  }

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 640 }}>
        <h1 style={{ fontSize: 34, marginBottom: 8 }}>
          {locale === 'th' ? 'ติดตามออเดอร์' : 'Track Order'}
        </h1>

        {/* ── Step 1: enter order ID ─────────────────────────────────── */}
        {step === 'input' && (
          <div>
            <p style={{ color: 'var(--text2)', fontSize: 15, marginBottom: 24 }}>
              {locale === 'th'
                ? 'กรอกเลขออเดอร์ แล้วรับรหัสยืนยัน 6 หลักทางอีเมลที่ใช้สั่งซื้อ'
                : 'Enter your order ID to receive a 6-digit verification code at the email used during checkout.'}
            </p>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
                <input
                  className="input"
                  style={{ paddingLeft: 40, fontSize: 17, fontFamily: 'var(--font-display)', letterSpacing: 1 }}
                  placeholder="GGB-XXXXX"
                  value={orderId}
                  onChange={e => setOrderId(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && handleRequestOtp()}
                  autoFocus
                />
              </div>
              <button
                className="btn-primary"
                onClick={handleRequestOtp}
                disabled={loading}
                style={{ whiteSpace: 'nowrap', opacity: loading ? 0.7 : 1 }}
              >
                <Mail size={15} />
                {loading
                  ? (locale === 'th' ? 'กำลังส่ง...' : 'Sending…')
                  : (locale === 'th' ? 'ขอรหัส' : 'Get code')}
              </button>
            </div>

            {error && <ErrorBanner message={error} />}

            <p style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.6 }}>
              {locale === 'th'
                ? '🔒 เพื่อความปลอดภัย ระบบจะส่งรหัสยืนยันไปยังอีเมลที่ใช้สั่งซื้อเท่านั้น'
                : '🔒 For your security, the code is sent only to the email used at checkout.'}
            </p>
          </div>
        )}

        {/* ── Step 2: enter OTP ──────────────────────────────────────── */}
        {step === 'sent' && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
              padding: '14px 18px', borderRadius: 10,
              background: 'rgba(34,197,94,.06)', border: '0.5px solid rgba(34,197,94,.3)',
            }}>
              <Mail size={18} color="var(--green)" />
              <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.5 }}>
                {locale === 'th'
                  ? <>ส่งรหัสยืนยัน 6 หลักไปยังอีเมลที่เชื่อมกับออเดอร์ <strong>{orderId.trim().toUpperCase()}</strong> แล้ว<br />กรุณาตรวจสอบกล่องจดหมาย (รวมถึงกล่อง Spam)</>
                  : <>A 6-digit code has been sent to the email on order <strong>{orderId.trim().toUpperCase()}</strong>.<br />Please check your inbox (including Spam).</>}
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input
                className="input"
                style={{ flex: 1, fontSize: 26, textAlign: 'center', fontFamily: 'var(--font-display)', letterSpacing: 6 }}
                placeholder="000000"
                value={otp}
                maxLength={6}
                inputMode="numeric"
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                autoFocus
              />
              <button
                className="btn-primary"
                onClick={handleVerify}
                disabled={loading || otp.length !== 6}
                style={{ whiteSpace: 'nowrap', opacity: (loading || otp.length !== 6) ? 0.7 : 1 }}
              >
                <Lock size={15} />
                {loading
                  ? (locale === 'th' ? 'กำลังตรวจสอบ...' : 'Verifying…')
                  : (locale === 'th' ? 'ยืนยัน' : 'Verify')}
              </button>
            </div>

            {error && <ErrorBanner message={error} />}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <button
                className="btn-ghost"
                style={{ fontSize: 14, opacity: cooldown > 0 ? 0.4 : 1 }}
                disabled={cooldown > 0}
                onClick={async () => {
                  setOtp('')
                  setError(null)
                  await handleRequestOtp()
                }}
              >
                <RefreshCw size={13} />
                {cooldown > 0
                  ? (locale === 'th' ? `ส่งรหัสใหม่ใน ${cooldown}ว` : `Resend in ${cooldown}s`)
                  : (locale === 'th' ? 'ส่งรหัสใหม่' : 'Resend code')}
              </button>
              <span style={{ color: 'var(--text3)', fontSize: 13 }}>·</span>
              <button className="btn-ghost" style={{ fontSize: 14 }} onClick={handleReset}>
                {locale === 'th' ? 'ค้นหาออเดอร์อื่น' : 'Search another order'}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: order details ───────────────────────────────────── */}
        {step === 'verified' && order && (
          <div>
            {/* Header */}
            <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>
                    {locale === 'th' ? 'เลขออเดอร์' : 'Order ID'}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: 1 }}>{order.id}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <StatusIcon s={order.status} />
                  <span style={{
                    fontSize: 16, fontWeight: 600,
                    color: order.status === 'delivered' ? 'var(--green)'
                         : order.status === 'shipping'  ? 'var(--orange)'
                         : order.status === 'cancelled' ? 'var(--red)' : 'var(--text2)',
                  }}>
                    {statusLabel(order.status, locale)}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text3)' }}>
                {new Date(order.created_at).toLocaleString(locale === 'th' ? 'th-TH' : 'en-GB')}
              </div>
            </div>

            {/* Progress */}
            {order.status !== 'cancelled' && (
              <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {STATUS_STEPS.map((s, i) => {
                    const currentIdx = STATUS_STEPS.indexOf(order.status)
                    const done   = i <= currentIdx
                    const active = i === currentIdx
                    return (
                      <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                        {i > 0 && (
                          <div style={{
                            position: 'absolute', left: '-50%', top: 14, width: '100%', height: 2,
                            background: i <= currentIdx ? 'var(--green)' : 'var(--border2)',
                          }} />
                        )}
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', zIndex: 1,
                          background: done ? 'var(--green)' : 'var(--bg3)',
                          border: `2px solid ${done ? 'var(--green)' : 'var(--border2)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {done
                            ? <Check size={14} color="#000" />
                            : <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border2)', display: 'block' }} />}
                        </div>
                        <span style={{ fontSize: 12, color: active ? 'var(--green)' : done ? 'var(--text2)' : 'var(--text3)', marginTop: 6, textAlign: 'center', fontWeight: active ? 600 : 400 }}>
                          {statusLabel(s, locale)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Items */}
            <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 14 }}>
              <h3 style={{ fontSize: 16, marginBottom: 12, fontWeight: 700 }}>
                {locale === 'th' ? 'รายการสินค้า' : 'Items'}
              </h3>
              {(order.items as OrderItem[]).map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 13, color: 'var(--text3)' }}>{item.code}</div>
                    <div style={{ fontSize: 15 }}>
                      {locale === 'th' ? item.nameTh || item.name : item.name || item.nameTh}
                      {item.color ? <span style={{ color: 'var(--text3)', fontSize: 13 }}> · {item.color}</span> : null}
                      {' '}× {item.quantity}
                    </div>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--green)', fontFamily: 'var(--font-display)', flexShrink: 0 }}>
                    ฿{(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text2)' }}>
                  <span>{locale === 'th' ? 'ยอดสินค้า' : 'Subtotal'}</span>
                  <span>฿{order.subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text2)' }}>
                  <span>{locale === 'th' ? 'ค่าจัดส่ง' : 'Shipping'}</span>
                  <span>{order.shipping_fee === 0 ? (locale === 'th' ? 'ฟรี' : 'Free') : `฿${order.shipping_fee}`}</span>
                </div>
                {order.cod_fee > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text2)' }}>
                    <span>{locale === 'th' ? 'ค่าเก็บเงินปลายทาง' : 'COD fee'}</span>
                    <span>฿{order.cod_fee}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 700, paddingTop: 6, borderTop: '0.5px solid var(--border)' }}>
                  <span>{locale === 'th' ? 'รวมทั้งหมด' : 'Total'}</span>
                  <span style={{ color: 'var(--green)', fontFamily: 'var(--font-display)' }}>฿{order.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Shipping */}
            <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, marginBottom: 12, fontWeight: 700 }}>
                {locale === 'th' ? 'ข้อมูลจัดส่ง' : 'Shipping'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 15, color: 'var(--text2)' }}>
                <div>
                  <span style={{ color: 'var(--text3)', fontSize: 13 }}>{locale === 'th' ? 'ผู้รับ' : 'Recipient'} </span>
                  {order.recipient_name}
                </div>
                <div>
                  <span style={{ color: 'var(--text3)', fontSize: 13 }}>{locale === 'th' ? 'ที่อยู่' : 'Address'} </span>
                  {order.recipient_address}
                </div>
                <div>
                  <span style={{ color: 'var(--text3)', fontSize: 13 }}>{locale === 'th' ? 'ขนส่ง' : 'Carrier'} </span>
                  {(SHIPPING_LABEL[order.shipping_method] ?? {})[locale] ?? order.shipping_method}
                </div>
                {order.tracking_no ? (
                  <div>
                    <span style={{ color: 'var(--text3)', fontSize: 13 }}>{locale === 'th' ? 'เลขพัสดุ' : 'Tracking'} </span>
                    <span style={{ color: 'var(--green)', fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                      {order.tracking_no}
                    </span>
                    {order.shipping_method === 'kerry' && (
                      <a
                        href={`https://th.kerryexpress.com/en/track/?track=${encodeURIComponent(order.tracking_no)}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ marginLeft: 10, fontSize: 13, color: 'var(--green)', textDecoration: 'underline' }}
                      >
                        {locale === 'th' ? 'ติดตามพัสดุ Kerry →' : 'Track on Kerry →'}
                      </a>
                    )}
                    {order.shipping_method === 'flash' && (
                      <a
                        href={`https://www.flashexpress.co.th/tracking/?se=${encodeURIComponent(order.tracking_no)}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ marginLeft: 10, fontSize: 13, color: 'var(--green)', textDecoration: 'underline' }}
                      >
                        {locale === 'th' ? 'ติดตามพัสดุ Flash →' : 'Track on Flash →'}
                      </a>
                    )}
                    {order.shipping_method !== 'kerry' && order.shipping_method !== 'flash' && order.shipping_method !== 'pickup' && (
                      <a
                        href={`https://track.aftership.com/${encodeURIComponent(order.tracking_no)}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ marginLeft: 10, fontSize: 13, color: 'var(--green)', textDecoration: 'underline' }}
                      >
                        {locale === 'th' ? 'ติดตามพัสดุ →' : 'Track shipment →'}
                      </a>
                    )}
                  </div>
                ) : (
                  <div style={{ color: 'var(--text3)', fontSize: 14 }}>
                    {locale === 'th' ? 'รอเลขพัสดุ' : 'Tracking number pending'}
                  </div>
                )}
              </div>
            </div>

            {/* Vertical Status Timeline */}
            <OrderTimeline order={order} locale={locale} />

            <button className="btn-ghost" onClick={handleReset} style={{ fontSize: 15, marginTop: 8 }}>
              {locale === 'th' ? '← ค้นหาออเดอร์อื่น' : '← Search another order'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Status timeline helpers ────────────────────────────────────────────────
const STATUS_META: Record<OrderStatus, {
  iconDone: React.ReactNode
  colorDone: string
  labelTh: string
  labelEn: string
  descTh: string
  descEn: string
}> = {
  pending: {
    iconDone: <Clock size={16} />,
    colorDone: 'var(--text3)',
    labelTh: 'รอชำระเงิน',
    labelEn: 'Pending Payment',
    descTh: 'ออเดอร์ถูกบันทึกแล้ว รอการชำระเงินจากคุณ',
    descEn: 'Order received — waiting for your payment.',
  },
  paid: {
    iconDone: <Package size={16} />,
    colorDone: 'var(--green)',
    labelTh: 'ยืนยันการชำระแล้ว',
    labelEn: 'Payment Confirmed',
    descTh: 'ร้านได้รับการชำระเงินแล้ว กำลังเตรียมจัดส่งสินค้า',
    descEn: 'Payment received — we are preparing your order.',
  },
  shipping: {
    iconDone: <Truck size={16} />,
    colorDone: 'var(--orange)',
    labelTh: 'กำลังจัดส่ง',
    labelEn: 'Shipped',
    descTh: 'สินค้าถูกส่งออกแล้ว ติดตามพัสดุด้วยเลขที่ให้ไว้',
    descEn: 'Your order is on its way — track with the number above.',
  },
  delivered: {
    iconDone: <CheckCircle size={16} />,
    colorDone: 'var(--green)',
    labelTh: 'จัดส่งสำเร็จ',
    labelEn: 'Delivered',
    descTh: 'สินค้าถูกจัดส่งสำเร็จแล้ว ขอบคุณที่ใช้บริการ!',
    descEn: 'Order delivered. Thank you for shopping with us!',
  },
  cancelled: {
    iconDone: <XCircle size={16} />,
    colorDone: 'var(--red)',
    labelTh: 'ยกเลิกแล้ว',
    labelEn: 'Cancelled',
    descTh: 'ออเดอร์นี้ถูกยกเลิกแล้ว',
    descEn: 'This order has been cancelled.',
  },
}

// Steps shown in cancelled state
const CANCEL_STEPS: OrderStatus[] = ['pending', 'cancelled']

function OrderTimeline({ order, locale }: { order: VerifiedOrder; locale: string }) {
  const orderedAt = new Date(order.created_at)
  const steps = order.status === 'cancelled' ? CANCEL_STEPS : STATUS_STEPS

  const currentIdx = steps.indexOf(order.status)
  const fmt = (d: Date) => d.toLocaleString(locale === 'th' ? 'th-TH' : 'en-GB', {
    dateStyle: 'medium', timeStyle: 'short',
  })

  return (
    <div style={{
      background: 'var(--bg2)', border: '0.5px solid var(--border)',
      borderRadius: 12, padding: 20, marginBottom: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <CalendarCheck size={16} color="var(--green)" />
        <h3 style={{ fontSize: 16, fontWeight: 700 }}>
          {locale === 'th' ? 'ไทม์ไลน์ออเดอร์' : 'Order Timeline'}
        </h3>
      </div>

      <div style={{ position: 'relative', paddingLeft: 28 }}>
        {/* Vertical line */}
        <div style={{
          position: 'absolute', left: 9, top: 8, bottom: 8, width: 2,
          background: 'var(--border2)',
        }} />

        {steps.map((s, i) => {
          const meta = STATUS_META[s]
          const done = i <= currentIdx
          const active = i === currentIdx
          const color = done ? meta.colorDone : 'var(--text3)'

          return (
            <div key={s} style={{
              position: 'relative', paddingBottom: i < steps.length - 1 ? 20 : 0,
            }}>
              {/* Dot */}
              <div style={{
                position: 'absolute', left: -28, top: 1,
                width: 20, height: 20, borderRadius: '50%',
                background: done ? meta.colorDone : 'var(--bg3)',
                border: `2px solid ${done ? meta.colorDone : 'var(--border2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: done ? '#fff' : 'var(--text3)',
                zIndex: 1,
              }}>
                {done ? <Check size={11} /> : <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--border2)', display: 'block' }} />}
              </div>

              {/* Content */}
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 15, fontWeight: active ? 700 : 500, color: active ? color : (done ? 'var(--text)' : 'var(--text3)') }}>
                    {locale === 'th' ? meta.labelTh : meta.labelEn}
                  </span>
                  {active && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '1px 7px', borderRadius: 999,
                      background: meta.colorDone, color: '#fff',
                    }}>
                      {locale === 'th' ? 'ปัจจุบัน' : 'CURRENT'}
                    </span>
                  )}
                </div>

                {/* Timestamp: only order placed (pending) has a real timestamp */}
                {s === 'pending' && (
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                    {fmt(orderedAt)}
                  </div>
                )}

                {/* Description for done or active steps */}
                {(done) && (
                  <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 3, lineHeight: 1.5 }}>
                    {locale === 'th' ? meta.descTh : meta.descEn}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 8,
      padding: '10px 14px', borderRadius: 8, marginBottom: 14,
      background: 'rgba(220,38,38,.06)', border: '0.5px solid rgba(220,38,38,.25)',
    }}>
      <XCircle size={14} color="var(--red)" style={{ flexShrink: 0, marginTop: 2 }} />
      <p style={{ fontSize: 14, color: 'var(--red)', lineHeight: 1.5 }}>{message}</p>
    </div>
  )
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <div className="section">
        <div className="container" style={{ maxWidth: 640, color: 'var(--text3)' }}>
          <div style={{ height: 40, background: 'var(--bg3)', borderRadius: 8, maxWidth: 300, marginBottom: 24 }} />
          <div style={{ height: 52, background: 'var(--bg3)', borderRadius: 10, marginBottom: 16 }} />
        </div>
      </div>
    }>
      <OrderContent />
    </Suspense>
  )
}
