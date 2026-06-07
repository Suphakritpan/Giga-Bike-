'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { ShoppingCart, Search, Zap, Menu, X, Sun, Moon, Bell, User } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { useLang } from '@/lib/lang'
import { useTheme } from '@/lib/theme'
import { useAuth } from '@/lib/auth/AuthContext'
import { recordSearch } from '@/lib/recentlyViewed'
import type { Locale } from '@/lib/i18n'

const NOTIF_KEY = 'gigabike-notif-seen'

export function Navbar() {
  const { totalItems } = useCart()
  const { t, locale, setLocale } = useLang()
  const { theme, toggle } = useTheme()
  const { user, profile } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [searchOpen, setSearchOpen]   = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted]         = useState(false)
  const [hasNew, setHasNew]           = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check for new announcements vs last-seen timestamp
    const lastSeen = localStorage.getItem(NOTIF_KEY) ?? '0'
    fetch('/api/announcements')
      .then(r => r.json())
      .then(d => {
        const items: { created_at: string }[] = d.announcements ?? []
        const hasUnseen = items.some(a => new Date(a.created_at).getTime() > parseInt(lastSeen, 10))
        setHasNew(hasUnseen)
      })
      .catch(() => {})
  }, [])

  const markSeen = () => {
    localStorage.setItem(NOTIF_KEY, Date.now().toString())
    setHasNew(false)
  }

  return (
    <header className="navbar-bg" style={{
      position: 'sticky', top: 0, zIndex: 100,
      borderBottom: '1px solid var(--border)',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 16, height: 60 }}>

        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <Zap size={20} color="var(--green)" strokeWidth={2.5} />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '.02em' }}>
            Thai<span style={{ color: 'var(--green)' }}>Giga</span>Bike
          </span>
        </Link>

        {/* Desktop nav */}
        <nav style={{ display: 'flex', gap: 2, flex: 1, marginLeft: 8 }} className="desktop-nav">
          {[
            { href: '/', label: t.nav.home },
            { href: '/products', label: t.nav.products },
            { href: '/gallery', label: t.nav.gallery },
            { href: '/racing', label: t.nav.racing },
            { href: '/contact', label: t.nav.contact },
          ].map(({ href, label }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className="nav-link"
                data-active={active}
                aria-current={active ? 'page' : undefined}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>

          {/* Search */}
          {searchOpen ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg3)', border: '1px solid var(--green)', borderRadius: 9, padding: '7px 12px' }}>
              <Search size={15} color="var(--green)" />
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    recordSearch(searchQuery)
                    router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
                    setSearchOpen(false)
                    setSearchQuery('')
                  }
                  if (e.key === 'Escape') setSearchOpen(false)
                }}
                placeholder={t.nav.search}
                aria-label={locale === 'th' ? 'ค้นหาสินค้า' : 'Search products'}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 16, width: 170 }}
              />
              <button onClick={() => setSearchOpen(false)} aria-label={locale === 'th' ? 'ปิดค้นหา' : 'Close search'}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex' }}>
                <X size={15} />
              </button>
            </div>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="icon-btn" aria-label={locale === 'th' ? 'ค้นหา' : 'Search'}>
              <Search size={18} />
            </button>
          )}

          {/* Notification bell — single anchor (no nested button) */}
          <Link
            href="/notifications"
            onClick={markSeen}
            className="icon-btn"
            aria-label={locale === 'th' ? 'การแจ้งเตือน' : 'Notifications'}
            style={{ position: 'relative' }}
          >
            <Bell size={18} />
            {mounted && hasNew && (
              <span style={{
                position: 'absolute', top: 7, right: 8,
                width: 8, height: 8, borderRadius: '50%',
                background: '#ef4444',
                border: '2px solid var(--bg)',
                display: 'block',
              }} />
            )}
          </Link>

          {/* Theme toggle — render after mount only to avoid hydration mismatch */}
          <button
            onClick={toggle}
            className="icon-btn"
            aria-label={theme === 'dark'
              ? (locale === 'th' ? 'สลับเป็นธีมสว่าง' : 'Switch to light theme')
              : (locale === 'th' ? 'สลับเป็นธีมมืด'  : 'Switch to dark theme')}
            suppressHydrationWarning
          >
            {mounted
              ? theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />
              : <Moon size={18} />
            }
          </button>

          {/* Account */}
          <Link
            href={user ? '/account' : '/login'}
            className="icon-btn"
            aria-label={user ? t.account.title : t.auth.login}
            style={{ position: 'relative' }}
          >
            {user && profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
            ) : user ? (
              <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--green)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, fontFamily: 'var(--font-display)' }}>
                {(profile?.full_name || user.email || '?').charAt(0).toUpperCase()}
              </span>
            ) : (
              <User size={18} />
            )}
          </Link>

          {/* Language toggle */}
          <div style={{ display: 'flex', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, overflow: 'hidden' }}>
            {(['th', 'en'] as Locale[]).map(l => (
              <button key={l} onClick={() => setLocale(l)} style={{
                padding: '7px 11px', fontSize: 16, fontWeight: 700,
                border: 'none', cursor: 'pointer',
                background: locale === l ? 'var(--green)' : 'transparent',
                color: locale === l ? '#fff' : 'var(--text2)',
                transition: 'all .15s',
              }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Cart */}
          <Link href="/cart" style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'var(--green)', color: '#fff',
              border: 'none', borderRadius: 8,
              padding: '8px 16px', fontSize: 18, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'var(--font-display)',
              transition: 'background .15s',
            }}>
              <ShoppingCart size={17} />
              {t.nav.cart}
              {totalItems > 0 && (
                <span style={{
                  background: '#fff', color: 'var(--green)',
                  borderRadius: 999, padding: '1px 8px', fontSize: 14, fontWeight: 800,
                }}>
                  {totalItems}
                </span>
              )}
            </button>
          </Link>

          {/* Mobile menu toggle */}
          <button
            className="mobile-menu-btn icon-btn"
            style={{ display: 'none' }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? (locale === 'th' ? 'ปิดเมนู' : 'Close menu') : (locale === 'th' ? 'เปิดเมนู' : 'Open menu')}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="mobile-menu-panel" style={{ borderTop: '1px solid var(--border)', background: 'var(--bg2)', padding: '8px 20px 16px' }}>
          {[
            { href: '/', label: t.nav.home },
            { href: '/products', label: t.nav.products },
            { href: '/gallery', label: t.nav.gallery },
            { href: '/racing', label: t.nav.racing },
            { href: '/dealer', label: t.nav.dealer },
            { href: '/payment', label: t.nav.payment },
            { href: '/contact', label: t.nav.contact },
            { href: '/support', label: t.nav.support },
            { href: '/notifications', label: t.nav.notifications },
            { href: '/messages', label: t.nav.messages },
            { href: '/reviews', label: t.nav.reviews },
            { href: '/order', label: t.nav.trackOrder },
            user
              ? { href: '/account', label: t.account.title }
              : { href: '/login', label: t.auth.login },
            { href: '/orders', label: locale === 'th' ? 'ประวัติออเดอร์ (Guest)' : 'Order History (Guest)' },
          ].map(({ href, label }) => {
            const active = href === '/' ? pathname === '/' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                aria-current={active ? 'page' : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '13px 12px', borderBottom: '1px solid var(--border)',
                  color: active ? 'var(--green)' : 'var(--text2)',
                  textDecoration: 'none', fontSize: 18, fontWeight: 600,
                  borderLeft: `3px solid ${active ? 'var(--green)' : 'transparent'}`,
                  background: active ? 'rgba(34,197,94,.06)' : 'transparent',
                  borderRadius: active ? '0 8px 8px 0' : 0,
                }}
              >
                {label}
              </Link>
            )
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        .mobile-menu-panel {
          animation: navSlideDown .2s ease;
          max-height: calc(100vh - 60px);
          overflow-y: auto;
        }
        @keyframes navSlideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mobile-menu-panel { animation: none; }
        }
      `}</style>
    </header>
  )
}
