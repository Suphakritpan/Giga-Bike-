'use client'
import { useState } from 'react'
import Link from 'next/link'
import { X, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { products } from '@/data/products'
import { ProductCard } from '@/components/product/ProductCard'

// Racing-grade products
const RACING_PRODUCTS = products
  .filter(p => ['brake', 'suspension', 'chassis', 'drivetrain'].includes(p.category))
  .slice(0, 12)

// SR / Classic racing — official events & team bikes
const RACE_GALLERY = [
  { src: '/legacy/webgigabike.com/sr-gb1.jpg',                   caption: 'GIGA BIKE RACING TAME · Yamaha SR Race Build' },
  { src: '/legacy/webgigabike.com/srgiga3.jpg',                   caption: 'SR Race Bike · Full CNC Billet Custom' },
  { src: '/legacy/webgigabike.com/Racing%20Gb/sr-gb1.jpg',        caption: 'SR GB Racing · GIGA BIKE FACTORY' },
  { src: '/legacy/webgigabike.com/Racing%20Gb/gb5.jpg',           caption: 'GB Racing Team' },
  { src: '/legacy/webgigabike.com/Racing%20Gb/gb6.jpg',           caption: 'GB Racing Team' },
  { src: '/legacy/webgigabike.com/Racing%20Gb/srgiga3.jpg',       caption: 'SR GB Racing Build' },
  { src: '/legacy/webgigabike.com/official/of1.jpg',              caption: 'งานแสดงรถ · Official Event' },
  { src: '/legacy/webgigabike.com/official/of2.jpg',              caption: 'งานแสดงรถ · Official Event' },
  { src: '/legacy/webgigabike.com/official/of3.jpg',              caption: 'งานแสดงรถ · Official Event' },
  { src: '/legacy/webgigabike.com/official/of4.jpg',              caption: 'งานแสดงรถ · Official Event' },
  { src: '/legacy/webgigabike.com/official/of5.jpg',              caption: 'งานแสดงรถ · Official Event' },
  { src: '/legacy/webgigabike.com/official/of6.jpg',              caption: 'งานแสดงรถ · Official Event' },
  { src: '/legacy/webgigabike.com/official/of7.jpg',              caption: 'งานแสดงรถ · Official Event' },
  { src: '/legacy/webgigabike.com/official/of8.jpg',              caption: 'งานแสดงรถ · Official Event' },
  { src: '/legacy/webgigabike.com/th3/th1.jpg',                   caption: 'Thailand Race Event' },
  { src: '/legacy/webgigabike.com/th3/th2.jpg',                   caption: 'Thailand Race Event' },
  { src: '/legacy/webgigabike.com/th3/th6.jpg',                   caption: 'Thailand Race Event' },
  { src: '/legacy/webgigabike.com/th3/th7.jpg',                   caption: 'Thailand Race Event' },
  { src: '/legacy/webgigabike.com/th3/th8.jpg',                   caption: 'Thailand Race Event' },
]

// Yamaha R3 / modern class racing — GB team
const R3_RACING_GALLERY = [
  { src: '/legacy/webgigabike.com/Racing/r2m-1.jpg',              caption: 'Race Day · GigaBike Racing' },
  { src: '/legacy/webgigabike.com/Racing/r2m-2.jpg',              caption: 'Race Day · GigaBike Racing' },
  { src: '/legacy/webgigabike.com/Racing/r2m-3.jpg',              caption: 'Race Day · GigaBike Racing' },
  { src: '/legacy/webgigabike.com/Racing/r2m-4.jpg',              caption: 'Race Day · GigaBike Racing' },
  { src: '/legacy/webgigabike.com/R3/gb2.jpg',                    caption: 'Yamaha R3 · GB Racing' },
  { src: '/legacy/webgigabike.com/R3/gb3.jpg',                    caption: 'Yamaha R3 · GB Racing' },
  { src: '/legacy/webgigabike.com/R3/gb5.jpg',                    caption: 'Yamaha R3 · GB Racing' },
  { src: '/legacy/webgigabike.com/R3/gb%20racing%201.jpg',        caption: 'R3 GB Racing · CNC Billet Parts' },
  { src: '/legacy/webgigabike.com/R3/gb%20racing%202.jpg',        caption: 'R3 GB Racing · CNC Billet Parts' },
  { src: '/legacy/webgigabike.com/R3/gb-racing-3.jpg',            caption: 'R3 GB Racing · CNC Billet Parts' },
  { src: '/legacy/webgigabike.com/R3/gb-racing-4.jpg',            caption: 'R3 GB Racing · CNC Billet Parts' },
  { src: '/legacy/webgigabike.com/R3/gb-racing-5.jpg',            caption: 'R3 GB Racing · CNC Billet Parts' },
  { src: '/legacy/webgigabike.com/R3/gbracing-vor.jpg',           caption: 'GigaBike R3 · Vorachan Racing' },
]

// Racing parts photos
const PARTS_GALLERY = [
  { src: '/legacy/webgigabike.com/Racing/Footpeg-Road.jpg',       label: 'Race Footpeg (Road)' },
  { src: '/legacy/webgigabike.com/Racing/Footpeg-rc-rd.jpg',      label: 'Race Footpeg RC/RD' },
  { src: '/legacy/webgigabike.com/Racing/Footpeg-rc.jpg',         label: 'Race Footpeg RC' },
  { src: '/legacy/webgigabike.com/Racing/Footpeg-rd.jpg',         label: 'Race Footpeg RD' },
  { src: '/legacy/webgigabike.com/Racing/Footpegs2.jpg',          label: 'Racing Footpegs' },
  { src: '/legacy/webgigabike.com/Racing/Footpegs3.jpg',          label: 'Racing Footpegs' },
  { src: '/legacy/webgigabike.com/Racing/Footpegs4.jpg',          label: 'Racing Footpegs' },
  { src: '/legacy/webgigabike.com/Racing/Footpegs5.jpg',          label: 'Racing Footpegs' },
  { src: '/legacy/webgigabike.com/Ohlins/Brake-Racing-1.jpg',     label: 'Race Brake Kit' },
  { src: '/legacy/webgigabike.com/Ohlins/Brake-Racing-2.jpg',     label: 'Race Brake Kit' },
  { src: '/legacy/webgigabike.com/XSR/R15Racing-1.jpg',           label: 'R15 / XSR Racing Parts' },
  { src: '/legacy/webgigabike.com/XSR/R15Racing-2.jpg',           label: 'R15 / XSR Racing Parts' },
  { src: '/legacy/webgigabike.com/Ninja400/Foot-blkl-racing.jpg', label: 'Ninja 400 Race Footpeg (Black)' },
  { src: '/legacy/webgigabike.com/Ninja400/Foot-sil-racing.jpg',  label: 'Ninja 400 Race Footpeg (Silver)' },
  { src: '/legacy/webgigabike.com/CBR150/Footracing-1.jpg',       label: 'CBR150 Race Footpeg' },
  { src: '/legacy/webgigabike.com/CBR150/Footracing-4.jpg',       label: 'CBR150 Race Footpeg' },
]

/* ── Photo grid card ─── */
function RacePhoto({ src, caption, onClick }: { src: string; caption?: string; onClick?: () => void }) {
  const [err, setErr] = useState(false)
  return (
    <button
      onClick={onClick}
      style={{ background: 'none', border: 'none', padding: 0, cursor: onClick ? 'zoom-in' : 'default', borderRadius: 10, overflow: 'hidden', display: 'block', width: '100%' }}
    >
      <div style={{ background: 'var(--bg3)', borderRadius: 10, overflow: 'hidden', position: 'relative', aspectRatio: '4/3' }}>
        {!err ? (
          <img src={src} alt={caption || ''} loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .3s' }}
            onError={() => setErr(true)}
            onMouseEnter={e => { if (onClick) (e.target as HTMLImageElement).style.transform = 'scale(1.04)' }}
            onMouseLeave={e => { (e.target as HTMLImageElement).style.transform = 'scale(1)' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ImageOff size={28} color="var(--text3)" />
          </div>
        )}
        {caption && (
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,.7))', padding: '24px 12px 10px', fontSize: 12, color: 'rgba(255,255,255,.85)' }}>
            {caption}
          </div>
        )}
      </div>
    </button>
  )
}

/* ── Lightbox ─── */
function Lightbox({ photos, idx, onClose, onPrev, onNext }: {
  photos: { src: string; caption?: string }[]
  idx: number; onClose: () => void; onPrev: () => void; onNext: () => void
}) {
  const p = photos[idx]
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.94)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <button onClick={e => { e.stopPropagation(); onClose() }}
        style={{ position: 'absolute', top: 18, right: 18, background: 'rgba(255,255,255,.12)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', display: 'flex', padding: 8 }}>
        <X size={22} />
      </button>
      <button onClick={e => { e.stopPropagation(); onPrev() }}
        style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.12)', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer', display: 'flex', padding: '10px 8px' }}>
        <ChevronLeft size={28} />
      </button>
      <div onClick={e => e.stopPropagation()} style={{ maxWidth: 800, width: '100%', textAlign: 'center' }}>
        <img src={p.src} alt={p.caption || ''} style={{ maxWidth: '100%', maxHeight: '78vh', objectFit: 'contain', borderRadius: 8 }} />
        {p.caption && <p style={{ color: 'rgba(255,255,255,.6)', fontSize: 14, marginTop: 12 }}>{p.caption}</p>}
        <p style={{ color: 'rgba(255,255,255,.3)', fontSize: 12, marginTop: 6 }}>{idx + 1} / {photos.length}</p>
      </div>
      <button onClick={e => { e.stopPropagation(); onNext() }}
        style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,.12)', border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer', display: 'flex', padding: '10px 8px' }}>
        <ChevronRight size={28} />
      </button>
    </div>
  )
}

export default function RacingPage() {
  const { t, locale } = useLang()
  const [lightboxSet, setLightboxSet] = useState<'race' | 'r3' | 'parts' | null>(null)
  const [lightboxIdx, setLightboxIdx] = useState(0)

  const currentPhotos = lightboxSet === 'race' ? RACE_GALLERY : lightboxSet === 'r3' ? R3_RACING_GALLERY : PARTS_GALLERY
  const openLightbox = (set: 'race' | 'r3' | 'parts', idx: number) => { setLightboxSet(set); setLightboxIdx(idx) }
  const closeLightbox = () => setLightboxSet(null)
  const prevPhoto = () => setLightboxIdx(i => (i - 1 + currentPhotos.length) % currentPhotos.length)
  const nextPhoto = () => setLightboxIdx(i => (i + 1) % currentPhotos.length)

  return (
    <div>
      {/* ── Hero ─────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: 480, overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
        {/* Background — main race bike */}
        <img
          src="/legacy/webgigabike.com/sr-gb1.jpg"
          alt="GIGA BIKE RACING TAME"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%' }}
        />
        {/* Dark gradient overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,.82) 40%, rgba(0,0,0,.3) 100%)' }} />
        {/* Green accent stripe */}
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 5, background: 'var(--green)' }} />

        <div className="container" style={{ position: 'relative', zIndex: 1, paddingBottom: 56, paddingTop: 64 }}>
          <div className="badge badge-red" style={{ marginBottom: 16, fontSize: 13, letterSpacing: '.08em', background: 'rgba(220,38,38,.85)', border: 'none' }}>
            🏁 GIGA BIKE CNC FACTORY RACING TAME
          </div>
          <h1 style={{ fontSize: 58, color: '#fff', lineHeight: 1.05, marginBottom: 14, maxWidth: 600 }}>
            {t.racing.title}
          </h1>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,.7)', marginBottom: 28, maxWidth: 520, lineHeight: 1.7 }}>
            {t.racing.subtitle}
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="#gallery" style={{ textDecoration: 'none' }} className="btn-primary">
              {locale === 'th' ? 'ดูผลงานการแข่งขัน' : 'View Race Gallery'}
            </a>
            <a href="https://line.me/ti/p/~thaigigabike" target="_blank" rel="noopener"
              className="btn-outline" style={{ textDecoration: 'none', background: 'rgba(255,255,255,.08)', borderColor: 'rgba(255,255,255,.4)', color: '#fff' }}>
              {locale === 'th' ? 'สอบถาม Custom Parts' : 'Enquire Custom Parts'}
            </a>
          </div>
        </div>
      </section>

      {/* ── Racing DNA ─────────────────────────────── */}
      <section style={{ background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)', padding: '28px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
            {[
              { n: '01', text: t.racing.reason1 },
              { n: '02', text: t.racing.reason2 },
              { n: '03', text: t.racing.reason3 },
              { n: '04', text: t.racing.reason4 },
            ].map(r => (
              <div key={r.n} style={{ background: 'var(--bg3)', borderRadius: 10, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: 'var(--green)', flexShrink: 0, lineHeight: 1 }}>{r.n}</span>
                <span style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{r.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Race Gallery ─────────────────────────── */}
      <section id="gallery" className="section">
        <div className="container">
          <h2 style={{ fontSize: 32, marginBottom: 20 }}>
            {locale === 'th' ? '🏆 ผลงานการแข่งขัน' : '🏆 Race & Event Gallery'}
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {RACE_GALLERY.map((photo, i) => (
              <RacePhoto key={i} src={photo.src} caption={photo.caption} onClick={() => openLightbox('race', i)} />
            ))}
          </div>
        </div>
      </section>

      {/* ── R3 / Modern Class Racing ─────────────── */}
      <section style={{ background: 'var(--bg2)', borderTop: '0.5px solid var(--border)', padding: '48px 0' }}>
        <div className="container">
          <h2 style={{ fontSize: 32, marginBottom: 4 }}>
            {locale === 'th' ? '🏍️ R3 / Modern Class Racing' : '🏍️ R3 / Modern Class Racing'}
          </h2>
          <p style={{ color: 'var(--text2)', fontSize: 16, marginBottom: 24 }}>
            {locale === 'th'
              ? 'Yamaha R3 พร้อมชิ้นส่วน CNC จาก GigaBike ลงสนามแข่งโดย GB Racing Team'
              : 'Yamaha R3 fitted with GigaBike CNC parts, racing with GB Racing Team'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
            {R3_RACING_GALLERY.map((photo, i) => (
              <RacePhoto key={i} src={photo.src} caption={photo.caption} onClick={() => openLightbox('r3', i)} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Racing Parts Gallery ─────────────────── */}
      <section style={{ borderTop: '0.5px solid var(--border)', padding: '48px 0' }}>
        <div className="container">
          <h2 style={{ fontSize: 32, marginBottom: 4 }}>
            {locale === 'th' ? '⚙️ อะไหล่ Racing จากโรงงาน' : '⚙️ Factory Racing Parts'}
          </h2>
          <p style={{ color: 'var(--text2)', fontSize: 16, marginBottom: 24 }}>
            {locale === 'th'
              ? 'ชิ้นส่วน CNC Billet ที่ใช้งานบนสนามแข่งจริง — ผลิตและทดสอบในไทย'
              : 'CNC Billet parts proven on track — manufactured and tested in Thailand'}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            {PARTS_GALLERY.map((photo, i) => (
              <div key={i}>
                <RacePhoto src={photo.src} onClick={() => openLightbox('parts', i)} />
                <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 6, textAlign: 'center' }}>{photo.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Racing products from catalog ─────────── */}
      {RACING_PRODUCTS.length > 0 && (
        <section className="section">
          <div className="container">
            <h2 style={{ fontSize: 32, marginBottom: 4 }}>{t.racing.featuredTitle}</h2>
            <p style={{ color: 'var(--text2)', fontSize: 16, marginBottom: 24 }}>
              {locale === 'th' ? 'สินค้า Race Spec พร้อมจำหน่าย' : 'Race spec parts available now'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(182px, 1fr))', gap: 10, marginBottom: 24 }}>
              {RACING_PRODUCTS.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/products?cat=brake" className="btn-ghost" style={{ textDecoration: 'none', fontSize: 16 }}>
                {locale === 'th' ? 'อะไหล่เบรค' : 'Brake Parts'} →
              </Link>
              <Link href="/products?cat=chassis" className="btn-ghost" style={{ textDecoration: 'none', fontSize: 16 }}>
                {locale === 'th' ? 'ตัวถัง/แฮนด์' : 'Chassis / Bars'} →
              </Link>
              <Link href="/products?cat=suspension" className="btn-ghost" style={{ textDecoration: 'none', fontSize: 16 }}>
                {locale === 'th' ? 'โช๊ค/แผงคอ' : 'Suspension'} →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Custom order CTA ─────────────────────── */}
      <section style={{ background: '#111', padding: '56px 0', borderTop: '1px solid #222' }}>
        <div className="container" style={{ textAlign: 'center', maxWidth: 580 }}>
          <div className="badge badge-green" style={{ marginBottom: 16, display: 'inline-flex' }}>
            🏁 CUSTOM RACE SPEC
          </div>
          <h2 style={{ fontSize: 32, color: '#fff', marginBottom: 10 }}>
            {locale === 'th' ? 'ต้องการชิ้นส่วน Race Spec ตามแบบ?' : 'Need Custom Race Spec Parts?'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 16, marginBottom: 28, lineHeight: 1.7 }}>
            {locale === 'th'
              ? 'GigaBike รับออกแบบและผลิต CNC Billet ตามสเปค สำหรับรถแข่งทุกรุ่น · ติดต่อผ่าน LINE เพื่อรับใบเสนอราคา'
              : 'GigaBike designs and machines custom CNC parts to your racing spec — all models. Contact via LINE for a quote.'}
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="https://line.me/ti/p/~thaigigabike" target="_blank" rel="noopener"
              style={{ textDecoration: 'none', background: '#06C755', color: '#fff', borderRadius: 10, padding: '12px 28px', fontSize: 19, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              LINE: thaigigabike
            </a>
            <a href="tel:0814249407"
              style={{ textDecoration: 'none', background: 'transparent', color: 'rgba(255,255,255,.7)', border: '1.5px solid rgba(255,255,255,.25)', borderRadius: 10, padding: '12px 28px', fontSize: 19, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              081-424-9407
            </a>
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightboxSet && (
        <Lightbox
          photos={currentPhotos}
          idx={lightboxIdx}
          onClose={closeLightbox}
          onPrev={prevPhoto}
          onNext={nextPhoto}
        />
      )}
    </div>
  )
}
