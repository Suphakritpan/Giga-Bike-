'use client'
import { useState } from 'react'
import { ImageOff, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { products } from '@/data/products'

const GALLERY_ITEMS = products.filter(p => p.images && p.images.length > 0).slice(0, 60)

export default function GalleryPage() {
  const { t, locale } = useLang()
  const [lightbox, setLightbox] = useState<{ idx: number } | null>(null)

  const prev = () => setLightbox(lb => lb && { idx: (lb.idx - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length })
  const next = () => setLightbox(lb => lb && { idx: (lb.idx + 1) % GALLERY_ITEMS.length })

  const current = lightbox != null ? GALLERY_ITEMS[lightbox.idx] : null

  return (
    <div>
      <section style={{ background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)', padding: '32px 0' }}>
        <div className="container">
          <h1 style={{ fontSize: 38, marginBottom: 4 }}>{t.gallery.title}</h1>
          <p style={{ color: 'var(--text2)', fontSize: 17 }}>{t.gallery.subtitle}</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {GALLERY_ITEMS.map((p, i) => (
              <GalleryCard
                key={p.id}
                product={p}
                locale={locale}
                onClick={() => setLightbox({ idx: i })}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox != null && current && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,.92)', zIndex: 999,
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          }}
        >
          <button
            onClick={e => { e.stopPropagation(); setLightbox(null) }}
            style={{
              position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,.15)',
              border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer',
              display: 'flex', padding: 8,
            }}
          >
            <X size={22} />
          </button>

          <button onClick={e => { e.stopPropagation(); prev() }} style={{
            position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 10,
            color: '#fff', cursor: 'pointer', display: 'flex', padding: '10px 8px',
          }}>
            <ChevronLeft size={28} />
          </button>

          <div onClick={e => e.stopPropagation()} style={{ maxWidth: 540, width: '100%', textAlign: 'center' }}>
            <img
              src={current.images[0]}
              alt={locale === 'th' ? current.nameTh : current.name}
              style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8, display: 'block', margin: '0 auto' }}
            />
            <div style={{ marginTop: 12, color: 'rgba(255,255,255,.6)', fontSize: 13, fontFamily: 'var(--font-display)' }}>
              {current.code}
            </div>
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 500, marginTop: 4 }}>
              {locale === 'th' ? current.nameTh : current.name}
            </div>
            <div style={{ color: 'var(--green)', fontSize: 18, fontWeight: 700, marginTop: 4 }}>
              ฿{current.price.toLocaleString()}
            </div>
            <div style={{ color: 'rgba(255,255,255,.4)', fontSize: 12, marginTop: 10 }}>
              {lightbox.idx + 1} / {GALLERY_ITEMS.length} — คลิกด้านนอกเพื่อปิด
            </div>
          </div>

          <button onClick={e => { e.stopPropagation(); next() }} style={{
            position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,.15)', border: 'none', borderRadius: 10,
            color: '#fff', cursor: 'pointer', display: 'flex', padding: '10px 8px',
          }}>
            <ChevronRight size={28} />
          </button>
        </div>
      )}
    </div>
  )
}

function GalleryCard({
  product,
  locale,
  onClick,
}: {
  product: typeof GALLERY_ITEMS[0]
  locale: string
  onClick: () => void
}) {
  const [imgError, setImgError] = useState(false)

  return (
    <button
      onClick={onClick}
      style={{
        background: 'var(--bg2)', border: '0.5px solid var(--border)',
        borderRadius: 10, overflow: 'hidden', cursor: 'pointer',
        padding: 0, textAlign: 'left', width: '100%',
        transition: 'border-color .15s, transform .15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--green)'
        ;(e.currentTarget as HTMLElement).style.transform = 'scale(1.02)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)'
        ;(e.currentTarget as HTMLElement).style.transform = 'scale(1)'
      }}
    >
      <div style={{ height: 160, background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {!imgError ? (
          <img
            src={product.images[0]}
            alt={locale === 'th' ? product.nameTh : product.name}
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={() => setImgError(true)}
          />
        ) : (
          <ImageOff size={28} color="var(--text3)" />
        )}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--font-display)', marginBottom: 3 }}>
          {product.code}
        </div>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {locale === 'th' ? product.nameTh : product.name}
        </div>
        <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700, marginTop: 4, fontFamily: 'var(--font-display)' }}>
          ฿{product.price.toLocaleString()}
        </div>
      </div>
    </button>
  )
}
