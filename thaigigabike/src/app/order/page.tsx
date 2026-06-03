'use client'
import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Search, Package, CheckCircle, Truck, XCircle, Clock, Check } from 'lucide-react'
import { useLang } from '@/lib/lang'

type OrderStatus = 'pending' | 'paid' | 'shipping' | 'delivered' | 'cancelled'

const STATUS_STEPS: OrderStatus[] = ['pending', 'paid', 'shipping', 'delivered']

const mockOrder = {
  id: 'GGB-001234',
  status: 'shipping' as OrderStatus,
  createdAt: '2024-01-15 14:32',
  items: [
    { code: 'G.232', name: 'จานเบรคแต่ง SR 310mm.', qty: 1, price: 6000 },
    { code: 'G.88', name: 'สวิงอาร์มอลูมิเนียม Type 3', qty: 1, price: 6500 },
  ],
  shipping: { method: 'Kerry Express', fee: 60, trackingNo: 'TH123456789TH' },
  payment: 'transfer',
  total: 12560,
  recipient: { name: 'สมชาย ใจดี', phone: '081-xxx-xxxx', address: '123 ถ.สุขุมวิท กรุงเทพฯ 10110' },
}

function OrderContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t, locale } = useLang()
  const [query, setQuery] = useState(searchParams.get('id') || '')
  const [order, setOrder] = useState(() => {
    const id = searchParams.get('id')
    if (!id) return null
    return { ...mockOrder, id, status: (searchParams.get('status') as OrderStatus) || 'pending' }
  })

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      setQuery(id)
      setOrder({ ...mockOrder, id, status: (searchParams.get('status') as OrderStatus) || 'pending' })
    }
  }, [searchParams])

  const handleSearch = () => {
    const q = query.trim()
    if (!q) return
    router.push(`/order?id=${encodeURIComponent(q)}`)
  }

  const statusLabel = (s: OrderStatus) => t.order.status[s] || s

  const statusIcon = (s: OrderStatus) => {
    if (s === 'delivered') return <CheckCircle size={18} color="var(--green)" />
    if (s === 'shipping') return <Truck size={18} color="var(--orange)" />
    if (s === 'cancelled') return <XCircle size={18} color="var(--red)" />
    if (s === 'paid') return <Package size={18} color="var(--green)" />
    return <Clock size={18} color="var(--text3)" />
  }

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 680 }}>
        <h1 style={{ fontSize: 28, marginBottom: 24 }}>{t.order.title}</h1>

        {/* Search */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          <input
            className="input"
            placeholder={t.order.enterOrder}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button className="btn-primary" onClick={handleSearch}>
            <Search size={15} /> {t.order.track}
          </button>
        </div>

        {order && (
          <div>
            {/* Order header */}
            <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>
                    {locale === 'th' ? 'เลขออเดอร์' : 'Order ID'}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-display)' }}>{order.id}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {statusIcon(order.status)}
                  <span style={{
                    fontSize: 14, fontWeight: 500,
                    color: order.status === 'delivered' ? 'var(--green)' :
                           order.status === 'shipping' ? 'var(--orange)' :
                           order.status === 'cancelled' ? 'var(--red)' : 'var(--text2)',
                  }}>
                    {statusLabel(order.status)}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>{order.createdAt}</div>
            </div>

            {/* Progress steps */}
            {order.status !== 'cancelled' && (
              <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  {STATUS_STEPS.map((step, i) => {
                    const currentIdx = STATUS_STEPS.indexOf(order.status)
                    const done = i <= currentIdx
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
                        <span style={{ fontSize: 11, color: active ? 'var(--green)' : done ? 'var(--text2)' : 'var(--text3)', marginTop: 6, textAlign: 'center', fontWeight: active ? 500 : 400 }}>
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
              <h3 style={{ fontSize: 14, marginBottom: 12 }}>{locale === 'th' ? 'รายการสินค้า' : 'Items'}</h3>
              {order.items.map(item => (
                <div key={item.code} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '0.5px solid var(--border)' }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{item.code}</div>
                    <div style={{ fontSize: 13 }}>{item.name} × {item.qty}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--green)' }}>฿{(item.price * item.qty).toLocaleString()}</div>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: 15, fontWeight: 600 }}>
                <span>{t.cart.total}</span>
                <span style={{ color: 'var(--green)' }}>฿{order.total.toLocaleString()}</span>
              </div>
            </div>

            {/* Shipping info */}
            {order.shipping.trackingNo && (
              <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 20 }}>
                <h3 style={{ fontSize: 14, marginBottom: 12 }}>{locale === 'th' ? 'ข้อมูลการจัดส่ง' : 'Shipping Info'}</h3>
                <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 2 }}>
                  <div>{locale === 'th' ? 'ขนส่ง' : 'Carrier'}: {order.shipping.method}</div>
                  <div>{locale === 'th' ? 'เลขพัสดุ' : 'Tracking No.'}: <span style={{ color: 'var(--green)', fontWeight: 500, fontFamily: 'var(--font-display)' }}>{order.shipping.trackingNo}</span></div>
                </div>
              </div>
            )}
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
