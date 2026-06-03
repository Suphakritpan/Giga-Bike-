'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Package, ShoppingBag, TrendingUp, Plus, Edit, Trash2, Download, ChevronDown, Minus, AlertTriangle, CheckCircle, XCircle, Boxes, LogOut } from 'lucide-react'
import { products as initialProducts } from '@/data/products'
import type { Product } from '@/data/products'
import { ProductModal } from '@/components/admin/ProductModal'
import { createClient } from '@/lib/supabase/client'

type OrderStatus = 'pending' | 'paid' | 'shipping' | 'delivered' | 'cancelled'
type Tab = 'products' | 'orders' | 'stock'

const LOW_STOCK_THRESHOLD = 5

const mockOrders = [
  { id: 'GGB-001230', customer: 'สมชาย ใจดี', phone: '081-234-5678', items: 2, total: 12560, status: 'paid' as OrderStatus, date: '2024-01-15' },
  { id: 'GGB-001231', customer: 'Kenji Tanaka', phone: '+81-90-xxxx', items: 1, total: 6000, status: 'shipping' as OrderStatus, date: '2024-01-14' },
  { id: 'GGB-001232', customer: 'นิรันดร์ แสงทอง', phone: '089-xxx-xxxx', items: 3, total: 9800, status: 'pending' as OrderStatus, date: '2024-01-14' },
  { id: 'GGB-001233', customer: 'Max Mueller', phone: '+49-xxx', items: 2, total: 39000, status: 'delivered' as OrderStatus, date: '2024-01-13' },
]

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'badge-gray', paid: 'badge-green', shipping: 'badge-orange',
  delivered: 'badge-green', cancelled: 'badge-red',
}
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'รอชำระ', paid: 'ชำระแล้ว', shipping: 'กำลังส่ง',
  delivered: 'สำเร็จ', cancelled: 'ยกเลิก',
}

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<Tab>('products')
  const [orders, setOrders] = useState(mockOrders)
  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [loadingProducts, setLoadingProducts] = useState(true)

  // modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  // stock editing
  const [editingStock, setEditingStock] = useState<string | null>(null)
  const [stockInput, setStockInput] = useState('')

  // ─── Load products from Supabase (fallback to static data) ───
  const loadProducts = useCallback(async () => {
    setLoadingProducts(true)
    const { data, error } = await supabase.from('products').select('*').order('created_at')
    if (!error && data && data.length > 0) {
      setProducts(data.map((r: Record<string, unknown>) => ({
        id: r.id as string,
        code: r.code as string,
        name: r.name as string,
        nameTh: r.name_th as string,
        price: r.price as number,
        category: r.category as string,
        bikeModels: r.bike_models as string[],
        colors: r.colors as string[],
        inStock: r.in_stock as boolean,
        stockCount: r.stock_count as number,
        material: r.material as string,
        description: r.description as string,
        descriptionTh: r.description_th as string,
        images: r.images as string[],
        featured: r.featured as boolean,
      })))
    }
    setLoadingProducts(false)
  }, [supabase])

  useEffect(() => { loadProducts() }, [loadProducts])

  // ─── CRUD ───
  const handleSave = async (data: Omit<Product, 'id'> & { id?: string }) => {
    const row = {
      id: data.id ?? `p${Date.now()}`,
      code: data.code,
      name: data.name,
      name_th: data.nameTh,
      price: data.price,
      category: data.category,
      bike_models: data.bikeModels,
      colors: data.colors,
      in_stock: data.inStock,
      stock_count: data.stockCount,
      material: data.material,
      description: data.description,
      description_th: data.descriptionTh,
      images: data.images,
      featured: data.featured,
    }
    const { error } = await supabase.from('products').upsert(row)
    if (error) throw new Error(error.message)
    await loadProducts()
  }

  const handleDelete = async (product: Product) => {
    setDeleting(true)
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    if (!error) {
      setProducts(prev => prev.filter(p => p.id !== product.id))
    }
    setDeleteConfirm(null)
    setDeleting(false)
  }

  const openAdd = () => { setEditingProduct(null); setModalOpen(true) }
  const openEdit = (p: Product) => { setEditingProduct(p); setModalOpen(true) }

  // ─── Stock helpers ───
  const adjustStock = async (id: string, delta: number) => {
    const p = products.find(x => x.id === id)
    if (!p) return
    const next = Math.max(0, p.stockCount + delta)
    setProducts(prev => prev.map(x => x.id === id ? { ...x, stockCount: next, inStock: next > 0 } : x))
    await supabase.from('products').update({ stock_count: next, in_stock: next > 0 }).eq('id', id)
  }

  const setStock = async (id: string, value: number) => {
    const count = Math.max(0, isNaN(value) ? 0 : Math.floor(value))
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stockCount: count, inStock: count > 0 } : p))
    await supabase.from('products').update({ stock_count: count, in_stock: count > 0 }).eq('id', id)
  }

  const toggleInStock = async (id: string) => {
    const p = products.find(x => x.id === id)
    if (!p) return
    const next = !p.inStock
    const count = next && p.stockCount === 0 ? 1 : p.stockCount
    setProducts(prev => prev.map(x => x.id === id ? { ...x, inStock: next, stockCount: count } : x))
    await supabase.from('products').update({ in_stock: next, stock_count: count }).eq('id', id)
  }

  const updateOrderStatus = (id: string, status: OrderStatus) =>
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const exportOrders = () => {
    const csv = [
      ['Order ID', 'Customer', 'Phone', 'Items', 'Total', 'Status', 'Date'],
      ...orders.map(o => [o.id, o.customer, o.phone, o.items, o.total, o.status, o.date]),
    ].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'orders.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const exportStock = () => {
    const csv = [
      ['รหัส', 'ชื่อสินค้า', 'สต็อก', 'สถานะ'],
      ...products.map(p => [p.code, p.nameTh, p.stockCount, p.inStock ? 'มีสินค้า' : 'หมด']),
    ].map(row => row.join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'stock.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const outOfStock = products.filter(p => p.stockCount === 0).length
  const lowStock = products.filter(p => p.stockCount > 0 && p.stockCount <= LOW_STOCK_THRESHOLD).length

  const stats = [
    { label: 'สินค้าทั้งหมด', value: products.length, icon: <Package size={16} color="var(--green)" /> },
    { label: 'ออเดอร์วันนี้', value: 4, icon: <ShoppingBag size={16} color="var(--orange)" /> },
    { label: 'ยอดรอดำเนินการ', value: orders.filter(o => o.status === 'pending' || o.status === 'paid').length, icon: <TrendingUp size={16} color="var(--green)" /> },
  ]

  const TABS: { id: Tab; label: string }[] = [
    { id: 'products', label: 'สินค้า' },
    { id: 'stock', label: 'สต็อก' },
    { id: 'orders', label: 'ออเดอร์' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700 }}>
          Thai<span style={{ color: 'var(--green)' }}>Giga</span>Bike <span style={{ color: 'var(--text3)', fontSize: 17, fontWeight: 400 }}>Admin</span>
        </div>
        <button onClick={handleLogout} className="btn-ghost" style={{ fontSize: 16, padding: '6px 12px' }}>
          <LogOut size={14} /> ออกจากระบบ
        </button>
      </div>

      <div style={{ padding: 24 }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, background: 'var(--bg3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{s.value}</div>
                <div style={{ fontSize: 14, color: 'var(--text2)' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)', marginBottom: 20 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '10px 20px', fontSize: 17, fontWeight: 500,
              border: 'none', borderBottom: tab === t.id ? '2px solid var(--green)' : '2px solid transparent',
              background: 'transparent', cursor: 'pointer',
              color: tab === t.id ? 'var(--green)' : 'var(--text2)', position: 'relative',
            }}>
              {t.label}
              {t.id === 'stock' && (outOfStock + lowStock > 0) && (
                <span style={{ position: 'absolute', top: 6, right: 6, width: 7, height: 7, borderRadius: '50%', background: outOfStock > 0 ? 'var(--red)' : 'var(--orange)' }} />
              )}
            </button>
          ))}
        </div>

        {/* ── Products tab ── */}
        {tab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ fontSize: 16, color: 'var(--text2)' }}>{products.length} รายการ</p>
              <button className="btn-primary" style={{ fontSize: 16, padding: '7px 14px' }} onClick={openAdd}>
                <Plus size={14} /> เพิ่มสินค้า
              </button>
            </div>
            {loadingProducts ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text3)', fontSize: 17 }}>กำลังโหลด...</div>
            ) : (
              <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                      {['รหัส', 'ชื่อสินค้า', 'หมวด', 'ราคา', 'สต็อก', 'สถานะ', ''].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 13, color: 'var(--text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p, i) => (
                      <tr key={p.id} style={{ borderBottom: i < products.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                        <td style={{ padding: '10px 14px', fontSize: 14, color: 'var(--text3)', fontFamily: 'var(--font-display)' }}>{p.code}</td>
                        <td style={{ padding: '10px 14px', fontSize: 16, maxWidth: 200 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nameTh}</div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className="badge badge-gray" style={{ fontSize: 13 }}>{p.category}</span>
                        </td>
                        <td style={{ padding: '10px 14px', fontSize: 16, fontWeight: 500, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>฿{p.price.toLocaleString()}</td>
                        <td style={{ padding: '10px 14px', fontSize: 16 }}>
                          <span style={{ color: p.stockCount === 0 ? 'var(--red)' : p.stockCount <= LOW_STOCK_THRESHOLD ? 'var(--orange)' : 'var(--text)' }}>{p.stockCount}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span className={`badge ${p.inStock ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 13 }}>{p.inStock ? 'มีสินค้า' : 'หมด'}</span>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 14 }} onClick={() => openEdit(p)}><Edit size={13} /></button>
                            <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 14, color: 'var(--red)' }} onClick={() => setDeleteConfirm(p)}><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Stock tab ── */}
        {tab === 'stock' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
              {[
                { icon: <CheckCircle size={16} color="var(--green)" />, label: 'มีสินค้า', value: products.filter(p => p.stockCount > LOW_STOCK_THRESHOLD).length, color: 'var(--green)' },
                { icon: <AlertTriangle size={16} color="var(--orange)" />, label: `สต็อกต่ำ (≤${LOW_STOCK_THRESHOLD})`, value: lowStock, color: 'var(--orange)' },
                { icon: <XCircle size={16} color="var(--red)" />, label: 'สินค้าหมด', value: outOfStock, color: 'var(--red)' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, background: 'var(--bg3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)', color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 14, color: 'var(--text2)' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {(outOfStock > 0 || lowStock > 0) && (
              <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {outOfStock > 0 && <div style={{ background: 'rgba(239,68,68,.08)', border: '0.5px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, color: '#f87171' }}><XCircle size={15} /> สินค้าหมด {outOfStock} รายการ — ควรเติมสต็อก</div>}
                {lowStock > 0 && <div style={{ background: 'rgba(249,115,22,.08)', border: '0.5px solid rgba(249,115,22,.3)', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, color: '#fb923c' }}><AlertTriangle size={15} /> สต็อกใกล้หมด {lowStock} รายการ</div>}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 16, color: 'var(--text2)' }}>
                <Boxes size={14} color="var(--green)" />
                {products.length} รายการ · สต็อกรวม {products.reduce((s, p) => s + p.stockCount, 0)} ชิ้น
              </div>
              <button className="btn-ghost" onClick={exportStock} style={{ fontSize: 16 }}><Download size={14} /> Export CSV</button>
            </div>

            <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                    {['รหัส', 'ชื่อสินค้า', 'หมวด', 'จำนวนสต็อก', 'สถานะ'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 13, color: 'var(--text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.slice().sort((a, b) => a.stockCount - b.stockCount).map((p, i, arr) => {
                    const isLow = p.stockCount > 0 && p.stockCount <= LOW_STOCK_THRESHOLD
                    const isEmpty = p.stockCount === 0
                    return (
                      <tr key={p.id} style={{ borderBottom: i < arr.length - 1 ? '0.5px solid var(--border)' : 'none', background: isEmpty ? 'rgba(239,68,68,.03)' : isLow ? 'rgba(249,115,22,.03)' : 'transparent' }}>
                        <td style={{ padding: '12px 14px', fontSize: 14, color: 'var(--text3)', fontFamily: 'var(--font-display)', whiteSpace: 'nowrap' }}>{p.code}</td>
                        <td style={{ padding: '12px 14px', fontSize: 16, maxWidth: 220 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nameTh}</div>
                        </td>
                        <td style={{ padding: '12px 14px' }}><span className="badge badge-gray" style={{ fontSize: 13 }}>{p.category}</span></td>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <button onClick={() => adjustStock(p.id, -1)} style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--bg3)', border: '0.5px solid var(--border2)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><Minus size={13} /></button>
                            {editingStock === p.id ? (
                              <input autoFocus type="number" min={0} max={99999} value={stockInput}
                                onChange={e => setStockInput(e.target.value)}
                                onBlur={() => { setStock(p.id, parseInt(stockInput)); setEditingStock(null) }}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') { setStock(p.id, parseInt(stockInput)); setEditingStock(null) }
                                  if (e.key === 'Escape') setEditingStock(null)
                                }}
                                style={{ width: 64, textAlign: 'center', fontSize: 17, fontWeight: 600, background: 'var(--bg3)', border: '1px solid var(--green)', borderRadius: 6, padding: '4px 6px', color: 'var(--text)', outline: 'none' }}
                              />
                            ) : (
                              <button onClick={() => { setEditingStock(p.id); setStockInput(String(p.stockCount)) }} title="คลิกเพื่อแก้ไข"
                                style={{ width: 64, textAlign: 'center', fontSize: 17, fontWeight: 600, background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 6, padding: '4px 6px', cursor: 'text', color: isEmpty ? 'var(--red)' : isLow ? 'var(--orange)' : 'var(--text)', fontFamily: 'var(--font-display)' }}>
                                {p.stockCount}
                              </button>
                            )}
                            <button onClick={() => adjustStock(p.id, 1)} style={{ width: 28, height: 28, borderRadius: 6, background: 'var(--green)', border: 'none', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><Plus size={13} /></button>
                            {(isEmpty || isLow) && <span style={{ fontSize: 13, color: isEmpty ? 'var(--red)' : 'var(--orange)' }}>{isEmpty ? 'หมด' : 'ใกล้หมด'}</span>}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px' }}>
                          <button onClick={() => toggleInStock(p.id)} className={`badge ${p.inStock ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 13, cursor: 'pointer', border: 'none', fontFamily: 'inherit' }} title="คลิกเพื่อเปลี่ยนสถานะ">
                            {p.inStock ? 'มีสินค้า' : 'หมด'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Orders tab ── */}
        {tab === 'orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <p style={{ fontSize: 16, color: 'var(--text2)' }}>{orders.length} ออเดอร์</p>
              <button className="btn-ghost" onClick={exportOrders} style={{ fontSize: 16 }}><Download size={14} /> Export CSV</button>
            </div>
            <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid var(--border)' }}>
                    {['เลขออเดอร์', 'ลูกค้า', 'รายการ', 'ยอด', 'สถานะ', 'วันที่', 'อัปเดต'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 13, color: 'var(--text3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o, i) => (
                    <tr key={o.id} style={{ borderBottom: i < orders.length - 1 ? '0.5px solid var(--border)' : 'none' }}>
                      <td style={{ padding: '10px 14px', fontSize: 16, fontFamily: 'var(--font-display)', fontWeight: 600 }}>{o.id}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontSize: 16 }}>{o.customer}</div>
                        <div style={{ fontSize: 13, color: 'var(--text3)' }}>{o.phone}</div>
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 16, color: 'var(--text2)' }}>{o.items} รายการ</td>
                      <td style={{ padding: '10px 14px', fontSize: 16, fontWeight: 600, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>฿{o.total.toLocaleString()}</td>
                      <td style={{ padding: '10px 14px' }}><span className={`badge ${STATUS_COLORS[o.status]}`} style={{ fontSize: 13 }}>{STATUS_LABELS[o.status]}</span></td>
                      <td style={{ padding: '10px 14px', fontSize: 14, color: 'var(--text3)' }}>{o.date}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value as OrderStatus)} className="input" style={{ fontSize: 14, padding: '4px 24px 4px 8px', appearance: 'none', width: 'auto', cursor: 'pointer' }}>
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

      {/* Product Modal */}
      {modalOpen && (
        <ProductModal
          product={editingProduct}
          onClose={() => { setModalOpen(false); setEditingProduct(null) }}
          onSave={handleSave}
        />
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 28, maxWidth: 380, width: '100%' }}>
            <h3 style={{ fontSize: 22, marginBottom: 10 }}>ยืนยันการลบสินค้า</h3>
            <p style={{ fontSize: 17, color: 'var(--text2)', marginBottom: 6 }}>
              คุณต้องการลบสินค้า <span style={{ color: 'var(--text)', fontWeight: 600 }}>{deleteConfirm.code} — {deleteConfirm.nameTh}</span> ออกจากระบบ?
            </p>
            <p style={{ fontSize: 14, color: 'var(--red)', marginBottom: 24 }}>การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setDeleteConfirm(null)} disabled={deleting}>ยกเลิก</button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontSize: 17, fontWeight: 600, cursor: 'pointer', opacity: deleting ? 0.7 : 1 }}
              >
                <Trash2 size={15} /> {deleting ? 'กำลังลบ...' : 'ลบสินค้า'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
