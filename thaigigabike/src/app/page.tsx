'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronLeft, Zap, Shield, Truck, Award } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { products, bikeModels, categories } from '@/data/products'
import { ProductCard } from '@/components/product/ProductCard'

// Pick products that have images for the carousel
const SHOWCASE = products
  .filter(p => p.images && p.images.length > 0 && p.published)
  .slice(0, 18)

function HeroCarousel() {
  const [idx, setIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const [imgError, setImgError] = useState<Record<number, boolean>>({})
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { locale } = useLang()

  const items = SHOWCASE.filter((_, i) => !imgError[i])
  const current = items[idx % Math.max(1, items.length)]

  const prev = useCallback(() => setIdx(i => (i - 1 + items.length) % items.length), [items.length])
  const next = useCallback(() => setIdx(i => (i + 1) % items.length), [items.length])

  useEffect(() => {
    if (paused || items.length <= 1) return
    timerRef.current = setInterval(next, 3500)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [paused, next, items.length])

  if (!current) return null

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ position: 'relative', width: 380, flexShrink: 0, borderRadius: 16, overflow: 'hidden', border: '0.5px solid var(--border2)', boxShadow: '0 12px 60px rgba(0,0,0,.5)' }}
    >
      {/* Image */}
      <Link href={`/products/${current.id}`} style={{ display: 'block', textDecoration: 'none' }}>
        <div style={{ height: 260, background: 'var(--bg3)', position: 'relative', overflow: 'hidden' }}>
          <img
            key={current.id}
            src={current.images[0]}
            alt={current.nameTh}
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .4s', display: 'block' }}
            onError={() => {
              setImgError(prev => ({ ...prev, [SHOWCASE.indexOf(current)]: true }))
              next()
            }}
          />
          {/* Gradient overlay */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%', background: 'linear-gradient(transparent, rgba(0,0,0,.85))' }} />
          {/* Product info overlay */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '10px 14px' }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,.55)', fontFamily: 'var(--font-display)', letterSpacing: '.05em', marginBottom: 3 }}>
              {current.code}
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', lineHeight: 1.3, marginBottom: 6, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {locale === 'th' ? current.nameTh : current.name}
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>
              ฿{current.price.toLocaleString()}
            </div>
          </div>
        </div>
      </Link>

      {/* Prev / Next */}
      <button
        onClick={prev}
        style={{ position: 'absolute', left: 8, top: '40%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,.55)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', display: 'flex', padding: '5px 3px', zIndex: 2, backdropFilter: 'blur(4px)' }}
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={next}
        style={{ position: 'absolute', right: 8, top: '40%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,.55)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', display: 'flex', padding: '5px 3px', zIndex: 2, backdropFilter: 'blur(4px)' }}
      >
        <ChevronRight size={18} />
      </button>

      {/* Dot indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 5, padding: '8px 0', background: 'var(--bg3)' }}>
        {items.slice(0, 12).map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            style={{
              width: i === idx % items.length ? 18 : 6,
              height: 6, borderRadius: 3, border: 'none', cursor: 'pointer', padding: 0,
              background: i === idx % items.length ? 'var(--green)' : 'var(--border2)',
              transition: 'all .3s',
            }}
          />
        ))}
        {items.length > 12 && <span style={{ fontSize: 11, color: 'var(--text3)' }}>+{items.length - 12}</span>}
      </div>
    </div>
  )
}

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
        background: 'var(--hero-bg)',
        borderBottom: '1px solid var(--border)',
        padding: '64px 0',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* BG accent */}
        <div style={{
          position: 'absolute', top: -80, right: -80, width: 400, height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--hero-accent) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        {/* Racing stripes */}
        <div style={{
          position: 'absolute', top: 0, right: 0, width: 120, height: '100%',
          background: 'repeating-linear-gradient(45deg, var(--hero-stripe) 0px, var(--hero-stripe) 2px, transparent 2px, transparent 12px)',
          pointerEvents: 'none',
        }} />

        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <div style={{ flex: 1, position: 'relative', zIndex: 1 }}>
            <div className="badge badge-green" style={{ marginBottom: 16 }}>
              <Zap size={11} /> {t.home.heroTag}
            </div>
            <h1 style={{ fontSize: 62, lineHeight: 1.1, marginBottom: 14 }}>
              {t.home.heroTitle}<br />
              <span style={{ color: 'var(--green)' }}>{t.home.heroHighlight}</span>{' '}
              {t.home.heroTitleSuffix}
            </h1>
            <p style={{ fontSize: 19, color: 'var(--text2)', marginBottom: 24, lineHeight: 1.7 }}>
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

          {/* Hero Carousel */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <HeroCarousel />
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
              borderRadius: 8, padding: '8px 12px', fontSize: 17, color: 'var(--text2)',
            }}>
              {b.icon} {b.label}
            </div>
          ))}
        </div>
      </section>

      {/* Filter bar */}
      <section style={{ background: 'var(--bg)', borderBottom: '0.5px solid var(--border)', padding: '16px 0' }}>
        <div className="container">
          <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            {t.home.filterBy}
          </p>
          <div className="filter-pills">
            <button
              onClick={() => setActiveBike('all')}
              style={{
                padding: '5px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500,
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
                  padding: '5px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500,
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
                padding: '12px 16px', fontSize: 18, fontWeight: 500,
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
            <h2 style={{ fontSize: 29 }}>{t.home.featured}</h2>
            <Link href="/products" style={{
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: 18, color: 'var(--green)', textDecoration: 'none',
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
