'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package, ShoppingBag, TrendingUp, Boxes,
  LogOut, Zap, Bell,
} from 'lucide-react'
import { products as initialProducts } from '@/data/products'
import type { Product } from '@/data/products'
import { ProductModal } from '@/components/admin/ProductModal'
import { toCsvRow } from '@/lib/csv'
import { ConfirmDialog, Spinner } from '@/components/ui'
import { StatCard } from './components/StatCard'
import { AlertBanner } from './components/AlertBanner'
import { AdminThread } from './components/AdminThread'
import { ProductsTab } from './components/ProductsTab'
import { StockTab } from './components/StockTab'
import { OrdersTab } from './components/OrdersTab'
import { MessagesTab } from './components/MessagesTab'
import { TicketsTab } from './components/TicketsTab'
import { TaxTab } from './components/TaxTab'
import { ReviewsTab } from './components/ReviewsTab'
import {
  TICKET_TOPIC_LABELS, LOW_STOCK_THRESHOLD, PAGE_SIZE, STATUS_COLORS, STATUS_LABELS,
} from './components/types'
import type {
  OrderStatus, Tab, AdminMessage, AdminReview, TicketStatus, AdminTicket, TaxRequest, Order,
} from './components/types'

export default function AdminPage() {
  const router  = useRouter()

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
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'all'>('all')

  const [adminMessages, setAdminMessages]   = useState<AdminMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [adminReviews, setAdminReviews]     = useState<AdminReview[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)

  const [adminTickets, setAdminTickets]     = useState<AdminTicket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(false)

  const [taxRequests, setTaxRequests]       = useState<TaxRequest[]>([])
  const [loadingTax, setLoadingTax]         = useState(false)

  const [editingTracking, setEditingTracking] = useState<string | null>(null)
  const [trackingInput, setTrackingInput]     = useState('')
  const [savingTracking, setSavingTracking]   = useState(false)

  const [modalOpen, setModalOpen]         = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null)
  const [deleting, setDeleting]           = useState(false)


  // ─── Auth ─── (server layout already guards this page; client-side confirm)
  useEffect(() => {
    fetch('/api/auth/me').then(r => {
      if (!r.ok) router.replace('/login?next=/admin')
      else setAuthChecked(true)
    })
  }, [router])

  // ─── Load products ───
  const loadProducts = useCallback(async () => {
    setLoadingProducts(true)
    const res = await fetch('/api/admin/products')
    if (res.ok) {
      const json = await res.json()
      if (json.products?.length > 0) {
        setProducts(json.products.map((r: Record<string, unknown>) => ({
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
    }
    setLoadingProducts(false)
  }, [])

  // ─── Load orders ───
  const loadOrders = useCallback(async () => {
    setLoadingOrders(true)
    const res = await fetch('/api/admin/orders')
    if (res.ok) {
      const json = await res.json()
      if (json.orders) setOrders(json.orders as Order[])
    }
    setLoadingOrders(false)
  }, [])

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
    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(row),
    })
    if (!res.ok) {
      const json = await res.json()
      throw new Error(json.error || 'Failed to save product')
    }
    await loadProducts()
  }

  const handleDelete = async (product: Product) => {
    setDeleting(true)
    const res = await fetch(`/api/admin/products/${encodeURIComponent(product.id)}`, {
      method: 'DELETE',
    })
    if (res.ok) setProducts(prev => prev.filter(p => p.id !== product.id))
    setDeleteConfirm(null)
    setDeleting(false)
  }

  const openAdd  = () => { setEditingProduct(null); setModalOpen(true) }
  const openEdit = (p: Product) => { setEditingProduct(p); setModalOpen(true) }

  // ─── Stock ───
  const patchStock = (id: string, stockCount: number, inStock: boolean) =>
    fetch(`/api/admin/products/${encodeURIComponent(id)}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock_count: stockCount, in_stock: inStock }),
    })

  const adjustStock = async (id: string, delta: number) => {
    const p = products.find(x => x.id === id)
    if (!p) return
    const next = Math.max(0, p.stockCount + delta)
    setProducts(prev => prev.map(x => x.id === id ? { ...x, stockCount: next, inStock: next > 0 } : x))
    const res = await patchStock(id, next, next > 0)
    if (!res.ok) setProducts(prev => prev.map(x => x.id === id ? { ...x, stockCount: p.stockCount, inStock: p.inStock } : x))
  }

  const setStock = async (id: string, value: number) => {
    const count = Math.max(0, isNaN(value) ? 0 : Math.floor(value))
    const p = products.find(x => x.id === id)
    setProducts(prev => prev.map(x => x.id === id ? { ...x, stockCount: count, inStock: count > 0 } : x))
    const res = await patchStock(id, count, count > 0)
    if (!res.ok && p) setProducts(prev => prev.map(x => x.id === id ? { ...x, stockCount: p.stockCount, inStock: p.inStock } : x))
  }

  const toggleInStock = async (id: string) => {
    const p = products.find(x => x.id === id)
    if (!p) return
    const next = !p.inStock
    const count = next && p.stockCount === 0 ? 1 : p.stockCount
    setProducts(prev => prev.map(x => x.id === id ? { ...x, inStock: next, stockCount: count } : x))
    const res = await patchStock(id, count, next)
    if (!res.ok) setProducts(prev => prev.map(x => x.id === id ? { ...x, inStock: p.inStock, stockCount: p.stockCount } : x))
  }

  // ─── Orders ───
  const updateOrderStatus = async (id: string, status: OrderStatus) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o))
    await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  const [slipLoading, setSlipLoading] = useState<string | null>(null)
  const [slipError, setSlipError] = useState('')
  // Open the order's payment slip via a short-lived signed URL (private bucket).
  const viewSlip = async (orderId: string) => {
    setSlipLoading(orderId)
    setSlipError('')
    // Open the tab synchronously so the browser doesn't block it after the await.
    const w = window.open('', '_blank')
    try {
      const res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/slip-url`, { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.signedUrl) {
        if (w) w.location.href = data.signedUrl
      } else {
        if (w) w.close()
        setSlipError(data.error === 'No slip on this order' ? 'ออเดอร์นี้ไม่มีสลิป' : 'ไม่สามารถเปิดสลิปได้')
      }
    } catch {
      if (w) w.close()
      setSlipError('ไม่สามารถเปิดสลิปได้')
    } finally {
      setSlipLoading(null)
    }
  }
  useEffect(() => {
    if (!slipError) return
    const id = setTimeout(() => setSlipError(''), 3500)
    return () => clearTimeout(id)
  }, [slipError])

  const saveTracking = async (orderId: string) => {
    const no = trackingInput.trim()
    setSavingTracking(true)
    const patch: Record<string, unknown> = { tracking_no: no || null }
    if (no) patch.status = 'shipping'
    await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, tracking_no: no || null, status: no ? 'shipping' : o.status } : o))
    setEditingTracking(null)
    setSavingTracking(false)
  }

  // ─── Messages ───
  const loadMessages = useCallback(async () => {
    setLoadingMessages(true)
    const res = await fetch('/api/admin/messages')
    if (res.ok) { const j = await res.json(); setAdminMessages(j.messages ?? []) }
    setLoadingMessages(false)
  }, [])

  const markMessage = async (id: string, status: AdminMessage['status']) => {
    setAdminMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m))
    await fetch(`/api/admin/messages/${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  // ─── Reviews ───
  const loadReviews = useCallback(async () => {
    setLoadingReviews(true)
    const res = await fetch('/api/admin/reviews')
    if (res.ok) { const j = await res.json(); setAdminReviews(j.reviews ?? []) }
    setLoadingReviews(false)
  }, [])

  const toggleReviewPublished = async (id: string, published: boolean) => {
    setAdminReviews(prev => prev.map(r => r.id === id ? { ...r, published } : r))
    await fetch(`/api/admin/reviews/${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ published }),
    })
  }

  const deleteReview = async (id: string) => {
    await fetch(`/api/admin/reviews/${encodeURIComponent(id)}`, { method: 'DELETE' })
    setAdminReviews(prev => prev.filter(r => r.id !== id))
  }

  // ─── Tickets ───
  const loadTickets = useCallback(async () => {
    setLoadingTickets(true)
    const res = await fetch('/api/admin/tickets')
    if (res.ok) { const j = await res.json(); setAdminTickets(j.tickets ?? []) }
    setLoadingTickets(false)
  }, [])

  const setTicketStatus = async (id: string, status: TicketStatus) => {
    setAdminTickets(prev => prev.map(t => t.id === id ? { ...t, status } : t))
    await fetch(`/api/admin/tickets/${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  // ─── Tax invoice requests ───
  const loadTax = useCallback(async () => {
    setLoadingTax(true)
    const res = await fetch('/api/admin/tax-invoices')
    if (res.ok) { const j = await res.json(); setTaxRequests(j.requests ?? []) }
    setLoadingTax(false)
  }, [])

  const setTaxStatus = async (id: string, status: TaxRequest['status']) => {
    setTaxRequests(prev => prev.map(r => r.id === id ? { ...r, status } : r))
    await fetch(`/api/admin/tax-invoices/${encodeURIComponent(id)}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  // Load messages/reviews/tickets/tax when switching to their tabs
  useEffect(() => {
    if (tab === 'messages' && adminMessages.length === 0) loadMessages()
    if (tab === 'reviews'  && adminReviews.length === 0)  loadReviews()
    if (tab === 'tickets'  && adminTickets.length === 0)  loadTickets()
    if (tab === 'tax'      && taxRequests.length === 0)   loadTax()
  }, [tab, adminMessages.length, adminReviews.length, adminTickets.length, taxRequests.length, loadMessages, loadReviews, loadTickets, loadTax])

  const handleLogout = async () => { await fetch('/api/auth/logout', { method: 'POST' }); router.push('/login') }

  const exportOrders = () => {
    const csv = [
      ['Order ID', 'Customer', 'Phone', 'Items', 'Total', 'Status', 'Tracking', 'Date'],
      ...orders.map(o => [o.id, o.recipient_name, o.recipient_phone, o.items?.length ?? 0, o.total, o.status, o.tracking_no ?? '', new Date(o.created_at).toLocaleDateString('th-TH')]),
    ].map(row => toCsvRow(row)).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'orders.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const exportStock = () => {
    const csv = [
      ['รหัส', 'ชื่อสินค้า', 'สต็อก', 'สถานะ'],
      ...products.map(p => [p.code, p.nameTh, p.stockCount, p.inStock ? 'มีสินค้า' : 'หมด']),
    ].map(row => toCsvRow(row)).join('\n')
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
    if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false
    if (!orderSearch) return true
    const q = orderSearch.toLowerCase()
    return o.id.toLowerCase().includes(q) || o.recipient_name.toLowerCase().includes(q) || o.recipient_phone.includes(q)
  })
  const orderStatusCounts: Record<OrderStatus | 'all', number> = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    paid: orders.filter(o => o.status === 'paid').length,
    shipping: orders.filter(o => o.status === 'shipping').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }

  const newMessagesCount = adminMessages.filter(m => m.status === 'new').length
  const pendingReviewsCount = adminReviews.filter(r => !r.published).length
  const openTicketsCount = adminTickets.filter(t => t.status === 'open').length
  const pendingTaxCount = taxRequests.filter(r => r.status === 'requested').length

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: 'products', label: 'สินค้า',    count: products.length },
    { id: 'stock',    label: 'สต็อก',     count: outOfStock + lowStock > 0 ? outOfStock + lowStock : undefined },
    { id: 'orders',   label: 'ออเดอร์',   count: pendingCount > 0 ? pendingCount : undefined },
    { id: 'messages', label: 'ข้อความ',   count: newMessagesCount > 0 ? newMessagesCount : undefined },
    { id: 'tickets',  label: 'ซัพพอร์ต',  count: openTicketsCount > 0 ? openTicketsCount : undefined },
    { id: 'tax',      label: 'ใบกำกับภาษี', count: pendingTaxCount > 0 ? pendingTaxCount : undefined },
    { id: 'reviews',  label: 'รีวิว',     count: pendingReviewsCount > 0 ? pendingReviewsCount : undefined },
  ]

  // ─── Loading / Auth check ───
  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text3)' }}>
          <Spinner />
          <div style={{ marginTop: 16 }}>กำลังตรวจสอบสิทธิ์...</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Transient error toast (replaces native alert) */}
      {slipError && (
        <div role="alert" className="animate-fade-up" style={{ position: 'fixed', top: 70, left: '50%', transform: 'translateX(-50%)', zIndex: 400, background: 'var(--red)', color: '#fff', padding: '10px 18px', borderRadius: 10, fontSize: 14, fontWeight: 600, boxShadow: '0 6px 24px rgba(0,0,0,.25)' }}>
          {slipError}
        </div>
      )}

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
          <ProductsTab
            rows={pagedProducts}
            total={filteredProducts.length}
            search={productSearch}
            onSearch={v => { setProductSearch(v); setProductPage(1) }}
            page={productPage}
            totalPages={totalProductPages}
            onPageChange={setProductPage}
            loading={loadingProducts}
            onAdd={openAdd}
            onEdit={openEdit}
            onDelete={setDeleteConfirm}
          />
        )}

        {/* ── Stock tab ─────────────────────────── */}
        {tab === 'stock' && (
          <StockTab
            allProducts={products}
            rows={pagedStock}
            filteredCount={filteredStock.length}
            lowStock={lowStock}
            outOfStock={outOfStock}
            search={stockSearch}
            onSearch={v => { setStockSearch(v); setStockPage(1) }}
            onExport={exportStock}
            page={stockPage}
            totalPages={totalStockPages}
            onPageChange={setStockPage}
            onAdjust={adjustStock}
            onSetStock={setStock}
            onToggleInStock={toggleInStock}
          />
        )}

        {/* ── Orders tab ────────────────────────── */}
        {tab === 'orders' && (
          <OrdersTab
            orders={filteredOrders}
            search={orderSearch}
            onSearch={setOrderSearch}
            statusFilter={orderStatusFilter}
            onStatusFilter={setOrderStatusFilter}
            statusCounts={orderStatusCounts}
            onExport={exportOrders}
            loading={loadingOrders}
            slipLoading={slipLoading}
            onViewSlip={viewSlip}
            onUpdateStatus={updateOrderStatus}
            editingTracking={editingTracking}
            setEditingTracking={setEditingTracking}
            trackingInput={trackingInput}
            setTrackingInput={setTrackingInput}
            savingTracking={savingTracking}
            onSaveTracking={saveTracking}
          />
        )}
        {/* ── Messages tab ──────────────────────── */}
        {tab === 'messages' && (
          <MessagesTab
            messages={adminMessages}
            newCount={newMessagesCount}
            loading={loadingMessages}
            onRefresh={loadMessages}
            onMark={markMessage}
            onReplied={id => setAdminMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'replied' } : m))}
          />
        )}

        {/* ── Support tickets tab ───────────────── */}
        {tab === 'tickets' && (
          <TicketsTab
            tickets={adminTickets}
            openCount={openTicketsCount}
            loading={loadingTickets}
            onRefresh={loadTickets}
            onSetStatus={setTicketStatus}
            onAnswered={id => setAdminTickets(prev => prev.map(t => t.id === id ? { ...t, status: 'answered' } : t))}
          />
        )}

        {/* ── Tax invoice requests tab ──────────── */}
        {tab === 'tax' && (
          <TaxTab
            requests={taxRequests}
            pendingCount={pendingTaxCount}
            loading={loadingTax}
            onRefresh={loadTax}
            onSetStatus={setTaxStatus}
          />
        )}

        {/* ── Reviews tab ───────────────────────── */}
        {tab === 'reviews' && (
          <ReviewsTab
            reviews={adminReviews}
            pendingCount={pendingReviewsCount}
            loading={loadingReviews}
            onRefresh={loadReviews}
            onTogglePublished={toggleReviewPublished}
            onDelete={deleteReview}
          />
        )}

      </div>

      {/* Product modal */}
      {modalOpen && (
        <ProductModal product={editingProduct}
          onClose={() => { setModalOpen(false); setEditingProduct(null) }}
          onSave={handleSave} />
      )}

      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteConfirm}
        danger
        loading={deleting}
        title="ยืนยันการลบสินค้า"
        message={deleteConfirm ? `ลบ ${deleteConfirm.code} — ${deleteConfirm.nameTh} ออกจากระบบ? การลบนี้ไม่สามารถย้อนกลับได้` : undefined}
        confirmLabel="ลบสินค้า"
        cancelLabel="ยกเลิก"
        onConfirm={() => { if (deleteConfirm) handleDelete(deleteConfirm) }}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  )
}
