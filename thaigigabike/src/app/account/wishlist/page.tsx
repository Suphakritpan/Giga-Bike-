'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, ShoppingCart, Trash2, Share2, Bell, BellOff, Check, LayoutGrid, List } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { useCart } from '@/lib/cart'
import { getProductById, bikeModels } from '@/data/products'
import type { Product } from '@/data/products'

type Item = { product_id: string; notify_price_drop: boolean; notify_restock: boolean }

export default function WishlistPage() {
  const { t, locale } = useLang()
  const { add } = useCart()
  const [items, setItems]     = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [grouped, setGrouped] = useState(false)
  const [copied, setCopied]   = useState(false)

  useEffect(() => {
    fetch('/api/account/wishlist').then(r => r.json())
      .then(d => setItems(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const remove = async (productId: string) => {
    await fetch(`/api/account/wishlist?product_id=${encodeURIComponent(productId)}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.product_id !== productId))
  }

  const toggleAlert = async (productId: string, key: 'notify_price_drop' | 'notify_restock') => {
    setItems(prev => prev.map(i => i.product_id === productId ? { ...i, [key]: !i[key] } : i))
    const item = items.find(i => i.product_id === productId)
    await fetch('/api/account/wishlist', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ product_id: productId, [key]: !(item?.[key]) }),
    })
  }

  const share = () => {
    const ids = items.map(i => i.product_id).join(',')
    const url = `${window.location.origin}/wishlist/share?ids=${encodeURIComponent(ids)}`
    navigator.clipboard?.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const withProduct = items.map(i => ({ item: i, product: getProductById(i.product_id) }))
    .filter((x): x is { item: Item; product: Product } => !!x.product)

  if (loading) return <div style={{ color: 'var(--text3)', padding: 40, textAlign: 'center' }}>...</div>

  if (items.length === 0) {
    return (
      <div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 20 }}>{t.account.wishlist}</h1>
        <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text3)' }}>
          <Heart size={40} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.4 }} />
          <p style={{ marginBottom: 16 }}>{t.account.wishlistEmpty}</p>
          <Link href="/products" className="btn-primary" style={{ fontSize: 15 }}>{locale === 'th' ? 'เลือกซื้อสินค้า' : 'Browse products'}</Link>
        </div>
      </div>
    )
  }

  // Group products by bike model
  const groups: { bike: string; label: string; products: typeof withProduct }[] = []
  if (grouped) {
    for (const bm of bikeModels) {
      const matched = withProduct.filter(x => x.product.bikeModels.includes(bm.id))
      if (matched.length) groups.push({ bike: bm.id, label: `${bm.brand} ${bm.model}`, products: matched })
    }
  }

  const Card = ({ item, product: p }: { item: Item; product: Product }) => {
    const name = locale === 'th' ? p.nameTh : p.name
    return (
      <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <Link href={`/products/${p.id}`} style={{ display: 'block', textDecoration: 'none' }}>
          <div style={{ height: 130, background: 'var(--bg3)', position: 'relative' }}>
            {p.images?.[0] && <img src={p.images[0]} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            {!p.inStock && <span style={{ position: 'absolute', top: 8, left: 8 }} className="badge badge-red">{t.product.outOfStock}</span>}
          </div>
          <div style={{ padding: '10px 12px 6px' }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-display)' }}>{p.code}</div>
            <div style={{ fontSize: 14, color: 'var(--text)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: 38 }}>{name}</div>
            <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>฿{p.price.toLocaleString()}</div>
          </div>
        </Link>
        {/* alert toggles */}
        <div style={{ display: 'flex', gap: 6, padding: '0 12px 8px', flexWrap: 'wrap' }}>
          <button onClick={() => toggleAlert(p.id, 'notify_price_drop')} title={locale === 'th' ? 'แจ้งเตือนลดราคา' : 'Price-drop alert'}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '3px 8px', borderRadius: 999, cursor: 'pointer', border: '0.5px solid var(--border2)', background: item.notify_price_drop ? 'rgba(34,197,94,.1)' : 'transparent', color: item.notify_price_drop ? 'var(--green)' : 'var(--text3)' }}>
            {item.notify_price_drop ? <Bell size={11} /> : <BellOff size={11} />} {locale === 'th' ? 'ลดราคา' : 'Price'}
          </button>
          {!p.inStock && (
            <button onClick={() => toggleAlert(p.id, 'notify_restock')} title={locale === 'th' ? 'แจ้งเตือนของเข้า' : 'Restock alert'}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '3px 8px', borderRadius: 999, cursor: 'pointer', border: '0.5px solid var(--border2)', background: item.notify_restock ? 'rgba(34,197,94,.1)' : 'transparent', color: item.notify_restock ? 'var(--green)' : 'var(--text3)' }}>
              {item.notify_restock ? <Bell size={11} /> : <BellOff size={11} />} {locale === 'th' ? 'ของเข้า' : 'Restock'}
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, padding: '0 12px 12px' }}>
          <button onClick={() => { add(p, p.colors[0] ?? ''); remove(p.id) }} disabled={!p.inStock} className="btn-primary" style={{ flex: 1, justifyContent: 'center', fontSize: 13, padding: '7px 0', opacity: p.inStock ? 1 : 0.5 }}>
            <ShoppingCart size={13} /> {t.account.moveToCart}
          </button>
          <button onClick={() => remove(p.id)} className="btn-ghost" style={{ fontSize: 13, padding: '7px 10px', color: 'var(--red)' }}><Trash2 size={13} /></button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>{t.account.wishlist} <span style={{ fontSize: 16, color: 'var(--text3)' }}>({items.length})</span></h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setGrouped(g => !g)} className="btn-ghost" style={{ fontSize: 13, padding: '6px 12px' }}>
            {grouped ? <List size={14} /> : <LayoutGrid size={14} />} {grouped ? (locale === 'th' ? 'ทั้งหมด' : 'All') : (locale === 'th' ? 'แยกตามรถ' : 'By bike')}
          </button>
          <button onClick={share} className="btn-ghost" style={{ fontSize: 13, padding: '6px 12px' }}>
            {copied ? <Check size={14} color="var(--green)" /> : <Share2 size={14} />} {copied ? (locale === 'th' ? 'คัดลอกแล้ว' : 'Copied') : (locale === 'th' ? 'แชร์' : 'Share')}
          </button>
        </div>
      </div>

      {grouped ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {groups.map(g => (
            <div key={g.bike}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: 'var(--green)' }}>{g.label} <span style={{ color: 'var(--text3)', fontWeight: 400 }}>({g.products.length})</span></h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 }}>
                {g.products.map(x => <Card key={x.product.id} {...x} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 }}>
          {withProduct.map(x => <Card key={x.product.id} {...x} />)}
        </div>
      )}
    </div>
  )
}
