'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, Truck, CheckCircle, XCircle, Clock, ChevronRight, RotateCcw } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { useCart } from '@/lib/cart'
import { getProductById } from '@/data/products'

type OrderStatus = 'pending' | 'paid' | 'shipping' | 'delivered' | 'cancelled'
type OrderItem = { productId: string; code: string; name: string; nameTh: string; price: number; quantity: number; color: string }
type Order = {
  id: string; status: OrderStatus; created_at: string; items: OrderItem[]
  subtotal: number; cod_fee: number; total: number; shipping_method: string; shipping_fee: number; tracking_no: string | null
}

const STATUS_ICON: Record<OrderStatus, React.ReactNode> = {
  pending: <Clock size={14} />, paid: <Package size={14} />, shipping: <Truck size={14} />,
  delivered: <CheckCircle size={14} />, cancelled: <XCircle size={14} />,
}
const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: 'var(--text3)', paid: 'var(--green)', shipping: 'var(--orange)', delivered: 'var(--green)', cancelled: 'var(--red)',
}

export default function AccountOrdersPage() {
  const { t, locale } = useLang()
  const { add } = useCart()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/account/orders').then(r => r.json())
      .then(d => setOrders(d.orders ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statusLabel = (s: OrderStatus) => {
    const th: Record<OrderStatus, string> = { pending: 'รอชำระ', paid: 'ชำระแล้ว', shipping: 'กำลังส่ง', delivered: 'สำเร็จ', cancelled: 'ยกเลิก' }
    const en: Record<OrderStatus, string> = { pending: 'Pending', paid: 'Paid', shipping: 'Shipped', delivered: 'Delivered', cancelled: 'Cancelled' }
    return locale === 'th' ? th[s] : en[s]
  }

  const reorder = (order: Order) => {
    order.items?.forEach(it => {
      const p = getProductById(it.productId)
      if (p) for (let i = 0; i < it.quantity; i++) add(p, it.color)
    })
  }

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 20 }}>{t.account.orders}</h1>

      {loading ? (
        <div style={{ color: 'var(--text3)', padding: 40, textAlign: 'center' }}>...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text3)' }}>
          <Package size={40} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.4 }} />
          {t.account.empty}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {orders.map(o => (
            <div key={o.id} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-display)', letterSpacing: .5 }}>{o.id}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{new Date(o.created_at).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB', { dateStyle: 'medium' })}</div>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: STATUS_COLOR[o.status], fontWeight: 600, fontSize: 14 }}>
                  {STATUS_ICON[o.status]} {statusLabel(o.status)}
                </span>
              </div>
              <div style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 10 }}>
                {o.items?.length ?? 0} {locale === 'th' ? 'รายการ' : 'items'} · <span style={{ color: 'var(--green)', fontWeight: 700, fontFamily: 'var(--font-display)' }}>฿{o.total.toLocaleString()}</span>
                {o.tracking_no && <span style={{ marginLeft: 8, color: 'var(--text3)' }}>· {o.tracking_no}</span>}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Link href={`/account/orders/${encodeURIComponent(o.id)}`} className="btn-ghost" style={{ fontSize: 13, padding: '5px 12px' }}>
                  {locale === 'th' ? 'รายละเอียด' : 'Details'} <ChevronRight size={13} />
                </Link>
                <button onClick={() => reorder(o)} className="btn-ghost" style={{ fontSize: 13, padding: '5px 12px' }}>
                  <RotateCcw size={13} /> {locale === 'th' ? 'สั่งซื้อซ้ำ' : 'Reorder'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
