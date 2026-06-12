'use client'
import Link from 'next/link'
import { Clock, Search, Trash2, Sparkles } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { useHistory } from '@/lib/recentlyViewed'
import { getProductById, bikeModels, categories, products } from '@/data/products'
import { ProductCard } from '@/components/product/ProductCard'
import type { Product } from '@/data/products'
import { EmptyState } from '@/components/ui'

export default function HistoryPage() {
  const { t, locale } = useLang()
  const { products: viewedIds, searches, bikes, cats, clear } = useHistory()

  const viewed = viewedIds.map(id => getProductById(id)).filter(Boolean) as Product[]

  // Recommendations: products sharing category/bike with recently viewed, excluding already viewed
  const seen = new Set(viewedIds)
  const recommended: Product[] = []
  if (viewed.length) {
    const likedCats  = new Set(viewed.map(p => p.category))
    const likedBikes = new Set(viewed.flatMap(p => p.bikeModels))
    for (const p of products) {
      if (seen.has(p.id) || recommended.length >= 8) continue
      if (likedCats.has(p.category) || p.bikeModels.some(b => likedBikes.has(b))) recommended.push(p)
    }
  }

  const bikeLabel = (id: string) => { const b = bikeModels.find(x => x.id === id); return b ? `${b.brand} ${b.model}` : id }
  const catLabel  = (id: string) => { const c = categories.find(x => x.id === id); return c ? (locale === 'th' ? c.nameTh : c.name) : id }

  const empty = !viewed.length && !searches.length && !bikes.length && !cats.length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={22} /> {locale === 'th' ? 'ประวัติการดู' : 'Browsing History'}
        </h1>
        {!empty && (
          <button onClick={clear} className="btn-ghost" style={{ fontSize: 13, padding: '6px 12px', color: 'var(--red)' }}>
            <Trash2 size={14} /> {locale === 'th' ? 'ล้างประวัติ' : 'Clear history'}
          </button>
        )}
      </div>

      {empty ? (
        <EmptyState
          icon={<Clock size={40} />}
          title={t.account.empty}
          action={<Link href="/products" className="btn-primary" style={{ fontSize: 15 }}>{locale === 'th' ? 'เลือกซื้อสินค้า' : 'Browse products'}</Link>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* Recent searches + filters */}
          {(searches.length > 0 || bikes.length > 0 || cats.length > 0) && (
            <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 18 }}>
              {searches.length > 0 && (
                <div style={{ marginBottom: bikes.length || cats.length ? 14 : 0 }}>
                  <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 700 }}>{locale === 'th' ? 'คำค้นหาล่าสุด' : 'Recent searches'}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {searches.map(s => (
                      <Link key={s} href={`/search?q=${encodeURIComponent(s)}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 999, fontSize: 13, background: 'var(--bg3)', color: 'var(--text2)', textDecoration: 'none', border: '0.5px solid var(--border2)' }}>
                        <Search size={12} /> {s}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {bikes.length > 0 && (
                <div style={{ marginBottom: cats.length ? 14 : 0 }}>
                  <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 700 }}>{locale === 'th' ? 'รุ่นรถที่ดู' : 'Recent bikes'}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {bikes.map(b => (
                      <Link key={b} href={`/products?bike=${b}`} style={{ padding: '5px 12px', borderRadius: 999, fontSize: 13, background: 'var(--bg3)', color: 'var(--text2)', textDecoration: 'none', border: '0.5px solid var(--border2)' }}>{bikeLabel(b)}</Link>
                    ))}
                  </div>
                </div>
              )}
              {cats.length > 0 && (
                <div>
                  <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 700 }}>{locale === 'th' ? 'หมวดที่ดู' : 'Recent categories'}</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {cats.map(c => (
                      <Link key={c} href={`/products?cat=${c}`} style={{ padding: '5px 12px', borderRadius: 999, fontSize: 13, background: 'var(--bg3)', color: 'var(--text2)', textDecoration: 'none', border: '0.5px solid var(--border2)' }}>{catLabel(c)}</Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recently viewed products */}
          {viewed.length > 0 && (
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>{locale === 'th' ? 'สินค้าที่เคยดู' : 'Recently viewed'}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 }}>
                {viewed.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {recommended.length > 0 && (
            <div>
              <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={17} color="var(--green)" /> {locale === 'th' ? 'แนะนำสำหรับคุณ' : 'Recommended for you'}
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 }}>
                {recommended.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
