'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package, ShoppingBag, TrendingUp, Plus, Edit, Trash2, Download,
  ChevronDown, Minus, AlertTriangle, CheckCircle, XCircle, Boxes,
  LogOut, Search, Zap, Bell,
} from 'lucide-react'
import { products as initialProducts } from '@/data/products'
import type { Product } from '@/data/products'
import { ProductModal } from '@/components/admin/ProductModal'
import { createClient } from '@/lib/supabase/client'

type OrderStatus = 'pending' | 'paid' | 'shipping' | 'delivered' | 'cancelled'
type Tab = 'products' | 'orders' | 'stock'

const LOW_STOCK_THRESHOLD = 5
const PAGE_SIZE = 50

type OrderItem = {
  productId: string; code: string; name: string; nameTh: string
  price: number; quantity: number; color: string
}
type Order = {
  id: string; status: OrderStatus; created_at: string
  recipient_name: string; recipient_phone: string; recipient_address: string
  shipping_method: string; shipping_fee: number; payment_method: string
  items: OrderItem[]; subtotal: number; cod_fee: number; total: number
  slip_url: string | null; tracking_no: string | null
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'badge-gray', paid: 'badge-green', shipping: 'badge-orange',
  delivered: 'badge-green', cancelled: 'badge-red',
}
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'รอชำระ', paid: 'ชำระแล้ว', shipping: 'กำลังส่ง',
  delivered: 'สำเร็จ', cancelled: 'ยกเลิก',
}

/* ── Stat card ─── */
function StatCard({ icon, value, label, color, sub }: { icon: React.ReactNode; value: number | string; label: string; color: string; sub?: string }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color, lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 1 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  )
}

/* ── Alert banner ─── */
function AlertBanner({ type, message }: { type: 'error' | 'warn'; message: string }) {
  const isErr = type === 'error'
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '10px 16px', borderRadius: 8, fontSize: 14,
      background: isErr ? 'rgba(239,68,68,.09)' : 'rgba(249,115,22,.09)',
      border: `0.5px solid ${isErr ? 'rgba(239,68,68,.3)' : 'rgba(249,115,22,.3)'}`,
      color: isErr ? '#ef4444' : '#f97316',
    }}>
      {isErr ? <XCircle size={15} /> : <AlertTriangle size={15} />}
      {message}
    </div>
  )
}

export default function AdminPage() {
  const router  = useRouter()
  const supabase = createClient()

  const [authChecked, setAuthChecked]   = useState(false)
  const [tab, setTab]                   = useState<Tab>('products')
  const [orders, setOrders]             = useState<Order[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [products, setProducts]         = useState<Product[]>(initialProducts)
  const [loadingProducts, setLoadingProducts] = useState(true)

  const [productSearch, setProductSearch] = useState('')
  const [productPage, setProductPage]   = useState(1)
  const [stockSearch, setStockSearch]   = useState('')
  const [stockPage, setStockPage]       = useState(1)
  const [orderSearch, setOrderSearch]   = useState('')

  const [editingTracking, setEditingTracking] = useState<string | null>(null)
  const [trackingInput, setTrackingInput]     = useState('')
  const [savingTracking, setSavingTracking]   = useState(false)

  const [modalOpen, setModalOpen]         = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null)
  const [deleting, setDeleting]           = useState(false)

  const [editingStock, setEditingStock] = useState<string | null>(null)
  const [stockInput, setStockInput]     = useState('')

  // ─── Auth ───
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) router.replace('/admin/login')
      else setAuthChecked(true)
    })
  }, [supabase, router])

  // ─── Load products ───
  const loadProducts = useCallback(async () => {
    setLoadingProducts(true)
    const { data, error } = await supabase.from('products').select('*').order('created_at')
    if (!error && data && data.length > 0) {
      setProducts(data.map((r: Record<string, unknown>) => ({
        id: r.id as string, code: r.code as string,
        name: r.name as string, nameTh: r.name_th as string,
        price: r.price as number, category: r.category as string,
        bikeModels: r.bike_models as string[], colors: r.colors as string[],
        inStock: r.in_stock as boolean, stockCount: r.stock_count as number,
        material: r.material as string, description: r.description as string,
        descriptionTh: r.description_th as string, images: r.images as string[],
        featured: r.featured as boolean, published: (r.published as boolean) ?? true,
        reviewReasons: (r.review_reasons as string[]) ?? [],
      })))
    }
    setLoadingProducts(false)
  }, [supabase])

  // ─── Load orders ───
  const loadOrders = useCallback(async () => {
    setLoadingOrders(true)
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (!error && data) setOrders(data as Order[])
    setLoadingOrders(false)
  }, [supabase])

  useEffect(() => {
    if (!authChecked) return
    loadProducts()
    loadOrders()
  }, [authChecked, loadProducts, loadOrders])

  // ─── CRUD ───
  const handleSave = async (data: Omit<Product, 'id'> & { id?: string }) => {
    const row = {
      id: data.id ?? `p${Date.now()}`, code: data.code, name: data.name,
      name_th: data.nameTh, price: data.price, category: data.category,
      bike_models: data.bikeModels, colors: data.colors, in_stock: data.inStock,
      stock_count: data.stockCount, material: data.material,
      description: data.description, description_th: data.descriptionTh,
      images: data.images, featured: data.featured, published: data.published,
      review_reasons: data.reviewReasons ?? [],
    }
    const { error } = await supabase.from('products').upsert(row)
    if (error) throw new Error(error.message)
    await loadProducts()
  }

  const handleDelete = async (product: Product) => {
    setDeleting(true)
    const { error } = await supabase.from('products').delete().eq('id', product.id)
    if (!error) setProducts(prev => prev.filter(p => p.id !== product.id))
    setDeleteConfirm(null)
    setDeleting(false)
  }

  const openAdd  = () => { setEditingProduct(null); setModalOpen(true) }
  const openEdit = (p: Product) => { setEditingProduct(p); setModalOpen(true) }

  // ─── Stock ───
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

  // ─── Orders ───
  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    await supabase.from('orders').update({ status }).eq('id', id)
  }

  const saveTracking = async (orderId: string) => {
    const no = trackingInput.trim()
    setSavingTracking(true)
    await supabase.from('orders').update({ tracking_no: no || null, status: no ? 'shipping' : undefined }).eq('id', orderId)
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, tracking_no: no || null, status: no ? 'shipping' : o.status } : o))
    setEditingTracking(null)
    setSavingTracking(false)
  }

  const handleLogout = async () => { await supabase.auth.signOut(); router.push('/admin/login') }

  const exportOrders = () => {
    const csv = [
      ['Order ID', 'Customer', 'Phone', 'Items', 'Total', 'Status', 'Tracking', 'Date'],
      ...orders.map(o => [o.id, o.recipient_name, o.recipient_phone, o.items?.length ?? 0, o.total, o.status, o.tracking_no ?? '', new Date(o.created_at).toLocaleDateString('th-TH')]),
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

  // ─── Derived ───
  const outOfStock  = products.filter(p => p.stockCount === 0).length
  const lowStock    = products.filter(p => p.stockCount > 0 && p.stockCount <= LOW_STOCK_THRESHOLD).length
  const pendingCount = orders.filter(o => o.status === 'pending' || o.status === 'paid').length
  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0)

  const filteredProducts = products.filter(p => {
    if (!productSearch) return true
    const q = productSearch.toLowerCase()
    return p.code.toLowerCase().includes(q) || p.nameTh.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)
  })
  const totalProductPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))
  const pagedProducts = filteredProducts.slice((productPage - 1) * PAGE_SIZE, productPage * PAGE_SIZE)

  const filteredStock = products.filter(p => {
    if (!stockSearch) return true
    const q = stockSearch.toLowerCase()
    return p.code.toLowerCase().includes(q) || p.nameTh.toLowerCase().includes(q)
  }).sort((a, b) => a.stockCount - b.stockCount)
  const totalStockPages = Math.max(1, Math.ceil(filteredStock.length / PAGE_SIZE))
  const pagedStock = filteredStock.slice((stockPage - 1) * PAGE_SIZE, stockPage * PAGE_SIZE)

  const filteredOrders = orders.filter(o => {
    if (!orderSearch) return true
    const q = orderSearch.toLowerCase()
    return o.id.toLowerCase().includes(q) || o.recipient_name.toLowerCase().includes(q) || o.recipient_phone.includes(q)
  })

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: 'products', label: 'สินค้า', count: products.length },
    { id: 'stock',    label: 'สต็อก',  count: outOfStock + lowStock > 0 ? outOfStock + lowStock : undefined },
    { id: 'orders',   label: 'ออเดอร์', count: pendingCount > 0 ? pendingCount : undefined },
  ]

  // ─── Loading / Auth check ───
  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
          <div style={{ width: 44, height: 44, border: '3px solid var(--green)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          กำลังตรวจสอบสิทธิ์...
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Top bar ─────────────────────────────── */}
      <div style={{
        background: '#0f0f0f', borderBottom: '1px solid #1f1f1f',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', gap: 16,
        position: 'sticky', top: 60, zIndex: 50,
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={18} color="#22c55e" strokeWidth={2.5} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 19, fontWeight: 800, color: '#fff' }}>
            Thai<span style={{ color: '#22c55e' }}>Giga</span>
            <span style={{ color: '#555', fontWeight: 400, fontSize: 15, marginLeft: 6 }}>Admin</span>
          </span>
        </div>

        {/* Tab pills */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 16 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding: '5px 14px', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              border: 'none', transition: 'all .15s',
              background: tab === t.id ? '#22c55e' : 'transparent',
              color: tab === t.id ? '#000' : '#888',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              {t.label}
              {t.count !== undefined && (
                <span style={{
                  minWidth: 18, height: 18, borderRadius: 9, fontSize: 11, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px',
                  background: t.id === 'stock' ? 'rgba(239,68,68,.8)' : 'rgba(249,115,22,.8)',
                  color: '#fff',
                }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          {(pendingCount > 0) && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#f97316' }}>
              <Bell size={14} /> {pendingCount} ออเดอร์รอดำเนินการ
            </div>
          )}
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
            borderRadius: 8, border: '1px solid #2a2a2a', background: 'transparent',
            color: '#888', fontSize: 13, cursor: 'pointer', transition: 'all .15s',
          }}>
            <LogOut size={13} /> ออกจากระบบ
          </button>
        </div>
      </div>

      <div style={{ padding: '20px 24px' }}>

        {/* ── Stats row ─────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 20 }}>
          <StatCard icon={<Package size={18} color="#22c55e" />} value={products.length} label="สินค้าทั้งหมด" color="#22c55e" sub={`${products.filter(p => p.published).length} เผยแพร่`} />
          <StatCard icon={<ShoppingBag size={18} color="#f97316" />} value={orders.length} label="ออเดอร์ทั้งหมด" color="#f97316" sub={`${pendingCount} รอดำเนินการ`} />
          <StatCard icon={<TrendingUp size={18} color="#22c55e" />} value={`฿${(totalRevenue / 1000).toFixed(0)}K`} label="รายได้รวม" color="#22c55e" sub="ออเดอร์ที่ไม่ยกเลิก" />
          <StatCard icon={<Boxes size={18} color={outOfStock > 0 ? '#ef4444' : '#22c55e'} />} value={outOfStock} label="สินค้าหมดสต็อก" color={outOfStock > 0 ? '#ef4444' : '#22c55e'} sub={`${lowStock} ใกล้หมด`} />
        </div>

        {/* ── Alert banners ─────────────────────── */}
        {(outOfStock > 0 || lowStock > 0 || pendingCount > 0) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
            {outOfStock > 0 && <AlertBanner type="error" message={`สินค้าหมดสต็อก ${outOfStock} รายการ — คลิก "สต็อก" เพื่อจัดการ`} />}
            {lowStock > 0 && <AlertBanner type="warn" message={`สต็อกใกล้หมด ${lowStock} รายการ (≤${LOW_STOCK_THRESHOLD} ชิ้น)`} />}
            {pendingCount > 0 && <AlertBanner type="warn" message={`ออเดอร์รอดำเนินการ ${pendingCount} รายการ — คลิก "ออเดอร์" เพื่อตรวจสอบ`} />}
          </div>
        )}

        {/* ── Products tab ──────────────────────── */}
        {tab === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 360 }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
                <input className="input" style={{ paddingLeft: 30, fontSize: 14 }}
                  placeholder="ค้นหารหัส / ชื่อสินค้า..."
                  value={productSearch}
                  onChange={e => { setProductSearch(e.target.value); setProductPage(1) }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, color: 'var(--text2)' }}>{filteredProducts.length} รายการ</span>
                <button className="btn-primary" style={{ fontSize: 15, padding: '7px 14px' }} onClick={openAdd}>
                  <Plus size={14} /> เพิ่มสินค้า
                </button>
              </div>
            </div>

            {loadingProducts ? (
              <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text3)' }}>
                <div style={{ width: 36, height: 36, border: '3px solid var(--green)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto 12px', animation: 'spin 0.8s linear infinite' }} />
                กำลังโหลดสินค้า...
              </div>
            ) : (
              <>
                <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ background: 'var(--bg3)' }}>
                      <tr>
                        {['รูป', 'รหัส', 'ชื่อสินค้า', 'หมวด', 'ราคา', 'สต็อก', 'สถานะ', ''].map(h => (
                          <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 12, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pagedProducts.map((p, i) => (
                        <tr key={p.id} style={{ borderTop: '0.5px solid var(--border)' }}>
                          <td style={{ padding: '7px 8px 7px 12px', width: 48 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 7, overflow: 'hidden', background: 'var(--bg3)', border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {p.images?.[0] ? (
                                <img src={p.images[0]} alt={p.code} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                              ) : <span style={{ fontSize: 16 }}>📦</span>}
                            </div>
                          </td>
                          <td style={{ padding: '9px 12px', fontSize: 13, color: 'var(--text3)', fontFamily: 'var(--font-display)' }}>{p.code}</td>
                          <td style={{ padding: '9px 12px', fontSize: 14, maxWidth: 200 }}>
                            <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nameTh}</div>
                          </td>
                          <td style={{ padding: '9px 12px' }}>
                            <span className="badge badge-gray" style={{ fontSize: 12 }}>{p.category}</span>
                          </td>
                          <td style={{ padding: '9px 12px', fontSize: 15, fontWeight: 600, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>฿{p.price.toLocaleString()}</td>
                          <td style={{ padding: '9px 12px', fontSize: 14 }}>
                            <span style={{ color: p.stockCount === 0 ? 'var(--red)' : p.stockCount <= LOW_STOCK_THRESHOLD ? 'var(--orange)' : 'var(--text)', fontWeight: p.stockCount <= LOW_STOCK_THRESHOLD ? 700 : 400 }}>{p.stockCount}</span>
                          </td>
                          <td style={{ padding: '9px 12px' }}>
                            <span className={`badge ${p.inStock ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 12 }}>{p.inStock ? 'มีสินค้า' : 'หมด'}</span>
                          </td>
                          <td style={{ padding: '9px 12px' }}>
                            <div style={{ display: 'flex', gap: 5 }}>
                              <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 13 }} onClick={() => openEdit(p)} title="แก้ไข"><Edit size={13} /></button>
                              <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 13, color: 'var(--red)' }} onClick={() => setDeleteConfirm(p)} title="ลบ"><Trash2 size={13} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {totalProductPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 }}>
                    <button className="btn-ghost" style={{ padding: '4px 10px' }} disabled={productPage === 1} onClick={() => setProductPage(p => p - 1)}>‹</button>
                    <span style={{ fontSize: 14, color: 'var(--text2)' }}>หน้า {productPage} / {totalProductPages}</span>
                    <button className="btn-ghost" style={{ padding: '4px 10px' }} disabled={productPage === totalProductPages} onClick={() => setProductPage(p => p + 1)}>›</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ── Stock tab ─────────────────────────── */}
        {tab === 'stock' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { icon: <CheckCircle size={16} color="var(--green)" />, label: 'มีสินค้า', value: products.filter(p => p.stockCount > LOW_STOCK_THRESHOLD).length, color: 'var(--green)' },
                { icon: <AlertTriangle size={16} color="var(--orange)" />, label: `สต็อกต่ำ (≤${LOW_STOCK_THRESHOLD})`, value: lowStock, color: 'var(--orange)' },
                { icon: <XCircle size={16} color="var(--red)" />, label: 'สินค้าหมด', value: outOfStock, color: 'var(--red)' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  {s.icon}
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: s.color }}>{s.value}</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)' }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
                <input className="input" style={{ paddingLeft: 30, fontSize: 14 }}
                  placeholder="ค้นหารหัส / ชื่อสินค้า..."
                  value={stockSearch}
                  onChange={e => { setStockSearch(e.target.value); setStockPage(1) }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, color: 'var(--text2)' }}>{filteredStock.length} รายการ · รวม {products.reduce((s, p) => s + p.stockCount, 0)} ชิ้น</span>
                <button className="btn-ghost" onClick={exportStock} style={{ fontSize: 14 }}><Download size={13} /> Export CSV</button>
              </div>
            </div>

            <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: 'var(--bg3)' }}>
                  <tr>
                    {['รูป', 'รหัส', 'ชื่อสินค้า', 'หมวด', 'จำนวนสต็อก', 'สถานะ'].map(h => (
                      <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 12, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedStock.map((p) => {
                    const isLow = p.stockCount > 0 && p.stockCount <= LOW_STOCK_THRESHOLD
                    const isEmpty = p.stockCount === 0
                    return (
                      <tr key={p.id} style={{ borderTop: '0.5px solid var(--border)', background: isEmpty ? 'rgba(239,68,68,.03)' : isLow ? 'rgba(249,115,22,.03)' : 'transparent' }}>
                        <td style={{ padding: '7px 8px 7px 12px', width: 48 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 7, overflow: 'hidden', background: 'var(--bg3)', border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {p.images?.[0] ? <img src={p.images[0]} alt={p.code} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} /> : <span style={{ fontSize: 16 }}>📦</span>}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text3)', fontFamily: 'var(--font-display)', whiteSpace: 'nowrap' }}>{p.code}</td>
                        <td style={{ padding: '10px 12px', fontSize: 14, maxWidth: 220 }}>
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nameTh}</div>
                        </td>
                        <td style={{ padding: '10px 12px' }}><span className="badge badge-gray" style={{ fontSize: 12 }}>{p.category}</span></td>
                        <td style={{ padding: '10px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button onClick={() => adjustStock(p.id, -1)} style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--bg3)', border: '0.5px solid var(--border2)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><Minus size={12} /></button>
                            {editingStock === p.id ? (
                              <input autoFocus type="number" min={0} max={99999} value={stockInput}
                                onChange={e => setStockInput(e.target.value)}
                                onBlur={() => { setStock(p.id, parseInt(stockInput)); setEditingStock(null) }}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') { setStock(p.id, parseInt(stockInput)); setEditingStock(null) }
                                  if (e.key === 'Escape') setEditingStock(null)
                                }}
                                style={{ width: 60, textAlign: 'center', fontSize: 16, fontWeight: 600, background: 'var(--bg3)', border: '1px solid var(--green)', borderRadius: 6, padding: '3px 6px', color: 'var(--text)', outline: 'none' }}
                              />
                            ) : (
                              <button onClick={() => { setEditingStock(p.id); setStockInput(String(p.stockCount)) }} title="คลิกเพื่อแก้ไข"
                                style={{ width: 60, textAlign: 'center', fontSize: 16, fontWeight: 600, background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 6, padding: '3px 6px', cursor: 'text', color: isEmpty ? 'var(--red)' : isLow ? 'var(--orange)' : 'var(--text)', fontFamily: 'var(--font-display)' }}>
                                {p.stockCount}
                              </button>
                            )}
                            <button onClick={() => adjustStock(p.id, 1)} style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--green)', border: 'none', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><Plus size={12} /></button>
                            {isEmpty && <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700 }}>หมด</span>}
                            {isLow && !isEmpty && <span style={{ fontSize: 12, color: 'var(--orange)', fontWeight: 700 }}>ใกล้หมด</span>}
                          </div>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <button onClick={() => toggleInStock(p.id)} className={`badge ${p.inStock ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 12, cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}>
                            {p.inStock ? 'มีสินค้า' : 'หมด'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {totalStockPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 }}>
                <button className="btn-ghost" style={{ padding: '4px 10px' }} disabled={stockPage === 1} onClick={() => setStockPage(p => p - 1)}>‹</button>
                <span style={{ fontSize: 14, color: 'var(--text2)' }}>หน้า {stockPage} / {totalStockPages}</span>
                <button className="btn-ghost" style={{ padding: '4px 10px' }} disabled={stockPage === totalStockPages} onClick={() => setStockPage(p => p + 1)}>›</button>
              </div>
            )}
          </div>
        )}

        {/* ── Orders tab ────────────────────────── */}
        {tab === 'orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 360 }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
                <input className="input" style={{ paddingLeft: 30, fontSize: 14 }}
                  placeholder="ค้นหาเลขออเดอร์ / ชื่อ / เบอร์..."
                  value={orderSearch}
                  onChange={e => setOrderSearch(e.target.value)} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 14, color: 'var(--text2)' }}>{filteredOrders.length} ออเดอร์</span>
                <button className="btn-ghost" onClick={exportOrders} style={{ fontSize: 14 }}><Download size={13} /> Export CSV</button>
              </div>
            </div>

            {loadingOrders ? (
              <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text3)' }}>กำลังโหลด...</div>
            ) : filteredOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text3)' }}>
                {orderSearch ? 'ไม่พบออเดอร์ที่ค้นหา' : 'ยังไม่มีออเดอร์'}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filteredOrders.map(o => (
                  <div key={o.id} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>{o.id}</span>
                        <span className={`badge ${STATUS_COLORS[o.status]}`} style={{ fontSize: 12 }}>{STATUS_LABELS[o.status]}</span>
                      </div>
                      <span style={{ fontSize: 13, color: 'var(--text3)' }}>{new Date(o.created_at).toLocaleString('th-TH')}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 12 }}>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>ลูกค้า</div>
                        <div style={{ fontSize: 15, fontWeight: 500 }}>{o.recipient_name}</div>
                        <div style={{ fontSize: 13, color: 'var(--text3)' }}>{o.recipient_phone}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>ที่อยู่</div>
                        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{o.recipient_address}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>การชำระ</div>
                        <div style={{ fontSize: 14 }}>
                          {o.payment_method === 'transfer' ? 'โอนเงิน' : 'COD'}
                          {o.slip_url && <a href={o.slip_url} target="_blank" rel="noopener noreferrer" style={{ marginLeft: 8, fontSize: 12, color: 'var(--green)', textDecoration: 'underline' }}>ดูสลิป</a>}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>ยอดรวม</div>
                        <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>฿{o.total.toLocaleString()}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{o.items?.length ?? 0} รายการ · ค่าส่ง ฿{o.shipping_fee}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', borderTop: '0.5px solid var(--border)', paddingTop: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, color: 'var(--text3)' }}>สถานะ:</span>
                        <div style={{ position: 'relative', display: 'inline-block' }}>
                          <select value={o.status} onChange={e => updateOrderStatus(o.id, e.target.value as OrderStatus)} className="input" style={{ fontSize: 13, padding: '4px 26px 4px 8px', appearance: 'none', width: 'auto', cursor: 'pointer' }}>
                            {(['pending', 'paid', 'shipping', 'delivered', 'cancelled'] as OrderStatus[]).map(s => (
                              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                            ))}
                          </select>
                          <ChevronDown size={11} style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text3)' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                        <span style={{ fontSize: 13, color: 'var(--text3)', whiteSpace: 'nowrap' }}>เลขพัสดุ:</span>
                        {editingTracking === o.id ? (
                          <>
                            <input autoFocus className="input" style={{ fontSize: 13, padding: '4px 8px', width: 180 }} value={trackingInput}
                              onChange={e => setTrackingInput(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') saveTracking(o.id); if (e.key === 'Escape') setEditingTracking(null) }}
                              placeholder="เลขพัสดุ..." />
                            <button className="btn-primary" style={{ fontSize: 12, padding: '4px 10px' }} disabled={savingTracking} onClick={() => saveTracking(o.id)}>
                              {savingTracking ? '...' : 'บันทึก'}
                            </button>
                            <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => setEditingTracking(null)}>ยกเลิก</button>
                          </>
                        ) : (
                          <button className="btn-ghost" style={{ fontSize: 13, padding: '4px 10px', color: o.tracking_no ? 'var(--green)' : 'var(--text3)', fontFamily: o.tracking_no ? 'var(--font-display)' : 'inherit' }}
                            onClick={() => { setEditingTracking(o.id); setTrackingInput(o.tracking_no ?? '') }}>
                            {o.tracking_no ?? '+ เพิ่มเลขพัสดุ'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product modal */}
      {modalOpen && (
        <ProductModal product={editingProduct}
          onClose={() => { setModalOpen(false); setEditingProduct(null) }}
          onSave={handleSave} />
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 14, padding: 28, maxWidth: 380, width: '100%' }}>
            <h3 style={{ fontSize: 20, marginBottom: 10 }}>ยืนยันการลบสินค้า</h3>
            <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 6 }}>
              ลบ <span style={{ color: 'var(--text)', fontWeight: 600 }}>{deleteConfirm.code} — {deleteConfirm.nameTh}</span> ออกจากระบบ?
            </p>
            <p style={{ fontSize: 13, color: 'var(--red)', marginBottom: 22 }}>ไม่สามารถย้อนกลับได้</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-ghost" onClick={() => setDeleteConfirm(null)} disabled={deleting}>ยกเลิก</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={deleting}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: deleting ? 0.7 : 1 }}>
                <Trash2 size={14} /> {deleting ? 'กำลังลบ...' : 'ลบสินค้า'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
