'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ChevronRight, Zap, Shield, Truck, Award } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { products, bikeModels, categories } from '@/data/products'
import { ProductCard } from '@/components/product/ProductCard'

export default function HomePage() {
  const { t, locale } = useLang()
  const [activeBike, setActiveBike] = useState('all')
  const [activeCategory, setActiveCategory] = useState('all')

  const filtered = products.filter(p => {
    const bikeOk = activeBike === 'all' || p.bikeModels.includes(activeBike)
    const catOk = activeCategory === 'all' || p.category === activeCategory
    return bikeOk && catOk
  })

  return (
    <div>
      {/* Hero */}
      <section style={{
        background: 'var(--bg2)',
        borderBottom: '0.5px solid var(--border)',
        padding: '56px 0',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* BG accent */}
        <div style={{
          position: 'absolute', top: -80, right: -80, width: 400, height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34,197,94,.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        {/* Racing stripes */}
        <div style={{
          position: 'absolute', top: 0, right: 0, width: 120, height: '100%',
          background: 'repeating-linear-gradient(45deg, rgba(34,197,94,.04) 0px, rgba(34,197,94,.04) 2px, transparent 2px, transparent 12px)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
            <div className="badge badge-green" style={{ marginBottom: 16 }}>
              <Zap size={11} /> {t.home.heroTag}
            </div>
            <h1 style={{ fontSize: 42, lineHeight: 1.15, marginBottom: 12 }}>
              {t.home.heroTitle}<br />
              <span style={{ color: 'var(--green)' }}>{t.home.heroHighlight}</span>{' '}
              {t.home.heroTitleSuffix}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 24, lineHeight: 1.7 }}>
              {t.home.heroSub}
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/products" className="btn-primary">
                {t.home.browseAll} <ChevronRight size={15} />
              </Link>
              <a href="https://line.me/ti/p/~thaigigabike" target="_blank" rel="noopener"
                className="btn-outline">
                {t.home.askLine}
              </a>
            </div>
          </div>
          {/* Hero visual placeholder */}
          <div style={{
            width: 260, height: 180, flexShrink: 0,
            background: 'var(--bg3)', border: '0.5px solid var(--border2)',
            borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text3)', fontSize: 13,
          }}>
            Hero image
          </div>
        </div>

        {/* Trust badges */}
        <div className="container" style={{ marginTop: 36, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {[
            { icon: <Award size={16} color="var(--green)" />, label: locale === 'th' ? 'ผลิตในไทย' : 'Made in Thailand' },
            { icon: <Shield size={16} color="var(--green)" />, label: locale === 'th' ? 'รับประกันคุณภาพ' : 'Quality Guaranteed' },
            { icon: <Truck size={16} color="var(--green)" />, label: locale === 'th' ? 'ส่งทั่วโลก' : 'Worldwide Shipping' },
            { icon: <Zap size={16} color="var(--green)" />, label: locale === 'th' ? 'CNC Precision' : 'CNC Precision' },
          ].map((b, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--bg3)', border: '0.5px solid var(--border)',
              borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text2)',
            }}>
              {b.icon} {b.label}
            </div>
          ))}
        </div>
      </section>

      {/* Filter bar */}
      <section style={{ background: 'var(--bg)', borderBottom: '0.5px solid var(--border)', padding: '16px 0', position: 'sticky', top: 56, zIndex: 50 }}>
        <div className="container">
          <p style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            {t.home.filterBy}
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveBike('all')}
              style={{
                padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                border: '0.5px solid', cursor: 'pointer', transition: 'all .15s',
                background: activeBike === 'all' ? 'var(--green)' : 'var(--bg3)',
                color: activeBike === 'all' ? '#000' : 'var(--text2)',
                borderColor: activeBike === 'all' ? 'var(--green)' : 'var(--border2)',
              }}
            >
              {t.home.allModels}
            </button>
            {bikeModels.map(bm => (
              <button
                key={bm.id}
                onClick={() => setActiveBike(bm.id)}
                style={{
                  padding: '5px 14px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                  border: '0.5px solid', cursor: 'pointer', transition: 'all .15s',
                  background: activeBike === bm.id ? 'var(--green)' : 'var(--bg3)',
                  color: activeBike === bm.id ? '#000' : 'var(--text2)',
                  borderColor: activeBike === bm.id ? 'var(--green)' : 'var(--border2)',
                }}
              >
                {bm.brand} {bm.model}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Category tabs */}
      <section style={{ borderBottom: '0.5px solid var(--border)' }}>
        <div className="container" style={{ display: 'flex', gap: 0 }}>
          {[{ id: 'all', th: 'ทั้งหมด', en: 'All' }, ...categories.map(c => ({ id: c.id, th: c.nameTh, en: c.name }))].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '12px 16px', fontSize: 13, fontWeight: 500,
                border: 'none', borderBottom: activeCategory === cat.id ? '2px solid var(--green)' : '2px solid transparent',
                background: 'transparent', cursor: 'pointer',
                color: activeCategory === cat.id ? 'var(--green)' : 'var(--text2)',
                transition: 'all .15s',
              }}
            >
              {locale === 'th' ? cat.th : cat.en}
            </button>
          ))}
        </div>
      </section>

      {/* Products grid */}
      <section className="section">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h2 style={{ fontSize: 22 }}>{t.home.featured}</h2>
            <Link href="/products" style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 13, color: 'var(--green)', textDecoration: 'none',
            }}>
              {t.home.viewAll} <ChevronRight size={14} />
            </Link>
          </div>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text2)' }}>
              {locale === 'th' ? 'ไม่พบสินค้าในหมวดนี้' : 'No products found'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
