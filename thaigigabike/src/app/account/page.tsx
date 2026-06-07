'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, Heart, Star, MessageSquare, ChevronRight } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useLang } from '@/lib/lang'

export default function AccountDashboard() {
  const { user, profile } = useAuth()
  const { t, locale } = useLang()
  const [counts, setCounts] = useState({ orders: 0, wishlist: 0, reviews: 0, messages: 0 })

  useEffect(() => {
    Promise.all([
      fetch('/api/account/orders').then(r => r.json()).catch(() => ({ orders: [] })),
      fetch('/api/account/wishlist').then(r => r.json()).catch(() => ({ items: [] })),
      fetch('/api/account/reviews').then(r => r.json()).catch(() => ({ reviews: [] })),
      fetch('/api/account/messages').then(r => r.json()).catch(() => ({ messages: [] })),
    ]).then(([o, w, r, m]) => setCounts({
      orders: o.orders?.length ?? 0,
      wishlist: w.items?.length ?? 0,
      reviews: r.reviews?.length ?? 0,
      messages: m.messages?.length ?? 0,
    }))
  }, [])

  const displayName = profile?.full_name || user?.email?.split('@')[0] || ''
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB', { year: 'numeric', month: 'long' })
    : ''

  const cards = [
    { href: '/account/orders',   icon: <Package size={20} />,       label: t.account.orders,   count: counts.orders,   color: 'var(--green)' },
    { href: '/account/wishlist', icon: <Heart size={20} />,         label: t.account.wishlist, count: counts.wishlist, color: '#ef4444' },
    { href: '/account/reviews',  icon: <Star size={20} />,          label: t.account.reviews,  count: counts.reviews,  color: '#f59e0b' },
    { href: '/account/messages', icon: <MessageSquare size={20} />, label: t.account.messages, count: counts.messages, color: '#3b82f6' },
  ]

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>{t.account.greeting}, {displayName} 👋</h1>
        {memberSince && <p style={{ fontSize: 14, color: 'var(--text3)', marginTop: 4 }}>{t.account.memberSince} {memberSince}</p>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        {cards.map(c => (
          <Link key={c.href} href={c.href} style={{
            background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12,
            padding: '18px 20px', textDecoration: 'none', display: 'block',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ color: c.color, display: 'flex' }}>{c.icon}</span>
              <ChevronRight size={16} color="var(--text3)" />
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>{c.count}</div>
            <div style={{ fontSize: 14, color: 'var(--text2)' }}>{c.label}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
