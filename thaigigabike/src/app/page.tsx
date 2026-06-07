'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { ChevronRight, ChevronLeft, Zap, Shield, Truck, Award, Star, PenLine } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { products, bikeModels, categories } from '@/data/products'
import { ProductCard } from '@/components/product/ProductCard'

type Review = { id: string; reviewer_name: string; rating: number; comment: string | null; product_id: string | null }

function ReviewsStrip() {
  const { locale } = useLang()
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    fetch('/api/reviews?page=1')
      .then(r => r.json())
      .then(d => setReviews((d.reviews ?? []).slice(0, 4)))
      .catch(() => {})
  }, [])

  if (reviews.length === 0) return null

  return (
    <section style={{ background: 'var(--bg2)', borderTop: '0.5px solid var(--border)', padding: '36px 0' }}>
      <div className="container">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <h2 style={{ fontSize: 24, fontWeight: 800 }}>
            {locale === 'th' ? 'รีวิวจากลูกค้า' : 'Customer Reviews'}
          </h2>
          <Link href="/reviews" style={{ fontSize: 14, color: 'var(--green)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            {locale === 'th' ? 'ดูทั้งหมด' : 'See all'} <ChevronRight size={14} />
          </Link>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
          {reviews.map(r => (
            <div key={r.id} style={{
              background: 'var(--bg)', border: '0.5px solid var(--border)',
              borderRadius: 12, padding: '16px 18px',
            }}>
              <div style={{ display: 'flex', gap: 2, marginBottom: 6 }}>
                {[1,2,3,4,5].map(n => (
                  <Star key={n} size={13} fill={r.rating >= n ? '#f59e0b' : 'none'} color={r.rating >= n ? '#f59e0b' : 'var(--border2)'} />
                ))}
              </div>
              {r.comment && (
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 8,
                  overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
                }}>
                  {r.comment}
                </p>
              )}
              <div style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600 }}>{r.reviewer_name}</div>
              {r.product_id && <div style={{ fontSize: 11, color: 'var(--green)' }}>{r.product_id}</div>}
            </div>
          ))}
          {/* Write review CTA card */}
          <Link href="/reviews" style={{
            background: 'rgba(34,197,94,.06)', border: '1px dashed rgba(34,197,94,.35)',
            borderRadius: 12, padding: '16px 18px', textDecoration: 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 8, color: 'var(--green)', cursor: 'pointer',
          }}>
            <PenLine size={22} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>
              {locale === 'th' ? 'เขียนรีวิว' : 'Write a review'}
            </span>
          </Link>
        </div>
      </div>
    </section>
  )
}

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
      className="hero-carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      style={{ position: 'relative', width: 380, flexShrink: 0, borderRadius: 16, overflow: 'hidden', border: '0.5px solid var(--border2)', boxShadow: '0 12px 40px rgba(0,0,0,.18)' }}
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

const HOME_PAGE_SIZE = 24

export default function HomePage() {
  const { t, locale } = useLang()
  const [activeBikes, setActiveBikes] = useState<Set<string>>(new Set())
  const [activeCats,  setActiveCats]  = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)

  const toggleHomeBike = (id: string) => setActiveBikes(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })
  const toggleHomeCat = (id: string) => setActiveCats(prev => {
    const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next
  })

  const homeBikesKey = [...activeBikes].sort().join(',')
  const homeCatsKey  = [...activeCats].sort().join(',')

  const filtered = useMemo(() => products.filter(p => {
    if (activeBikes.size > 0 && !p.bikeModels.some(b => activeBikes.has(b))) return false
    if (activeCats.size  > 0 && !activeCats.has(p.category))                 return false
    return true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [homeBikesKey, homeCatsKey])

  const totalPages = Math.ceil(filtered.length / HOME_PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * HOME_PAGE_SIZE, page * HOME_PAGE_SIZE)

  const handlePage = (p: number) => {
    setPage(Math.max(1, Math.min(p, totalPages)))
    document.getElementById('home-products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Reset to page 1 on filter change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setPage(1), [homeBikesKey, homeCatsKey])

  return (
    <div>
      {/* Hero */}
      <section className="hero-section" style={{
        background: 'var(--hero-bg)',
        borderBottom: '1px solid var(--border)',
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

        <div className="container hero-flex">
          <div style={{ flex: 1, position: 'relative', zIndex: 1, minWidth: 0 }}>
            <div className="badge badge-green" style={{ marginBottom: 16 }}>
              <Zap size={11} /> {t.home.heroTag}
            </div>
            <h1 className="hero-title">
              {t.home.heroTitle}<br />
              <span style={{ color: 'var(--green)' }}>{t.home.heroHighlight}</span>{' '}
              {t.home.heroTitleSuffix}
            </h1>
            <p className="hero-sub" style={{ color: 'var(--text2)', marginBottom: 24 }}>
              {t.home.heroSub}
            </p>
            <div className="hero-cta">
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

      {/* Filter bar — bike multi-select */}
      <section style={{ background: 'var(--bg)', borderBottom: '0.5px solid var(--border)', padding: '16px 0' }}>
        <div className="container">
          <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em' }}>
            {t.home.filterBy}
          </p>
          <div className="filter-pills">
            <button
              onClick={() => setActiveBikes(new Set())}
              style={{
                padding: '5px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500,
                border: '0.5px solid', cursor: 'pointer', transition: 'all .15s',
                background: activeBikes.size === 0 ? 'var(--green)' : 'var(--bg3)',
                color: activeBikes.size === 0 ? '#fff' : 'var(--text2)',
                borderColor: activeBikes.size === 0 ? 'var(--green)' : 'var(--border2)',
              }}
            >
              {t.home.allModels}
            </button>
            {bikeModels.map(bm => {
              const active = activeBikes.has(bm.id)
              return (
                <button key={bm.id} onClick={() => toggleHomeBike(bm.id)} style={{
                  padding: '5px 14px', borderRadius: 999, fontSize: 13, fontWeight: 500,
                  border: '0.5px solid', cursor: 'pointer', transition: 'all .15s',
                  background: active ? 'var(--green)' : 'var(--bg3)',
                  color: active ? '#fff' : 'var(--text2)',
                  borderColor: active ? 'var(--green)' : 'var(--border2)',
                }}>
                  {bm.brand} {bm.model}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      {/* Category tabs — multi-select */}
      <section style={{ borderBottom: '0.5px solid var(--border)' }}>
        <div className="container" style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
          {[{ id: 'all', th: 'ทั้งหมด', en: 'All' }, ...categories.map(c => ({ id: c.id, th: c.nameTh, en: c.name }))].map(cat => {
            const isAll  = cat.id === 'all'
            const active = isAll ? activeCats.size === 0 : activeCats.has(cat.id)
            return (
              <button
                key={cat.id}
                onClick={() => isAll ? setActiveCats(new Set()) : toggleHomeCat(cat.id)}
                style={{
                  padding: '12px 16px', fontSize: 18, fontWeight: 500, whiteSpace: 'nowrap',
                  border: 'none', borderBottom: active ? '2px solid var(--green)' : '2px solid transparent',
                  background: 'transparent', cursor: 'pointer',
                  color: active ? 'var(--green)' : 'var(--text2)',
                  transition: 'all .15s',
                }}
              >
                {locale === 'th' ? cat.th : cat.en}
              </button>
            )
          })}
        </div>
      </section>

      {/* Products grid */}
      <section id="home-products" className="section">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
            <div>
              <h2 style={{ fontSize: 29, marginBottom: 2 }}>{t.home.featured}</h2>
              <p style={{ fontSize: 14, color: 'var(--text3)' }}>
                <span style={{ fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{filtered.length}</span>
                {' '}{locale === 'th' ? 'รายการ' : 'items'}
                {totalPages > 1 && (
                  <span style={{ marginLeft: 6 }}>· {locale === 'th' ? `หน้า ${page}/${totalPages}` : `Page ${page}/${totalPages}`}</span>
                )}
              </p>
            </div>
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
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {paginated.map(p => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 28, flexWrap: 'wrap' }}>
                  <button
                    onClick={() => handlePage(page - 1)}
                    disabled={page === 1}
                    style={{
                      minWidth: 36, height: 36, borderRadius: 8, fontSize: 14,
                      border: '0.5px solid var(--border2)', cursor: 'pointer',
                      background: 'var(--bg3)', color: 'var(--text2)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      opacity: page === 1 ? 0.35 : 1, padding: '0 10px',
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {(() => {
                    const pages: (number | '…')[] = []
                    for (let i = 1; i <= totalPages; i++) {
                      if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2)) pages.push(i)
                      else if (pages[pages.length - 1] !== '…') pages.push('…')
                    }
                    return pages.map((p, i) =>
                      p === '…' ? (
                        <span key={`e${i}`} style={{ width: 28, textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>…</span>
                      ) : (
                        <button key={p} onClick={() => handlePage(p as number)}
                          style={{
                            minWidth: 36, height: 36, borderRadius: 8, fontSize: 14, fontWeight: p === page ? 700 : 500,
                            border: '0.5px solid', cursor: 'pointer',
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            background: p === page ? 'var(--green)' : 'var(--bg3)',
                            color:      p === page ? '#fff'         : 'var(--text2)',
                            borderColor: p === page ? 'var(--green)' : 'var(--border2)',
                          }}>
                          {p}
                        </button>
                      )
                    )
                  })()}

                  <button
                    onClick={() => handlePage(page + 1)}
                    disabled={page === totalPages}
                    style={{
                      minWidth: 36, height: 36, borderRadius: 8, fontSize: 14,
                      border: '0.5px solid var(--border2)', cursor: 'pointer',
                      background: 'var(--bg3)', color: 'var(--text2)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      opacity: page === totalPages ? 0.35 : 1, padding: '0 10px',
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </section>

      {/* Reviews social proof */}
      <ReviewsStrip />
    </div>
  )
}
