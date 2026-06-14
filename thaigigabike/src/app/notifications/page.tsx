'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Bell, Info, Tag, RefreshCw, Truck, Package, Search } from 'lucide-react'
import { useLang } from '@/lib/lang'

type AnnouncementType = 'info' | 'promo' | 'update' | 'shipping'

type Announcement = {
  id: string
  title_th: string | null
  title_en: string | null
  body_th: string | null
  body_en: string | null
  type: AnnouncementType
  pinned: boolean
  created_at: string
  image_url?: string | null
  link_url?: string | null
  link_label?: string | null
}

const TYPE_ICON: Record<AnnouncementType, React.ReactNode> = {
  info:     <Info size={15} />,
  promo:    <Tag  size={15} />,
  update:   <RefreshCw size={15} />,
  shipping: <Truck size={15} />,
}

const TYPE_COLOR: Record<AnnouncementType, string> = {
  info:     'var(--green)',
  promo:    'var(--orange)',
  update:   'var(--text2)',
  shipping: '#2563eb',
}

// Static fallback announcements when DB table doesn't exist yet
const STATIC_TH: Announcement[] = [
  {
    id: 'static-1', title_th: 'ส่ง EMS ฟรีทุกออเดอร์ในประเทศไทย', title_en: null,
    body_th: 'ออเดอร์ทุกรายการในประเทศได้รับการจัดส่ง EMS ฟรี ไม่มีขั้นต่ำ จัดส่งทุกวันอย่างช้าภายใน 3 วัน', body_en: null,
    type: 'shipping', pinned: true, created_at: new Date().toISOString(),
  },
  {
    id: 'static-2', title_th: 'สินค้าใหม่ CNC Billet สำหรับ Honda CB750', title_en: null,
    body_th: 'เพิ่มชิ้นส่วนใหม่กว่า 30 รายการสำหรับ Honda CB750 รวมถึง Front Fender Bracket, Nut Sets และ Engine Covers', body_en: null,
    type: 'update', pinned: false, created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'static-3', title_th: 'ออเดอร์ต่างประเทศ — ตอนนี้รองรับ Western Union', title_en: null,
    body_th: 'ลูกค้าต่างประเทศสามารถชำระเงินผ่าน Western Union, MoneyGram และ PayPal แล้ว ติดต่อ LINE ก่อนสั่งเพื่อยืนยัน', body_en: null,
    type: 'info', pinned: false, created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

const STATIC_EN: Announcement[] = [
  {
    id: 'static-1', title_th: null, title_en: 'Free EMS Shipping on All Thai Orders',
    body_th: null, body_en: 'Every domestic order ships free via EMS — no minimum. Dispatched daily within 3 days.',
    type: 'shipping', pinned: true, created_at: new Date().toISOString(),
  },
  {
    id: 'static-2', title_th: null, title_en: 'New CNC Parts for Honda CB750',
    body_th: null, body_en: 'Added 30+ new parts for Honda CB750 including Front Fender Brackets, Nut Sets and Engine Covers.',
    type: 'update', pinned: false, created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'static-3', title_th: null, title_en: 'International Orders — Now Accepting Western Union',
    body_th: null, body_en: 'International customers can now pay via Western Union, MoneyGram and PayPal. Contact LINE to confirm before ordering.',
    type: 'info', pinned: false, created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

function fmtDate(iso: string, locale: string) {
  return new Date(iso).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

export default function NotificationsPage() {
  const { t, locale } = useLang()
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/announcements')
      .then(r => r.json())
      .then(d => {
        const list: Announcement[] = d.announcements ?? []
        setItems(list.length > 0 ? list : (locale === 'th' ? STATIC_TH : STATIC_EN))
      })
      .catch(() => setItems(locale === 'th' ? STATIC_TH : STATIC_EN))
      .finally(() => setLoading(false))
  }, [locale])

  return (
    <div>
      {/* Header */}
      <section style={{ background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)', padding: '32px 0' }}>
        <div className="container" style={{ maxWidth: 680 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Bell size={22} color="var(--green)" />
            <h1 style={{ fontSize: 34 }}>{t.notifications.title}</h1>
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 16 }}>{t.notifications.subtitle}</p>
        </div>
      </section>

      <div className="container section" style={{ maxWidth: 680 }}>

        {/* Quick action: order tracking */}
        <div style={{
          background: 'rgba(34,197,94,.07)', border: '1px solid rgba(34,197,94,.25)',
          borderRadius: 12, padding: '16px 20px', marginBottom: 28,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Package size={20} color="var(--green)" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>
                {locale === 'th' ? 'ต้องการติดตามออเดอร์?' : 'Looking for your order?'}
              </div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>
                {locale === 'th' ? 'ดูสถานะออเดอร์และเลขพัสดุได้ทันที' : 'Check order status and tracking number instantly'}
              </div>
            </div>
          </div>
          <Link href="/order" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'var(--green)', color: '#fff',
            padding: '8px 18px', borderRadius: 8, fontWeight: 700, fontSize: 14,
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            <Search size={14} />
            {t.notifications.trackOrder}
          </Link>
        </div>

        {/* Announcements */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 90, background: 'var(--bg3)', borderRadius: 12 }} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
            <Bell size={40} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.4 }} />
            <p style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>{t.notifications.empty}</p>
            <p style={{ fontSize: 14 }}>{t.notifications.emptySub}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {items.map(item => {
              const title = locale === 'th' ? (item.title_th ?? item.title_en) : (item.title_en ?? item.title_th)
              const body  = locale === 'th' ? (item.body_th  ?? item.body_en)  : (item.body_en  ?? item.body_th)
              const color = TYPE_COLOR[item.type] ?? 'var(--green)'
              const typeLabel = (t.notifications.types as Record<string, string>)[item.type] ?? item.type
              // Only follow http(s)/same-origin links (blocks javascript: etc.)
              const safeLink = item.link_url && (/^https?:\/\//i.test(item.link_url) || item.link_url.startsWith('/')) ? item.link_url : null
              const isExternal = !!safeLink && /^https?:\/\//i.test(safeLink)
              return (
                <div key={item.id} style={{
                  background: 'var(--bg2)',
                  border: `0.5px solid ${item.pinned ? color : 'var(--border)'}`,
                  borderLeft: `3px solid ${color}`,
                  borderRadius: 12, padding: '16px 20px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                    <span style={{ color, display: 'flex' }}>{TYPE_ICON[item.type]}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 999,
                      background: `${color}22`, color,
                    }}>
                      {typeLabel}
                    </span>
                    {item.pinned && (
                      <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                        {locale === 'th' ? '📌 ปักหมุด' : '📌 Pinned'}
                      </span>
                    )}
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text3)' }}>
                      {fmtDate(item.created_at, locale)}
                    </span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: body ? 6 : 0 }}>
                    {title}
                  </div>
                  {body && (
                    <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.65 }}>{body}</div>
                  )}
                  {item.image_url && (
                    <img src={item.image_url} alt="" style={{ marginTop: 10, maxHeight: 200, width: '100%', objectFit: 'cover', borderRadius: 8, border: '0.5px solid var(--border)', display: 'block' }}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                  )}
                  {safeLink && (
                    <a href={safeLink} {...(isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
                      className="btn-ghost" style={{ marginTop: 10, display: 'inline-flex', fontSize: 13 }}>
                      {item.link_label || (locale === 'th' ? 'ดูเพิ่มเติม' : 'Learn more')} →
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
