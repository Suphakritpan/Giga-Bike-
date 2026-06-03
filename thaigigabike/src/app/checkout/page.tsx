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

export default function CheckoutPage() {
  const { items, totalPrice, clear } = useCart()
  const { t, locale } = useLang()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [shipping, setShipping] = useState('kerry')
  const [payment, setPayment] = useState('transfer')
  const [slipFile, setSlipFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  const selectedShipping = SHIPPING.find(s => s.id === shipping)!
  const codFee = payment === 'cod' ? 50 : 0
  const grandTotal = totalPrice + selectedShipping.price + codFee

  const validate = () => {
    const e: Record<string, boolean> = {}
    if (!form.name.trim()) e.name = true
    if (!form.phone.trim()) e.phone = true
    if (!form.address.trim()) e.address = true
    if (payment === 'transfer' && !slipFile) e.slip = true
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSubmitting(true)
    await new Promise(r => setTimeout(r, 1200))
    const orderId = 'GGB-' + Date.now().toString().slice(-6)
    clear()
    router.push(`/order?id=${orderId}&status=pending`)
  }

  const inputStyle = (field: string) => ({
    ...{} as React.CSSProperties,
    borderColor: errors[field] ? 'var(--red)' : undefined,
  })

  return (
    <div className="section">
      <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>

        {/* Form */}
        <div>
          <h1 style={{ fontSize: 28, marginBottom: 24 }}>{t.checkout.title}</h1>

          {/* Recipient */}
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, marginBottom: 16 }}>
              <User size={15} color="var(--green)" /> {t.checkout.recipientInfo}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>{t.checkout.fullName} *</label>
                <input className="input" style={inputStyle('name')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={locale === 'th' ? 'กรอกชื่อ' : 'Your name'} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>{t.checkout.phone} *</label>
                <input className="input" style={inputStyle('phone')} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="08x-xxx-xxxx" />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>{t.checkout.address} *</label>
              <textarea className="input" style={{ ...inputStyle('address'), height: 72, resize: 'none' }} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder={t.checkout.addressPlaceholder} />
            </div>
          </div>

          {/* Shipping */}
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, marginBottom: 16 }}>
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
                <span style={{ flex: 1, fontSize: 13, color: shipping === s.id ? 'var(--text)' : 'var(--text2)' }}>
                  {locale === 'th' ? s.labelTh : s.labelEn}
                </span>
                <span style={{ fontSize: 13, fontWeight: 500, color: s.price === 0 ? 'var(--green)' : 'var(--text)' }}>
                  {s.price === 0 ? (locale === 'th' ? 'ฟรี' : 'Free') : `฿${s.price}`}
                </span>
              </div>
            ))}
          </div>

          {/* Payment */}
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 15, marginBottom: 16 }}>
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
                <span style={{ fontSize: 13, color: payment === opt.id ? 'var(--text)' : 'var(--text2)' }}>{opt.label}</span>
              </div>
            ))}

            {payment === 'transfer' && (
              <div
                onClick={() => fileRef.current?.click()}
                style={{
                  marginTop: 12, border: `1px dashed ${errors.slip ? 'var(--red)' : slipFile ? 'var(--green)' : 'var(--border2)'}`,
                  borderRadius: 8, padding: '20px', textAlign: 'center', cursor: 'pointer',
                  background: slipFile ? 'rgba(34,197,94,.04)' : 'transparent', transition: 'all .15s',
                }}>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setSlipFile(e.target.files?.[0] || null)} />
                {slipFile ? (
                  <div style={{ color: 'var(--green)', fontSize: 13 }}>
                    <Check size={18} style={{ display: 'block', margin: '0 auto 6px' }} />
                    {slipFile.name}
                  </div>
                ) : (
                  <>
                    <Upload size={22} color={errors.slip ? 'var(--red)' : 'var(--text3)'} style={{ display: 'block', margin: '0 auto 8px' }} />
                    <p style={{ fontSize: 13, color: errors.slip ? 'var(--red)' : 'var(--text2)' }}>{t.checkout.uploadSlip}</p>
                    <p style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{t.checkout.uploadSlipSub}</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div style={{ position: 'sticky', top: 72 }}>
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: 15, marginBottom: 16 }}>{t.checkout.orderSummary}</h3>
            {items.map(item => {
              const name = locale === 'th' ? item.product.nameTh : item.product.name
              return (
                <div key={`${item.product.id}-${item.color}`} style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 44, height: 36, background: 'var(--bg3)', border: '0.5px solid var(--border)', borderRadius: 6, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.4 }}>{name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>฿{item.product.price.toLocaleString()} × {item.quantity}</div>
                  </div>
                </div>
              )
            })}
            <hr className="divider" style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>
              <span>{t.cart.subtotal}</span><span>฿{totalPrice.toLocaleString()}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>
              <span>{t.cart.shipping}</span><span>฿{selectedShipping.price}</span>
            </div>
            {payment === 'cod' && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text2)', marginBottom: 6 }}>
                <span>COD fee</span><span>฿50</span>
              </div>
            )}
            <hr className="divider" style={{ margin: '12px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 600, marginBottom: 16 }}>
              <span>{t.cart.total}</span>
              <span style={{ color: 'var(--green)' }}>฿{grandTotal.toLocaleString()}</span>
            </div>

            {Object.keys(errors).length > 0 && (
              <p style={{ fontSize: 12, color: 'var(--red)', marginBottom: 10, textAlign: 'center' }}>
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
            <p style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center', marginTop: 8, lineHeight: 1.6 }}>
              {t.checkout.confirmNote}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
