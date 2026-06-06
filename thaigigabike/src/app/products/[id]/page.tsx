'use client'
import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import { ShoppingCart, ChevronRight, ChevronLeft, ImageOff, Check, Minus, Plus, ZoomIn, Star, PenLine } from 'lucide-react'
import Link from 'next/link'
import { useLang } from '@/lib/lang'
import { useCart } from '@/lib/cart'
import { getProductById, products, bikeModels } from '@/data/products'
import { ProductCard } from '@/components/product/ProductCard'

type Review = { id: string; reviewer_name: string; rating: number; comment: string | null; created_at: string }

function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} size={size} fill={rating >= n ? '#f59e0b' : 'none'} color={rating >= n ? '#f59e0b' : 'var(--border2)'} />
      ))}
    </span>
  )
}

function ProductReviews({ productId, locale }: { productId: string; locale: string }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [avg, setAvg]         = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/reviews?productId=${encodeURIComponent(productId)}&page=1`)
      .then(r => r.json())
      .then(d => {
        const list: Review[] = d.reviews ?? []
        setReviews(list)
        if (list.length > 0) setAvg(list.reduce((s, r) => s + r.rating, 0) / list.length)
      })
      .catch(() => {/* ignore */})
      .finally(() => setLoading(false))
  }, [productId])

  if (loading) return <div style={{ height: 80, background: 'var(--bg3)', borderRadius: 12 }} />

  return (
    <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h3 style={{ fontSize: 19, marginBottom: 4 }}>
            {locale === 'th' ? 'รีวิว' : 'Reviews'}
            {reviews.length > 0 && (
              <span style={{ marginLeft: 8, fontSize: 14, color: 'var(--text3)', fontWeight: 400 }}>({reviews.length})</span>
            )}
          </h3>
          {reviews.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <StarRow rating={Math.round(avg)} size={16} />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#f59e0b' }}>{avg.toFixed(1)}</span>
            </div>
          )}
        </div>
        <Link
          href={`/reviews?write=1&product=${encodeURIComponent(productId)}`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'var(--bg3)', color: 'var(--text)',
            border: '0.5px solid var(--border2)', borderRadius: 8,
            padding: '7px 14px', fontSize: 14, fontWeight: 600, textDecoration: 'none',
          }}
        >
          <PenLine size={13} />
          {locale === 'th' ? 'เขียนรีวิว' : 'Write review'}
        </Link>
      </div>

      {reviews.length === 0 ? (
        <p style={{ fontSize: 14, color: 'var(--text3)' }}>
          {locale === 'th' ? 'ยังไม่มีรีวิว — เป็นคนแรกที่รีวิวสินค้านี้' : 'No reviews yet — be the first!'}
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {reviews.slice(0, 3).map(r => (
            <div key={r.id} style={{ paddingBottom: 14, borderBottom: '0.5px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <StarRow rating={r.rating} />
                <span style={{ fontSize: 14, fontWeight: 600 }}>{r.reviewer_name}</span>
              </div>
              {r.comment && <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{r.comment}</p>}
            </div>
          ))}
          {reviews.length > 3 && (
            <Link href={`/reviews?productId=${encodeURIComponent(productId)}`} style={{ fontSize: 14, color: 'var(--green)', textDecoration: 'none', fontWeight: 600 }}>
              {locale === 'th' ? `ดูรีวิวทั้งหมด ${reviews.length} รีวิว →` : `See all ${reviews.length} reviews →`}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

export default function ProductDetailPage() {
  const params = useParams()
  const { t, locale } = useLang()
  const { add } = useCart()
  const product = getProductById(params.id as string)
  const [selectedColor, setSelectedColor] = useState(product?.colors[0] ?? '')
  const [qty, setQty] = useState(1)
  const [added, setAdded] = useState(false)
  const [activeImg, setActiveImg] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})

  if (!product) return notFound()

  const name = locale === 'th' ? product.nameTh : product.name
  const desc = locale === 'th' ? product.descriptionTh : product.description
  const images = product.images ?? []

  const compatibleBikes = bikeModels.filter(bm => product.bikeModels.includes(bm.id))
  const related = products.filter(p => p.id !== product.id && (
    p.category === product.category || p.bikeModels.some(b => product.bikeModels.includes(b))
  )).slice(0, 4)

  const handleAddToCart = () => {
    for (let i = 0; i < qty; i++) add(product, selectedColor)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const colorMap: Record<string, string> = {
    black: '#111', silver: '#aaa', gold: '#c8a020', hard: '#666',
    polished: '#c0c0c0', 'black-silver': '#555', raw: '#888', gray: '#777',
  }

  const prevImg = () => setActiveImg(i => (i - 1 + images.length) % images.length)
  const nextImg = () => setActiveImg(i => (i + 1) % images.length)

  const validImages = images.filter((_, i) => !imgErrors[i])

  return (
    <div>
      {/* Breadcrumb */}
      <div style={{ background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)', padding: '10px 0' }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, color: 'var(--text3)' }}>
          <Link href="/" style={{ color: 'var(--text3)', textDecoration: 'none' }}>{t.nav.home}</Link>
          <ChevronRight size={12} />
          <Link href="/products" style={{ color: 'var(--text3)', textDecoration: 'none' }}>{t.nav.products}</Link>
          <ChevronRight size={12} />
          <span style={{ color: 'var(--text2)' }}>{product.code}</span>
        </div>
      </div>

      {/* Main detail */}
      <section className="section">
        <div className="container grid-detail">

          {/* Left — image gallery */}
          <div>
            {/* Main showcase */}
            <div style={{
              background: 'var(--bg2)', border: '0.5px solid var(--border)',
              borderRadius: 14, overflow: 'hidden', marginBottom: 10,
              position: 'relative', aspectRatio: '1/1', maxHeight: 400,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: images.length > 0 && !imgErrors[activeImg] ? 'zoom-in' : 'default',
            }}
              onClick={() => images.length > 0 && !imgErrors[activeImg] && setLightbox(true)}
            >
              {images.length > 0 && !imgErrors[activeImg] ? (
                <img
                  key={activeImg}
                  src={images[activeImg]}
                  alt={name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  onError={() => setImgErrors(prev => ({ ...prev, [activeImg]: true }))}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, color: 'var(--text3)' }}>
                  <ImageOff size={48} />
                  <span style={{ fontSize: 14 }}>ยังไม่มีรูปภาพ</span>
                </div>
              )}

              {/* Nav arrows */}
              {images.length > 1 && (
                <>
                  <button onClick={e => { e.stopPropagation(); prevImg() }} style={{
                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,.5)', border: 'none', borderRadius: 8, color: '#fff',
                    cursor: 'pointer', display: 'flex', padding: '6px 4px', zIndex: 1,
                  }}><ChevronLeft size={20} /></button>
                  <button onClick={e => { e.stopPropagation(); nextImg() }} style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,.5)', border: 'none', borderRadius: 8, color: '#fff',
                    cursor: 'pointer', display: 'flex', padding: '6px 4px', zIndex: 1,
                  }}><ChevronRight size={20} /></button>
                </>
              )}

              {/* Zoom hint */}
              {images.length > 0 && !imgErrors[activeImg] && (
                <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,.5)', borderRadius: 6, padding: '3px 7px', display: 'flex', alignItems: 'center', gap: 4, color: '#fff', fontSize: 12 }}>
                  <ZoomIn size={12} />
                  {images.length > 1 && `${activeImg + 1}/${images.length}`}
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {images.map((url, i) => (
                  !imgErrors[i] && (
                    <button key={i} onClick={() => setActiveImg(i)} style={{
                      width: 64, height: 64, flexShrink: 0, padding: 0,
                      border: `2px solid ${activeImg === i ? 'var(--green)' : 'var(--border2)'}`,
                      borderRadius: 8, overflow: 'hidden', cursor: 'pointer', background: 'var(--bg3)',
                      transition: 'border-color .15s',
                    }}>
                      <img src={url} alt={`thumb-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={() => setImgErrors(prev => ({ ...prev, [i]: true }))} />
                    </button>
                  )
                ))}
              </div>
            )}
          </div>

          {/* Right — info */}
          <div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 4, fontFamily: 'var(--font-display)', letterSpacing: '.04em' }}>
              {t.product.code}: {product.code}
            </div>
            <h1 style={{ fontSize: 28, lineHeight: 1.3, marginBottom: 12 }}>{name}</h1>
            <div style={{ fontSize: 36, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-display)', marginBottom: 14 }}>
              ฿{product.price.toLocaleString()}
            </div>

            {/* Status badges */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              <span className={`badge ${product.inStock ? 'badge-green' : 'badge-red'}`}>
                {product.inStock ? <><Check size={11} /> {t.product.inStock}</> : t.product.outOfStock}
              </span>
              <span className="badge badge-orange">CNC Billet</span>
              <span className="badge badge-gray">{product.material.split(' ')[0]}</span>
            </div>

            {/* Fits on */}
            {compatibleBikes.length > 0 && (
              <div style={{ background: 'var(--bg3)', border: '0.5px solid var(--border)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 15, color: 'var(--text2)', lineHeight: 1.7 }}>
                <span style={{ color: 'var(--green)', fontWeight: 500 }}>{t.product.fitsOn}: </span>
                {compatibleBikes.map(b => `${b.brand} ${b.model}`).join(' · ')}
              </div>
            )}

            {/* Color picker */}
            {product.colors.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 8 }}>
                  {t.product.chooseColor}: <span style={{ color: 'var(--text)', fontWeight: 500 }}>
                    {locale === 'th' ? (t.colors as Record<string, string>)[selectedColor] || selectedColor : selectedColor}
                  </span>
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {product.colors.map(c => (
                    <button key={c} onClick={() => setSelectedColor(c)} title={c} style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: colorMap[c] || '#888',
                      border: selectedColor === c ? '2.5px solid var(--green)' : '0.5px solid var(--border2)',
                      boxShadow: selectedColor === c ? '0 0 0 2px var(--bg), 0 0 0 4px var(--green)' : 'none',
                      cursor: 'pointer', transition: 'all .15s', flexShrink: 0,
                    }} />
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <span style={{ fontSize: 14, color: 'var(--text3)' }}>{t.product.quantity}:</span>
              <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ width: 32, height: 32, background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 6, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Minus size={14} />
              </button>
              <span style={{ fontSize: 20, fontWeight: 600, width: 36, textAlign: 'center', fontFamily: 'var(--font-display)' }}>{qty}</span>
              <button onClick={() => setQty(qty + 1)} style={{ width: 32, height: 32, background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 6, color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <Plus size={14} />
              </button>
              {product.inStock && (
                <span style={{ fontSize: 13, color: 'var(--text3)' }}>
                  {locale === 'th' ? `มี ${product.stockCount} ชิ้น` : `${product.stockCount} in stock`}
                </span>
              )}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleAddToCart} disabled={!product.inStock} className="btn-primary"
                style={{ flex: 1, justifyContent: 'center', opacity: product.inStock ? 1 : 0.5 }}>
                {added ? <><Check size={15} /> {locale === 'th' ? 'เพิ่มแล้ว!' : 'Added!'}</> : <><ShoppingCart size={15} /> {t.product.addToCart}</>}
              </button>
              <a href="https://line.me/ti/p/~thaigigabike" target="_blank" rel="noopener noreferrer" style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                background: '#06C755', color: '#fff', borderRadius: 8, padding: '10px 0',
                fontSize: 17, fontWeight: 600, textDecoration: 'none', fontFamily: 'var(--font-display)',
              }}>
                {t.product.askLine}
              </a>
            </div>
            <Link
              href={`/messages?product=${encodeURIComponent(product.code)}`}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 8,
                fontSize: 14, color: 'var(--text2)', textDecoration: 'none',
                border: '0.5px solid var(--border2)', borderRadius: 8, padding: '8px 0',
              }}
            >
              ✉ {locale === 'th' ? 'ส่งข้อความถามเรื่องสินค้านี้' : 'Send message about this product'}
            </Link>

            {/* Material */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '0.5px solid var(--border)', fontSize: 14, color: 'var(--text3)' }}>
              <span style={{ color: 'var(--text2)' }}>{t.product.material}:</span> {product.material}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="container" style={{ marginTop: 40 }}>
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
            <h3 style={{ fontSize: 19, marginBottom: 10 }}>{t.product.description}</h3>
            <p style={{ fontSize: 17, color: 'var(--text2)', lineHeight: 1.8 }}>{desc}</p>
          </div>
        </div>

        {/* Reviews */}
        <div className="container" style={{ marginTop: 24 }}>
          <ProductReviews productId={product.id} locale={locale} />
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div className="container" style={{ marginTop: 48 }}>
            <h3 style={{ fontSize: 24, marginBottom: 16 }}>{t.product.related}</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </section>

      {/* Lightbox */}
      {lightbox && images.length > 0 && (
        <div
          onClick={() => setLightbox(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
        >
          <img
            src={images[activeImg]}
            alt={name}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 8 }}
            onClick={e => e.stopPropagation()}
          />
          {images.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); prevImg() }} style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer', display: 'flex', padding: '10px 8px' }}>
                <ChevronLeft size={28} />
              </button>
              <button onClick={e => { e.stopPropagation(); nextImg() }} style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer', display: 'flex', padding: '10px 8px' }}>
                <ChevronRight size={28} />
              </button>
            </>
          )}
          <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,.6)', fontSize: 14 }}>
            {activeImg + 1} / {images.length} — คลิกด้านนอกเพื่อปิด
          </div>
        </div>
      )}
    </div>
  )
}
