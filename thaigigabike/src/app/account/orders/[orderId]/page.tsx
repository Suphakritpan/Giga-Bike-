'use client'
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Printer, FileText, XCircle, RotateCcw, Truck } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { useCart } from '@/lib/cart'
import { getProductById } from '@/data/products'
import { SkeletonList, EmptyState } from '@/components/ui'

type OrderItem = { productId: string; code: string; name: string; nameTh: string; price: number; quantity: number; color: string }
type Order = {
  id: string; status: string; created_at: string; recipient_name: string; recipient_phone: string; recipient_address: string
  shipping_method: string; shipping_fee: number; payment_method: string; items: OrderItem[]
  subtotal: number; cod_fee: number; total: number; tracking_no: string | null
}

export default function OrderDetailPage() {
  const params = useParams()
  const orderId = params.orderId as string
  const { t, locale } = useLang()
  const { add } = useCart()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [showTax, setShowTax] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const d = await fetch(`/api/account/orders/${encodeURIComponent(orderId)}`).then(r => r.json()).catch(() => ({}))
    setOrder(d.order ?? null)
    setLoading(false)
  }, [orderId])
  useEffect(() => { load() }, [load])

  const cancel = async () => {
    if (!confirm(locale === 'th' ? 'ยืนยันยกเลิกออเดอร์?' : 'Cancel this order?')) return
    setCancelling(true)
    const res = await fetch(`/api/account/orders/${encodeURIComponent(orderId)}/cancel`, { method: 'POST' })
    setCancelling(false)
    if (res.ok) load()
    else { const e = await res.json(); alert(e.error) }
  }

  const reorder = () => {
    order?.items?.forEach(it => {
      const p = getProductById(it.productId)
      if (p) for (let i = 0; i < it.quantity; i++) add(p, it.color)
    })
    alert(locale === 'th' ? 'เพิ่มลงตะกร้าแล้ว' : 'Added to cart')
  }

  if (loading) return <SkeletonList rows={3} height={120} />
  if (!order) {
    return (
      <EmptyState
        title={t.account.empty}
        action={<Link href="/account/orders" className="btn-ghost" style={{ fontSize: 14 }}>← {t.account.orders}</Link>}
      />
    )
  }

  const canCancel = ['pending', 'paid'].includes(order.status)

  return (
    <div>
      <Link href="/account/orders" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 14, color: 'var(--text2)', textDecoration: 'none', marginBottom: 16 }}>
        <ChevronLeft size={15} /> {t.account.orders}
      </Link>

      {/* Printable receipt area */}
      <div id="receipt" style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 14, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)' }}>⚡ ThaiGigaBike</div>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>GIGA BIKE FACTORY</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 800, fontFamily: 'var(--font-display)', letterSpacing: .5 }}>{order.id}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{new Date(order.created_at).toLocaleString(locale === 'th' ? 'th-TH' : 'en-GB')}</div>
          </div>
        </div>

        <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 16, lineHeight: 1.6 }}>
          <strong>{order.recipient_name}</strong> · {order.recipient_phone}<br />
          {order.recipient_address}
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 14 }}>
          <thead><tr style={{ borderBottom: '2px solid var(--border2)' }}>
            <th style={{ textAlign: 'left', fontSize: 12, color: 'var(--text3)', padding: '6px 0' }}>{locale === 'th' ? 'สินค้า' : 'Item'}</th>
            <th style={{ textAlign: 'center', fontSize: 12, color: 'var(--text3)' }}>{locale === 'th' ? 'จำนวน' : 'Qty'}</th>
            <th style={{ textAlign: 'right', fontSize: 12, color: 'var(--text3)' }}>{locale === 'th' ? 'รวม' : 'Total'}</th>
          </tr></thead>
          <tbody>
            {order.items?.map((it, i) => (
              <tr key={i} style={{ borderBottom: '0.5px solid var(--border)' }}>
                <td style={{ fontSize: 14, padding: '8px 0' }}>{locale === 'th' ? it.nameTh || it.name : it.name} <span style={{ color: 'var(--text3)' }}>({it.color})</span></td>
                <td style={{ fontSize: 14, textAlign: 'center' }}>{it.quantity}</td>
                <td style={{ fontSize: 14, textAlign: 'right' }}>฿{(it.price * it.quantity).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 14, color: 'var(--text2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t.cart.subtotal}</span><span>฿{order.subtotal.toLocaleString()}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>{t.cart.shipping}</span><span>{order.shipping_fee === 0 ? (locale === 'th' ? 'ฟรี' : 'Free') : `฿${order.shipping_fee}`}</span></div>
          {order.cod_fee > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>COD</span><span>฿{order.cod_fee}</span></div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, paddingTop: 8, borderTop: '2px solid var(--border2)', marginTop: 4 }}>
            <span>{t.cart.total}</span><span style={{ color: 'var(--green)', fontFamily: 'var(--font-display)' }}>฿{order.total.toLocaleString()}</span>
          </div>
        </div>

        {order.tracking_no && (
          <div style={{ marginTop: 14, fontSize: 14, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Truck size={15} color="var(--green)" /> {locale === 'th' ? 'เลขพัสดุ' : 'Tracking'}: <strong>{order.tracking_no}</strong>
          </div>
        )}
      </div>

      {/* Actions (hidden when printing) */}
      <div className="no-print" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
        <button onClick={() => window.print()} className="btn-ghost" style={{ fontSize: 14 }}>
          <Printer size={15} /> {locale === 'th' ? 'พิมพ์ใบเสร็จ' : 'Print receipt'}
        </button>
        <button onClick={() => setShowTax(true)} className="btn-ghost" style={{ fontSize: 14 }}>
          <FileText size={15} /> {locale === 'th' ? 'ขอใบกำกับภาษี' : 'Tax invoice'}
        </button>
        <button onClick={reorder} className="btn-ghost" style={{ fontSize: 14 }}>
          <RotateCcw size={15} /> {locale === 'th' ? 'สั่งซื้อซ้ำ' : 'Reorder'}
        </button>
        <Link href={`/order?id=${encodeURIComponent(order.id)}`} className="btn-ghost" style={{ fontSize: 14 }}>
          <Truck size={15} /> {locale === 'th' ? 'ติดตามพัสดุ' : 'Track'}
        </Link>
        {canCancel && (
          <button onClick={cancel} disabled={cancelling} className="btn-ghost" style={{ fontSize: 14, color: 'var(--red)' }}>
            <XCircle size={15} /> {cancelling ? '...' : (locale === 'th' ? 'ยกเลิกออเดอร์' : 'Cancel order')}
          </button>
        )}
      </div>

      {showTax && <TaxForm orderId={order.id} onClose={() => setShowTax(false)} />}

      <style>{`
        @media print {
          .no-print, header, footer, aside { display: none !important; }
          #receipt { border: none !important; }
        }
      `}</style>
    </div>
  )
}

function TaxForm({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const { locale } = useLang()
  const [taxId, setTaxId]     = useState('')
  const [company, setCompany] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving]   = useState(false)
  const [done, setDone]       = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const res = await fetch('/api/account/tax-invoice', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId, tax_id: taxId, company, address }),
    })
    setSaving(false)
    if (res.ok) setDone(true)
  }
  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', fontSize: 15, border: '1px solid var(--border2)', borderRadius: 9, background: 'var(--bg3)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--bg)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 440 }}>
        {done ? (
          <div style={{ textAlign: 'center' }}>
            <FileText size={40} color="var(--green)" style={{ display: 'block', margin: '0 auto 12px' }} />
            <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 18 }}>{locale === 'th' ? 'รับคำขอใบกำกับภาษีแล้ว — ทีมงานจะออกให้และส่งทาง email' : 'Tax invoice requested — we will issue and email it to you'}</p>
            <button onClick={onClose} className="btn-primary" style={{ fontSize: 15 }}>OK</button>
          </div>
        ) : (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>{locale === 'th' ? 'ขอใบกำกับภาษี' : 'Request Tax Invoice'}</h2>
            <input style={inp} value={company} onChange={e => setCompany(e.target.value)} placeholder={locale === 'th' ? 'ชื่อบริษัท/บุคคล' : 'Company / name'} required />
            <input style={inp} value={taxId} onChange={e => setTaxId(e.target.value)} placeholder={locale === 'th' ? 'เลขประจำตัวผู้เสียภาษี 13 หลัก' : 'Tax ID'} required />
            <textarea style={{ ...inp, minHeight: 70, resize: 'vertical' }} value={address} onChange={e => setAddress(e.target.value)} placeholder={locale === 'th' ? 'ที่อยู่ออกใบกำกับ' : 'Billing address'} required />
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 1, justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>{saving ? '...' : (locale === 'th' ? 'ส่งคำขอ' : 'Submit')}</button>
              <button type="button" onClick={onClose} className="btn-ghost">{locale === 'th' ? 'ยกเลิก' : 'Cancel'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
