'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Upload, Check, User, Truck, CreditCard,
  X, ShoppingCart, AlertCircle, Shield, RefreshCw,
} from 'lucide-react'
import { useCart } from '@/lib/cart'
import { useLang } from '@/lib/lang'
import type { CartItem } from '@/lib/cart'

type ShippingMethod = { id: string; labelTh: string; labelEn: string; price: number }
const SHIPPING: ShippingMethod[] = [
  { id: 'kerry',  labelTh: 'Kerry Express  (2–3 วัน)',  labelEn: 'Kerry Express (2–3 days)',  price: 60 },
  { id: 'flash',  labelTh: 'Flash Express  (1–2 วัน)', labelEn: 'Flash Express (1–2 days)',  price: 80 },
  { id: 'pickup', labelTh: 'รับเองที่ร้าน',             labelEn: 'Pick up at store',          price: 0 },
]

const ALLOWED_SLIP_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SLIP_SIZE = 5 * 1024 * 1024

function isValidThaiPhone(p: string) {
  return /^0[0-9]{8,9}$/.test(p.replace(/[-\s]/g, ''))
}

/* ── Step indicator ─────────────────────────────── */
function Steps({ step }: { step: 1 | 2 | 3 }) {
  const labels = ['ข้อมูล', 'จัดส่ง + ชำระ', 'ยืนยัน']
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 28 }}>
      {labels.map((label, i) => {
        const n = i + 1
        const done    = n < step
        const current = n === step
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center', flex: n < 3 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done ? 'var(--green)' : current ? 'var(--green)' : 'var(--bg3)',
                border: `2px solid ${done || current ? 'var(--green)' : 'var(--border2)'}`,
                color: done || current ? '#fff' : 'var(--text3)', fontSize: 14, fontWeight: 700,
                transition: 'all .3s',
              }}>
                {done ? <Check size={15} /> : n}
              </div>
              <span style={{ fontSize: 12, color: current ? 'var(--green)' : 'var(--text3)', fontWeight: current ? 600 : 400, whiteSpace: 'nowrap' }}>
                {label}
              </span>
            </div>
            {n < 3 && (
              <div style={{ flex: 1, height: 2, background: done ? 'var(--green)' : 'var(--border)', margin: '0 8px', marginTop: -16, transition: 'background .3s' }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ── Order item row ─────────────────────────────── */
function OrderItem({ item, locale }: { item: CartItem; locale: string }) {
  const [imgErr, setImgErr] = useState(false)
  const name  = locale === 'th' ? item.product.nameTh : item.product.name
  const thumb = item.product.images?.[0]
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'flex-start' }}>
      <div style={{ width: 52, height: 44, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--bg3)', border: '0.5px solid var(--border)' }}>
        {thumb && !imgErr
          ? <img src={thumb} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={() => setImgErr(true)} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ShoppingCart size={14} color="var(--text3)" /></div>
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
          {item.product.code}{item.color ? ` · ${item.color}` : ''}
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>
          ฿{(item.product.price * item.quantity).toLocaleString()}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>×{item.quantity}</div>
      </div>
    </div>
  )
}

/* ── Field wrapper ──────────────────────────────── */
function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 14, color: 'var(--text2)', marginBottom: 6, fontWeight: 500 }}>
        {label}
      </label>
      {children}
      {error && (
        <p style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: 'var(--red)', marginTop: 5 }}>
          <AlertCircle size={13} /> {error}
        </p>
      )}
    </div>
  )
}

/* ── Main page ──────────────────────────────────── */
export default function CheckoutPage() {
  const { items, totalPrice, clear } = useCart()
  const { t, locale } = useLang()
  const router    = useRouter()
  const fileRef   = useRef<HTMLInputElement>(null)

  const [form, setForm]       = useState({ name: '', phone: '', address: '' })
  const [shipping, setShipping] = useState('kerry')
  const [payment, setPayment]   = useState('transfer')
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const [slipError, setSlipError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors]    = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)

  const selectedShipping = SHIPPING.find(s => s.id === shipping)!
  const codFee    = payment === 'cod' ? 50 : 0
  const grandTotal = totalPrice + selectedShipping.price + codFee

  /* ── Empty cart guard ─── */
  if (items.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '96px 0' }}>
        <ShoppingCart size={52} color="var(--text3)" style={{ display: 'block', margin: '0 auto 20px' }} />
        <h2 style={{ fontSize: 26, marginBottom: 8 }}>
          {locale === 'th' ? 'ตะกร้าว่างอยู่' : 'Your cart is empty'}
        </h2>
        <p style={{ color: 'var(--text2)', marginBottom: 28, fontSize: 16 }}>
          {locale === 'th'
            ? 'เพิ่มสินค้าลงตะกร้าก่อนดำเนินการชำระเงิน'
            : 'Add items to your cart before checking out'}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/products" className="btn-primary" style={{ textDecoration: 'none' }}>
            {locale === 'th' ? 'เลือกสินค้า' : 'Browse Products'}
          </Link>
          <a href="https://line.me/ti/p/~thaigigabike" target="_blank" rel="noopener"
            className="btn-outline" style={{ textDecoration: 'none' }}>
            {locale === 'th' ? 'สั่งทาง LINE' : 'Order via LINE'}
          </a>
        </div>
      </div>
    )
  }

  /* ── Validation ─── */
  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim())    e.name    = locale === 'th' ? 'กรุณากรอกชื่อ'        : 'Name is required'
    if (!form.phone.trim()) {
      e.phone = locale === 'th' ? 'กรุณากรอกเบอร์โทร' : 'Phone is required'
    } else if (!isValidThaiPhone(form.phone)) {
      e.phone = locale === 'th' ? 'เบอร์โทรไม่ถูกต้อง (เช่น 081-234-5678)' : 'Invalid phone number'
    }
    if (!form.address.trim()) e.address  = locale === 'th' ? 'กรุณากรอกที่อยู่'    : 'Address is required'
    if (payment === 'transfer' && !slipFile) e.slip = locale === 'th' ? 'กรุณาแนบสลิป' : 'Payment slip required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  /* ── Submit ─── */
  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    setApiError(null)

    const fd = new FormData()
    fd.append('name', form.name)
    fd.append('phone', form.phone)
    fd.append('address', form.address)
    fd.append('shippingMethod', shipping)
    fd.append('shippingFee', String(selectedShipping.price))
    fd.append('paymentMethod', payment)
    fd.append('items', JSON.stringify(items.map(i => ({
      productId: i.product.id, code: i.product.code,
      name: i.product.name,   nameTh: i.product.nameTh,
      price: i.product.price, quantity: i.quantity, color: i.color,
    }))))
    fd.append('subtotal', String(totalPrice))
    fd.append('codFee', String(codFee))
    fd.append('total', String(grandTotal))
    if (slipFile) fd.append('slip', slipFile)

    try {
      const res  = await fetch('/api/orders', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setApiError(data.error ?? (locale === 'th' ? 'เกิดข้อผิดพลาด' : 'Something went wrong'))
        setSubmitting(false)
        return
      }
      clear()
      router.push(`/order?id=${data.orderId}`)
    } catch {
      setApiError(locale === 'th' ? 'ไม่สามารถเชื่อมต่อได้ ลองใหม่อีกครั้ง' : 'Connection error, please retry')
      setSubmitting(false)
    }
  }

  /* ── Slip upload handler ─── */
  const handleSlipChange = (file: File | null) => {
    setSlipError(null)
    if (!file) { setSlipFile(null); return }
    if (file.size > MAX_SLIP_SIZE) {
      setSlipError(locale === 'th' ? 'ไฟล์ต้องไม่เกิน 5 MB' : 'File must be under 5 MB')
      return
    }
    if (!ALLOWED_SLIP_TYPES.includes(file.type)) {
      setSlipError(locale === 'th' ? 'รองรับ JPG, PNG, WebP หรือ PDF' : 'JPG, PNG, WebP or PDF only')
      return
    }
    setSlipFile(file)
  }

  const borderErr = (f: string) => errors[f] ? { borderColor: 'var(--red)' } : {}

  return (
    <div className="section">
      <div className="container grid-checkout">

        {/* ── Left — form ──────────────────────────── */}
        <div>
          <h1 style={{ fontSize: 32, marginBottom: 20 }}>{t.checkout.title}</h1>
          <Steps step={1} />

          {/* Recipient */}
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 14 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, marginBottom: 18, color: 'var(--text)' }}>
              <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--green)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={15} color="#fff" />
              </span>
              {t.checkout.recipientInfo}
            </h3>

            <div className="grid-form-2">
              <Field label={`${t.checkout.fullName} *`} error={errors.name}>
                <input className="input" style={borderErr('name')} value={form.name}
                  placeholder={locale === 'th' ? 'ชื่อ-นามสกุล' : 'Full name'}
                  onChange={e => setForm({ ...form, name: e.target.value })} />
              </Field>
              <Field label={`${t.checkout.phone} *`} error={errors.phone}>
                <input className="input" style={borderErr('phone')} value={form.phone}
                  placeholder="08x-xxx-xxxx" inputMode="tel"
                  onChange={e => setForm({ ...form, phone: e.target.value })} />
              </Field>
            </div>

            <Field label={`${t.checkout.address} *`} error={errors.address}>
              <textarea className="input" style={{ ...borderErr('address'), height: 80, resize: 'none' }}
                value={form.address} placeholder={t.checkout.addressPlaceholder}
                onChange={e => setForm({ ...form, address: e.target.value })} />
            </Field>
          </div>

          {/* Shipping */}
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 14, padding: 20, marginBottom: 14 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, marginBottom: 16 }}>
              <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--green)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Truck size={15} color="#fff" />
              </span>
              {t.checkout.shippingMethod}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SHIPPING.map(s => {
                const active = shipping === s.id
                return (
                  <div key={s.id} role="radio" aria-checked={active} tabIndex={0}
                    onClick={() => setShipping(s.id)}
                    onKeyDown={e => e.key === 'Enter' && setShipping(s.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                      border: `1.5px solid ${active ? 'var(--green)' : 'var(--border)'}`,
                      background: active ? 'rgba(34,197,94,.05)' : 'var(--bg3)',
                      transition: 'all .15s',
                    }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${active ? 'var(--green)' : 'var(--border2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {active && <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--green)' }} />}
                    </div>
                    <span style={{ flex: 1, fontSize: 16, color: active ? 'var(--text)' : 'var(--text2)', fontWeight: active ? 500 : 400 }}>
                      {locale === 'th' ? s.labelTh : s.labelEn}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: s.price === 0 ? 'var(--green)' : 'var(--text)', fontFamily: 'var(--font-display)' }}>
                      {s.price === 0 ? (locale === 'th' ? 'ฟรี' : 'Free') : `฿${s.price}`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Payment */}
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 14, padding: 20 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 18, marginBottom: 16 }}>
              <span style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--green)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CreditCard size={15} color="#fff" />
              </span>
              {t.checkout.paymentMethod}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
              {[
                { id: 'transfer', label: t.checkout.bankTransfer },
                { id: 'cod',      label: `${t.checkout.cod} ${t.checkout.codFee}` },
              ].map(opt => {
                const active = payment === opt.id
                return (
                  <div key={opt.id} role="radio" aria-checked={active} tabIndex={0}
                    onClick={() => setPayment(opt.id)}
                    onKeyDown={e => e.key === 'Enter' && setPayment(opt.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
                      border: `1.5px solid ${active ? 'var(--green)' : 'var(--border)'}`,
                      background: active ? 'rgba(34,197,94,.05)' : 'var(--bg3)',
                      transition: 'all .15s',
                    }}>
                    <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${active ? 'var(--green)' : 'var(--border2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {active && <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--green)' }} />}
                    </div>
                    <span style={{ fontSize: 16, color: active ? 'var(--text)' : 'var(--text2)', fontWeight: active ? 500 : 400 }}>{opt.label}</span>
                  </div>
                )
              })}
            </div>

            {/* Bank info (transfer only) */}
            {payment === 'transfer' && (
              <div style={{ marginBottom: 14 }}>
                <div style={{
                  background: 'var(--bg3)', border: '0.5px solid var(--border)',
                  borderRadius: 10, padding: '14px 16px', marginBottom: 12,
                }}>
                  <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                    {locale === 'th' ? 'บัญชีธนาคาร' : 'Bank Account'}
                  </p>
                  {['กสิกรไทย (KBank)', 'ไทยพาณิชย์ (SCB)', 'กรุงไทย (KTB)'].map(bank => (
                    <div key={bank} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '0.5px solid var(--border)', fontSize: 14 }}>
                      <span style={{ color: 'var(--text2)' }}>{bank}</span>
                      <a href="https://line.me/ti/p/~thaigigabike" target="_blank" rel="noopener"
                        style={{ color: 'var(--green)', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>
                        LINE: thaigigabike →
                      </a>
                    </div>
                  ))}
                  <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 10, lineHeight: 1.6 }}>
                    {locale === 'th'
                      ? 'ขอเลขบัญชีผ่าน LINE ก่อนโอน · หลังโอนแนบสลิปด้านล่าง'
                      : 'Request account number via LINE before transferring · Upload slip below after transfer'}
                  </p>
                </div>

                {/* Slip upload */}
                <Field label={`${t.checkout.uploadSlip} *`} error={errors.slip || slipError || undefined}>
                  <div
                    onClick={() => fileRef.current?.click()}
                    style={{
                      border: `1.5px dashed ${errors.slip || slipError ? 'var(--red)' : slipFile ? 'var(--green)' : 'var(--border2)'}`,
                      borderRadius: 10, padding: '20px 16px', textAlign: 'center', cursor: 'pointer',
                      background: slipFile ? 'rgba(34,197,94,.04)' : errors.slip ? 'rgba(220,38,38,.03)' : 'transparent',
                      transition: 'all .15s',
                    }}>
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf"
                      style={{ display: 'none' }}
                      onChange={e => handleSlipChange(e.target.files?.[0] ?? null)} />
                    {slipFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: 'var(--green)' }}>
                        <Check size={18} />
                        <span style={{ fontSize: 15, fontWeight: 500 }}>{slipFile.name}</span>
                        <button onClick={e => { e.stopPropagation(); setSlipFile(null) }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex' }}>
                          <X size={15} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload size={24} color={errors.slip || slipError ? 'var(--red)' : 'var(--text3)'}
                          style={{ display: 'block', margin: '0 auto 8px' }} />
                        <p style={{ fontSize: 15, color: errors.slip || slipError ? 'var(--red)' : 'var(--text2)', fontWeight: 500 }}>
                          {t.checkout.uploadSlip}
                        </p>
                        <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{t.checkout.uploadSlipSub}</p>
                      </>
                    )}
                  </div>
                </Field>
              </div>
            )}
          </div>

          {/* LINE alternative */}
          <div style={{
            marginTop: 14, padding: '14px 18px', borderRadius: 12,
            background: 'rgba(6,199,85,.07)', border: '1px solid rgba(6,199,85,.2)',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{ flex: 1, fontSize: 14, color: 'var(--text2)', lineHeight: 1.5 }}>
              {locale === 'th'
                ? 'ต้องการสั่งทาง LINE? ส่งรหัสสินค้า + ที่อยู่ ทีมงานจะดูแลให้ครับ'
                : 'Prefer to order via LINE? Send your part codes + address and we\'ll handle it.'}
            </div>
            <a href="https://line.me/ti/p/~thaigigabike" target="_blank" rel="noopener"
              style={{ textDecoration: 'none', background: '#06C755', color: '#fff', borderRadius: 8, padding: '8px 16px', fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)', flexShrink: 0 }}>
              LINE
            </a>
          </div>
        </div>

        {/* ── Right — order summary ─────────────────── */}
        <div className="sticky-panel">
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 14, padding: 20 }}>
            <h3 style={{ fontSize: 18, marginBottom: 16, fontWeight: 700 }}>{t.checkout.orderSummary}</h3>

            {/* Items */}
            <div style={{ marginBottom: 12 }}>
              {items.map(item => (
                <OrderItem key={`${item.product.id}-${item.color}`} item={item} locale={locale} />
              ))}
            </div>

            <hr className="divider" style={{ margin: '12px 0' }} />

            {/* Totals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: 'var(--text2)' }}>
                <span>{t.cart.subtotal}</span>
                <span>฿{totalPrice.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: 'var(--text2)' }}>
                <span>{t.cart.shipping}</span>
                <span style={{ color: selectedShipping.price === 0 ? 'var(--green)' : undefined }}>
                  {selectedShipping.price === 0 ? (locale === 'th' ? 'ฟรี' : 'Free') : `฿${selectedShipping.price}`}
                </span>
              </div>
              {payment === 'cod' && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, color: 'var(--text2)' }}>
                  <span>{locale === 'th' ? 'ค่าเก็บเงินปลายทาง' : 'COD fee'}</span>
                  <span>฿50</span>
                </div>
              )}
            </div>

            <hr className="divider" style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 700, marginBottom: 18 }}>
              <span>{t.cart.total}</span>
              <span style={{ color: 'var(--green)', fontFamily: 'var(--font-display)' }}>
                ฿{grandTotal.toLocaleString()}
              </span>
            </div>

            {/* Errors */}
            {(apiError || Object.keys(errors).length > 0) && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'rgba(220,38,38,.06)', border: '0.5px solid rgba(220,38,38,.25)', marginBottom: 14 }}>
                <AlertCircle size={15} color="var(--red)" style={{ flexShrink: 0, marginTop: 2 }} />
                <p style={{ fontSize: 14, color: 'var(--red)', lineHeight: 1.5 }}>
                  {apiError || t.checkout.required}
                </p>
              </div>
            )}

            <button
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', opacity: submitting ? 0.7 : 1, fontSize: 20 }}
              onClick={handleSubmit}
              disabled={submitting}
              aria-busy={submitting}
            >
              {submitting
                ? (locale === 'th' ? 'กำลังส่ง...' : 'Processing...')
                : `${t.checkout.confirm} →`}
            </button>

            <p style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', marginTop: 10, lineHeight: 1.6 }}>
              {t.checkout.confirmNote}
            </p>

            {/* Trust signals */}
            <div style={{ marginTop: 18, paddingTop: 14, borderTop: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: <Shield size={14} color="var(--green)" />, text: locale === 'th' ? 'สินค้าเสียหายจากการส่ง เปลี่ยนใหม่ทันที' : 'Damaged in transit? We replace it immediately' },
                { icon: <Truck size={14} color="var(--green)" />, text: locale === 'th' ? 'จัดส่งภายใน 3 วัน · EMS ฟรีสำหรับขายปลีก' : 'Ships within 3 days · Free EMS for retail' },
                { icon: <RefreshCw size={14} color="var(--green)" />, text: locale === 'th' ? 'คืนสินค้าได้ภายใน 7 วัน หากชิ้นงานผิดพลาด' : 'Return within 7 days for manufacturing defects' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text3)', lineHeight: 1.5 }}>
                  <span style={{ marginTop: 2, flexShrink: 0 }}>{s.icon}</span>
                  {s.text}
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
