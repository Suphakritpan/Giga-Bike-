'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Upload, Check, User, Truck, CreditCard } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { useLang } from '@/lib/lang'

type ShippingMethod = { id: string; labelTh: string; labelEn: string; price: number }
const SHIPPING: ShippingMethod[] = [
  { id: 'kerry', labelTh: 'Kerry Express (2–3 วัน)', labelEn: 'Kerry Express (2–3 days)', price: 60 },
  { id: 'flash', labelTh: 'Flash Express (1–2 วัน)', labelEn: 'Flash Express (1–2 days)', price: 80 },
  { id: 'pickup', labelTh: 'รับเองที่ร้าน', labelEn: 'Pick up at store', price: 0 },
]

const ALLOWED_SLIP_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SLIP_SIZE = 5 * 1024 * 1024

function isValidThaiPhone(phone: string): boolean {
  return /^0[0-9]{8,9}$/.test(phone.replace(/[-\s]/g, ''))
}

export default function CheckoutPage() {
  const { items, totalPrice, clear } = useCart()
  const { t, locale } = useLang()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [shipping, setShipping] = useState('kerry')
  const [payment, setPayment] = useState('transfer')
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const [slipError, setSlipError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string | null>(null)

  const selectedShipping = SHIPPING.find(s => s.id === shipping)!
  const codFee = payment === 'cod' ? 50 : 0
  const grandTotal = totalPrice + selectedShipping.price + codFee

  const handleSlipChange = (file: File | null) => {
    setSlipError(null)
    if (!file) { setSlipFile(null); return }
    if (file.size > MAX_SLIP_SIZE) {
      setSlipError(locale === 'th' ? 'ไฟล์ต้องไม่เกิน 5 MB' : 'File must be under 5 MB')
      setSlipFile(null)
      return
    }
    if (!ALLOWED_SLIP_TYPES.includes(file.type)) {
      setSlipError(locale === 'th' ? 'รองรับ JPG, PNG, WebP หรือ PDF เท่านั้น' : 'Only JPG, PNG, WebP or PDF allowed')
      setSlipFile(null)
      return
    }
    setSlipFile(file)
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = locale === 'th' ? 'กรุณากรอกชื่อ' : 'Name is required'
    if (!form.phone.trim()) {
      e.phone = locale === 'th' ? 'กรุณากรอกเบอร์โทร' : 'Phone is required'
    } else if (!isValidThaiPhone(form.phone)) {
      e.phone = locale === 'th' ? 'เบอร์โทรไม่ถูกต้อง (ตัวอย่าง 081-234-5678)' : 'Invalid phone number'
    }
    if (!form.address.trim()) e.address = locale === 'th' ? 'กรุณากรอกที่อยู่' : 'Address is required'
    if (payment === 'transfer' && !slipFile) e.slip = locale === 'th' ? 'กรุณาแนบสลิปการโอนเงิน' : 'Payment slip required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

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
      productId: i.product.id,
      code:      i.product.code,
      name:      i.product.name,
      nameTh:    i.product.nameTh,
      price:     i.product.price,
      quantity:  i.quantity,
      color:     i.color,
    }))))
    fd.append('subtotal', String(totalPrice))
    fd.append('codFee',   String(codFee))
    fd.append('total',    String(grandTotal))
    if (slipFile) fd.append('slip', slipFile)

    try {
      const res = await fetch('/api/orders', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        setApiError(data.error ?? (locale === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่' : 'Something went wrong'))
        setSubmitting(false)
        return
      }
      clear()
      router.push(`/order?id=${data.orderId}`)
    } catch {
      setApiError(locale === 'th' ? 'ไม่สามารถเชื่อมต่อได้ กรุณาลองใหม่' : 'Connection error, please try again')
      setSubmitting(false)
    }
  }

  const borderErr = (field: string) =>
    errors[field] ? { borderColor: 'var(--red)' } : {}

  return (
    <div className="section">
      <div className="container grid-checkout">

        {/* Form */}
        <div>
          <h1 style={{ fontSize: 34, marginBottom: 24 }}>{t.checkout.title}</h1>

          {/* Recipient */}
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 18, marginBottom: 16 }}>
              <User size={15} color="var(--green)" /> {t.checkout.recipientInfo}
            </h3>
            <div className="grid-form-2">
              <div>
                <label style={{ fontSize: 14, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>{t.checkout.fullName} *</label>
                <input
                  className="input"
                  style={borderErr('name')}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder={locale === 'th' ? 'ชื่อ-นามสกุล' : 'Full name'}
                />
                {errors.name && <p style={{ fontSize: 13, color: 'var(--red)', marginTop: 4 }}>{errors.name}</p>}
              </div>
              <div>
                <label style={{ fontSize: 14, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>{t.checkout.phone} *</label>
                <input
                  className="input"
                  style={borderErr('phone')}
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="08x-xxx-xxxx"
                />
                {errors.phone && <p style={{ fontSize: 13, color: 'var(--red)', marginTop: 4 }}>{errors.phone}</p>}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 14, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>{t.checkout.address} *</label>
              <textarea
                className="input"
                style={{ ...borderErr('address'), height: 72, resize: 'none' }}
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder={t.checkout.addressPlaceholder}
              />
              {errors.address && <p style={{ fontSize: 13, color: 'var(--red)', marginTop: 4 }}>{errors.address}</p>}
            </div>
          </div>

          {/* Shipping */}
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 18, marginBottom: 16 }}>
              <Truck size={15} color="var(--green)" /> {t.checkout.shippingMethod}
            </h3>
            {SHIPPING.map(s => (
              <div key={s.id} onClick={() => setShipping(s.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                border: `0.5px solid ${shipping === s.id ? 'var(--green)' : 'var(--border)'}`,
                background: shipping === s.id ? 'rgba(34,197,94,.06)' : 'var(--bg3)',
                marginBottom: 8, transition: 'all .15s',
              }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${shipping === s.id ? 'var(--green)' : 'var(--border2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {shipping === s.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />}
                </div>
                <span style={{ flex: 1, fontSize: 16, color: shipping === s.id ? 'var(--text)' : 'var(--text2)' }}>
                  {locale === 'th' ? s.labelTh : s.labelEn}
                </span>
                <span style={{ fontSize: 16, fontWeight: 500, color: s.price === 0 ? 'var(--green)' : 'var(--text)' }}>
                  {s.price === 0 ? (locale === 'th' ? 'ฟรี' : 'Free') : `฿${s.price}`}
                </span>
              </div>
            ))}
          </div>

          {/* Payment */}
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 18, marginBottom: 16 }}>
              <CreditCard size={15} color="var(--green)" /> {t.checkout.paymentMethod}
            </h3>
            {[
              { id: 'transfer', label: t.checkout.bankTransfer },
              { id: 'cod', label: `${t.checkout.cod} ${t.checkout.codFee}` },
            ].map(opt => (
              <div key={opt.id} onClick={() => setPayment(opt.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, cursor: 'pointer',
                border: `0.5px solid ${payment === opt.id ? 'var(--green)' : 'var(--border)'}`,
                background: payment === opt.id ? 'rgba(34,197,94,.06)' : 'var(--bg3)',
                marginBottom: 8, transition: 'all .15s',
              }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${payment === opt.id ? 'var(--green)' : 'var(--border2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {payment === opt.id && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)' }} />}
                </div>
                <span style={{ fontSize: 16, color: payment === opt.id ? 'var(--text)' : 'var(--text2)' }}>{opt.label}</span>
              </div>
            ))}

            {payment === 'transfer' && (
              <div>
                <div
                  onClick={() => fileRef.current?.click()}
                  style={{
                    marginTop: 12,
                    border: `1px dashed ${errors.slip || slipError ? 'var(--red)' : slipFile ? 'var(--green)' : 'var(--border2)'}`,
                    borderRadius: 8, padding: '20px', textAlign: 'center', cursor: 'pointer',
                    background: slipFile ? 'rgba(34,197,94,.04)' : 'transparent', transition: 'all .15s',
                  }}>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    style={{ display: 'none' }}
                    onChange={e => handleSlipChange(e.target.files?.[0] ?? null)}
                  />
                  {slipFile ? (
                    <div style={{ color: 'var(--green)', fontSize: 16 }}>
                      <Check size={18} style={{ display: 'block', margin: '0 auto 6px' }} />
                      {slipFile.name}
                    </div>
                  ) : (
                    <>
                      <Upload size={22} color={errors.slip || slipError ? 'var(--red)' : 'var(--text3)'} style={{ display: 'block', margin: '0 auto 8px' }} />
                      <p style={{ fontSize: 16, color: errors.slip || slipError ? 'var(--red)' : 'var(--text2)' }}>{t.checkout.uploadSlip}</p>
                      <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>{t.checkout.uploadSlipSub}</p>
                    </>
                  )}
                </div>
                {(errors.slip || slipError) && (
                  <p style={{ fontSize: 13, color: 'var(--red)', marginTop: 6 }}>{errors.slip || slipError}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="sticky-panel">
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 18, marginBottom: 16 }}>{t.checkout.orderSummary}</h3>
            {items.map(item => {
              const name = locale === 'th' ? item.product.nameTh : item.product.name
              return (
                <div key={`${item.product.id}-${item.color}`} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 36, background: 'var(--bg3)', border: '0.5px solid var(--border)', borderRadius: 6, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.4 }}>{name}</div>
                    <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>฿{item.product.price.toLocaleString()} × {item.quantity}</div>
                  </div>
                </div>
              )
            })}
            <hr className="divider" style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, color: 'var(--text2)', marginBottom: 6 }}>
              <span>{t.cart.subtotal}</span><span>฿{totalPrice.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, color: 'var(--text2)', marginBottom: 6 }}>
              <span>{t.cart.shipping}</span><span>฿{selectedShipping.price}</span>
            </div>
            {payment === 'cod' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, color: 'var(--text2)', marginBottom: 6 }}>
                <span>{locale === 'th' ? 'ค่าเก็บเงินปลายทาง' : 'COD fee'}</span><span>฿50</span>
              </div>
            )}
            <hr className="divider" style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 19, fontWeight: 600, marginBottom: 16 }}>
              <span>{t.cart.total}</span>
              <span style={{ color: 'var(--green)' }}>฿{grandTotal.toLocaleString()}</span>
            </div>

            {apiError && (
              <p style={{ fontSize: 14, color: 'var(--red)', marginBottom: 10, textAlign: 'center' }}>
                {apiError}
              </p>
            )}
            {Object.keys(errors).length > 0 && !apiError && (
              <p style={{ fontSize: 14, color: 'var(--red)', marginBottom: 10, textAlign: 'center' }}>
                {t.checkout.required}
              </p>
            )}

            <button
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', opacity: submitting ? 0.7 : 1 }}
              onClick={handleSubmit}
              disabled={submitting || items.length === 0}
            >
              {submitting
                ? (locale === 'th' ? 'กำลังส่ง...' : 'Processing...')
                : <>{t.checkout.confirm} →</>
              }
            </button>
            <p style={{ fontSize: 13, color: 'var(--text3)', textAlign: 'center', marginTop: 8, lineHeight: 1.6 }}>
              {t.checkout.confirmNote}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
