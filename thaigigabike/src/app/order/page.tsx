'use client'
import { Suspense, useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Package, CheckCircle, Truck, XCircle, Clock, Check } from 'lucide-react'
import { useLang } from '@/lib/lang'

type OrderStatus = 'pending' | 'paid' | 'shipping' | 'delivered' | 'cancelled'

type OrderItem = {
  productId: string
  code: string
  name: string
  nameTh: string
  price: number
  quantity: number
  color: string
}

type OrderData = {
  id: string
  status: OrderStatus
  created_at: string
  recipient_name: string
  recipient_phone: string
  recipient_address: string
  shipping_method: string
  shipping_fee: number
  payment_method: string
  items: OrderItem[]
  subtotal: number
  cod_fee: number
  total: number
  slip_url: string | null
  tracking_no: string | null
}

const STATUS_STEPS: OrderStatus[] = ['pending', 'paid', 'shipping', 'delivered']

const SHIPPING_LABEL: Record<string, { th: string; en: string }> = {
  kerry:  { th: 'Kerry Express', en: 'Kerry Express' },
  flash:  { th: 'Flash Express', en: 'Flash Express' },
  pickup: { th: 'รับเองที่ร้าน', en: 'Pick up at store' },
}

function OrderContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t, locale } = useLang()

  const [query, setQuery]       = useState(searchParams.get('id') || '')
  const [order, setOrder]       = useState<OrderData | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading]   = useState(false)

  const fetchOrder = useCallback(async (id: string) => {
    if (!id) return
    setLoading(true)
    setNotFound(false)
    setOrder(null)
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(id)}`)
      if (res.status === 404) {
        setNotFound(true)
      } else if (res.ok) {
        setOrder(await res.json())
      } else {
        setNotFound(true)
      }
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      setQuery(id)
      fetchOrder(id)
    }
  }, [searchParams, fetchOrder])

  const handleSearch = () => {
    const q = query.trim()
    if (!q) return
    router.push(`/order?id=${encodeURIComponent(q)}`)
  }

  const statusLabel = (s: OrderStatus) => t.order.status[s] || s

  const statusIcon = (s: OrderStatus) => {
    if (s === 'delivered') return <CheckCircle size={18} color="var(--green)" />
    if (s === 'shipping')  return <Truck       size={18} color="var(--orange)" />
    if (s === 'cancelled') return <XCircle     size={18} color="var(--red)" />
    if (s === 'paid')      return <Package     size={18} color="var(--green)" />
    return <Clock size={18} color="var(--text3)" />
  }

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 680 }}>
        <h1 style={{ fontSize: 34, marginBottom: 24 }}>{t.order.title}</h1>

        {/* Search */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          <input
            className="input"
            placeholder={t.order.enterOrder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn-primary" onClick={handleSearch} disabled={loading}>
            <Search size={15} /> {t.order.track}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text3)' }}>
            {locale === 'th' ? 'กำลังค้นหา...' : 'Searching...'}
          </div>
        )}

        {/* Not found */}
        {!loading && notFound && (
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <XCircle size={40} color="var(--text3)" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 19, color: 'var(--text2)' }}>
              {locale === 'th' ? 'ไม่พบคำสั่งซื้อนี้' : 'Order not found'}
            </p>
            <p style={{ fontSize: 16, color: 'var(--text3)', marginTop: 6 }}>
              {locale === 'th' ? 'กรุณาตรวจสอบเลขออเดอร์อีกครั้ง' : 'Please check the order ID and try again'}
            </p>
          </div>
        )}

        {/* Order found */}
        {!loading && order && (
          <div>
            {/* Header */}
            <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 2 }}>
                    {locale === 'th' ? 'เลขออเดอร์' : 'Order ID'}
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 600, fontFamily: 'var(--font-display)' }}>{order.id}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {statusIcon(order.status)}
                  <span style={{
                    fontSize: 17, fontWeight: 500,
                    color: order.status === 'delivered' ? 'var(--green)' :
                           order.status === 'shipping'  ? 'var(--orange)' :
                           order.status === 'cancelled' ? 'var(--red)' : 'var(--text2)',
                  }}>
                    {statusLabel(order.status)}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 14, color: 'var(--text3)' }}>
                {new Date(order.created_at).toLocaleString(locale === 'th' ? 'th-TH' : 'en-GB')}
              </div>
            </div>

            {/* Progress steps */}
            {order.status !== 'cancelled' && (
              <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {STATUS_STEPS.map((step, i) => {
                    const currentIdx = STATUS_STEPS.indexOf(order.status)
                    const done   = i <= currentIdx
                    const active = i === currentIdx
                    return (
                      <div key={step} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, position: 'relative' }}>
                        {i > 0 && (
                          <div style={{
                            position: 'absolute', left: '-50%', top: 14, width: '100%', height: 2,
                            background: i <= currentIdx ? 'var(--green)' : 'var(--border2)',
                            transition: 'background .3s',
                          }} />
                        )}
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', zIndex: 1,
                          background: done ? 'var(--green)' : 'var(--bg3)',
                          border: `2px solid ${done ? 'var(--green)' : 'var(--border2)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all .3s',
                        }}>
                          {done
                            ? <Check size={14} color="#000" />
                            : <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border2)', display: 'block' }} />
                          }
                        </div>
                        <span style={{ fontSize: 13, color: active ? 'var(--green)' : done ? 'var(--text2)' : 'var(--text3)', marginTop: 6, textAlign: 'center', fontWeight: active ? 500 : 400 }}>
                          {statusLabel(step)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Items */}
            <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <h3 style={{ fontSize: 17, marginBottom: 12 }}>{locale === 'th' ? 'รายการสินค้า' : 'Items'}</h3>
              {order.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 14, color: 'var(--text3)' }}>{item.code}</div>
                    <div style={{ fontSize: 16 }}>
                      {locale === 'th' ? item.nameTh : item.name} × {item.quantity}
                    </div>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--green)' }}>
                    ฿{(item.price * item.quantity).toLocaleString()}
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: 18, fontWeight: 600 }}>
                <span>{t.cart.total}</span>
                <span style={{ color: 'var(--green)' }}>฿{order.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Shipping info */}
            <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20 }}>
              <h3 style={{ fontSize: 17, marginBottom: 12 }}>{locale === 'th' ? 'ข้อมูลการจัดส่ง' : 'Shipping Info'}</h3>
              <div style={{ fontSize: 16, color: 'var(--text2)', lineHeight: 2 }}>
                <div>
                  {locale === 'th' ? 'ขนส่ง' : 'Carrier'}:{' '}
                  {(SHIPPING_LABEL[order.shipping_method] ?? {})[locale] ?? order.shipping_method}
                </div>
                {order.tracking_no ? (
                  <div>
                    {locale === 'th' ? 'เลขพัสดุ' : 'Tracking No.'}:{' '}
                    <span style={{ color: 'var(--green)', fontWeight: 500, fontFamily: 'var(--font-display)' }}>
                      {order.tracking_no}
                    </span>
                  </div>
                ) : (
                  <div style={{ color: 'var(--text3)' }}>
                    {locale === 'th' ? 'รอเลขพัสดุ' : 'Tracking number pending'}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="section"><div className="container" style={{ maxWidth: 680, color: 'var(--text3)' }}>Loading…</div></div>}>
      <OrderContent />
    </Suspense>
  )
}
