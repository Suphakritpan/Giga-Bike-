'use client'
import { useState } from 'react'
import { Package, ShoppingBag, TrendingUp, Plus, Edit, Trash2, Download, ChevronDown } from 'lucide-react'
import { products as initialProducts } from '@/data/products'
import type { Product } from '@/data/products'

type OrderStatus = 'pending' | 'paid' | 'shipping' | 'delivered' | 'cancelled'

const mockOrders = [
  { id: 'GGB-001230', customer: 'สมชาย ใจดี', phone: '081-234-5678', items: 2, total: 12560, status: 'paid' as OrderStatus, date: '2024-01-15' },
  { id: 'GGB-001231', customer: 'Kenji Tanaka', phone: '+81-90-xxxx', items: 1, total: 6000, status: 'shipping' as OrderStatus, date: '2024-01-14' },
  { id: 'GGB-001232', customer: 'นิรันดร์ แสงทอง', phone: '089-xxx-xxxx', items: 3, total: 9800, status: 'pending' as OrderStatus, date: '2024-01-14' },
  { id: 'GGB-001233', customer: 'Max Mueller', phone: '+49-xxx', items: 2, total: 39000, status: 'delivered' as OrderStatus, date: '2024-01-13' },
]

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'badge-gray',
  paid: 'badge-green',
  shipping: 'badge-orange',
  delivered: 'badge-green',
  cancelled: 'badge-red',
}
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'รอชำระ',
  paid: 'ชำระแล้ว',
  shipping: 'กำลังส่ง',
  delivered: 'สำเร็จ',
  cancelled: 'ยกเลิก',
}

export default function AdminPage() {
  const [tab, setTab] = useState<'products' | 'orders'>('products')
  const [orders, setOrders] = useState(mockOrders)
  const [products, setProducts] = useState(initialProducts)

  const stats = [
    { label: 'สินค้าทั้งหมด', value: products.length, icon: <Package size={16} color="var(--green)" /> },
    { label: 'ออเดอร์วันนี้', value: 4, icon: <ShoppingBag size={16} color="var(--orange)" /> },
    { label: 'ยอดรอดำเนินการ', value: orders.filter(o => o.status === 'pending' || o.status === 'paid').length, icon: <TrendingUp size={16} color="var(--green)" /> },
  ]

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
  }

  const exportOrders = () => {
    const csv = [
      ['Order ID', 'Customer', 'Phone', 'Items', 'Total', 'Status', 'Date'],
      ...orders.map(o => [o.id, o.customer, o.phone, o.items, o.total, o.status, o.date]),
    ].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'orders.csv'; a.click()
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Admin header */}
      <div style={{ background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
          Thai<span style={{ color: 'var(--green)' }}>Giga</span>Bike <span style={{ color: 'var(--text3)', fontSize: 14, fontWeight: 400 }}>Admin</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>ระบบหลังบ้าน</div>
      </div>

      <div style={{ padding: 24 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, background: 'var(--bg3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text2)' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, borderBottom: '0.5px solid var(--border)', marginBottom: 20 }}>
          {[{ id: 'products', label: 'สินค้า' }, { id: 'orders', label: 'ออเดอร์' }].map(t => (
            <button key={t.id} onClick={() => setTab(t.id as 'products' | 'orders')} style={{
              padding: '10px 20px', fontSize: 14, fontWeight: 500,
              border: 'none', borderBottom: tab === t.id ? '2px solid var(--green)' : '2px solid transparent',
              background: 'transparent', cursor: 'pointer',
              color: tab === t.id ? 'var(--green)' : 'var(--text2)',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Products tab */}
        {tab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--text2)' }}>{products.length} รายการ</p>
              <button className="btn-primary" style={{ fontSize: 13, padding: '7px 14px' }}>
                <Plus size={14} /> เพิ่มสินค้า
              </button>
            </div>
            <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                    {['รหัส', 'ชื่อสินค้า', 'หมวด', 'ราคา', 'สต็อก', 'สถานะ', ''].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: 'var(--text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: i < products.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-display)' }}>{p.code}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, maxWidth: 200 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nameTh}</div>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span className="badge badge-gray" style={{ fontSize: 11 }}>{p.category}</span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>
                        ฿{p.price.toLocaleString()}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 13 }}>{p.stockCount}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span className={`badge ${p.inStock ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 11 }}>
                          {p.inStock ? 'มีสินค้า' : 'หมด'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 12 }}><Edit size={13} /></button>
                          <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 12, color: 'var(--red)' }}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Orders tab */}
        {tab === 'orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--text2)' }}>{orders.length} ออเดอร์</p>
              <button className="btn-ghost" onClick={exportOrders} style={{ fontSize: 13 }}>
                <Download size={14} /> Export CSV
              </button>
            </div>
            <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                    {['เลขออเดอร์', 'ลูกค้า', 'รายการ', 'ยอด', 'สถานะ', 'วันที่', 'อัปเดต'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: 'var(--text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => (
                    <tr key={o.id} style={{ borderBottom: i < orders.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontFamily: 'var(--font-display)', fontWeight: 600 }}>{o.id}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontSize: 13 }}>{o.customer}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{o.phone}</div>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text2)' }}>{o.items} รายการ</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>
                        ฿{o.total.toLocaleString()}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span className={`badge ${STATUS_COLORS[o.status]}`} style={{ fontSize: 11 }}>
                          {STATUS_LABELS[o.status]}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text3)' }}>{o.date}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <select
                            value={o.status}
                            onChange={e => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                            className="input"
                            style={{ fontSize: 12, padding: '4px 24px 4px 8px', appearance: 'none', width: 'auto', cursor: 'pointer' }}
                          >
                            {(['pending', 'paid', 'shipping', 'delivered', 'cancelled'] as OrderStatus[]).map(s => (
                              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                            ))}
                          </select>
                          <ChevronDown size={12} style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text3)' }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
