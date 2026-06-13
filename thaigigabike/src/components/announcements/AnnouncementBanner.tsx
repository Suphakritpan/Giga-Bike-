'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLang } from '@/lib/lang'

type Ann = {
  id: string; title_th: string; title_en: string | null
  body_th: string | null; body_en: string | null; type: string
  image_url?: string | null; link_url?: string | null; link_label?: string | null
}

const TYPE_LABEL: Record<string, { th: string; en: string }> = {
  info:     { th: 'ข่าวสาร',    en: 'News' },
  promo:    { th: 'โปรโมชั่น',   en: 'Promotion' },
  update:   { th: 'อัปเดต',     en: 'Update' },
  shipping: { th: 'การจัดส่ง',  en: 'Shipping' },
}

/**
 * Featured announcement banner for the home page. Reads the public
 * /api/announcements feed (already schedule-filtered) and highlights the
 * top entry — preferring one with an image. Renders nothing if there are none.
 */
export function AnnouncementBanner() {
  const { locale } = useLang()
  const [ann, setAnn] = useState<Ann | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/api/announcements')
      .then(r => r.json())
      .then((d: { announcements?: Ann[] }) => {
        if (!alive) return
        const list = d.announcements ?? []
        setAnn(list.find(a => a.image_url) ?? list[0] ?? null)
      })
      .catch(() => {})
    return () => { alive = false }
  }, [])

  if (!ann) return null

  const title = locale === 'th' ? ann.title_th : (ann.title_en || ann.title_th)
  const body  = locale === 'th' ? ann.body_th : (ann.body_en || ann.body_th)
  const label = ann.link_label || (locale === 'th' ? 'ดูเพิ่มเติม' : 'Learn more')
  const typeLabel = TYPE_LABEL[ann.type]?.[locale === 'th' ? 'th' : 'en']
  const isExternal = !!ann.link_url && /^https?:\/\//.test(ann.link_url)

  return (
    <section style={{ maxWidth: 1200, margin: '16px auto 0', padding: '0 16px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', borderRadius: 14, overflow: 'hidden', border: '0.5px solid var(--border)', background: 'var(--bg2)' }}>
        {ann.image_url && (
          <div style={{ flex: '1 1 280px', minHeight: 160, background: 'var(--bg3)' }}>
            <img src={ann.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }} />
          </div>
        )}
        <div style={{ flex: '2 1 320px', padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 8 }}>
          {typeLabel && (
            <span style={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: 700, color: 'var(--green)', background: 'rgba(34,197,94,.12)', padding: '2px 10px', borderRadius: 999 }}>
              {typeLabel}
            </span>
          )}
          <h2 style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--font-display)', lineHeight: 1.2 }}>{title}</h2>
          {body && <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{body}</p>}
          {ann.link_url && (
            isExternal
              ? <a href={ann.link_url} target="_blank" rel="noreferrer" className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: 4, fontSize: 14 }}>{label} →</a>
              : <Link href={ann.link_url} className="btn-primary" style={{ alignSelf: 'flex-start', marginTop: 4, fontSize: 14 }}>{label} →</Link>
          )}
        </div>
      </div>
    </section>
  )
}
