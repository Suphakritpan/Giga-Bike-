'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Search, Zap, Menu, X, Sun, Moon } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { useLang } from '@/lib/lang'
import { useTheme } from '@/lib/theme'
import type { Locale } from '@/lib/i18n'

export function Navbar() {
  const { totalItems } = useCart()
  const { t, locale, setLocale } = useLang()
  const { theme, toggle } = useTheme()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <header className="navbar-bg" style={{
      position: 'sticky', top: 0, zIndex: 100,
      backdropFilter: 'blur(12px)',
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
        <nav style={{ display: 'flex', gap: 4, flex: 1, marginLeft: 8 }} className="desktop-nav">
          {[
            { href: '/', label: t.nav.home },
            { href: '/products', label: t.nav.products },
            { href: '/categories', label: t.nav.categories },
            { href: '/gallery', label: t.nav.gallery },
            { href: '/racing', label: t.nav.racing },
            { href: '/contact', label: t.nav.contact },
          ].map(({ href, label }) => (
            <Link key={href} href={href} style={{
              padding: '7px 14px', borderRadius: 8, fontSize: 18, fontWeight: 600,
              color: 'var(--text2)', textDecoration: 'none',
              transition: 'color .15s, background .15s',
            }}
            onMouseEnter={e => {
              (e.target as HTMLElement).style.color = 'var(--text)'
              ;(e.target as HTMLElement).style.background = 'var(--bg3)'
            }}
            onMouseLeave={e => {
              (e.target as HTMLElement).style.color = 'var(--text2)'
              ;(e.target as HTMLElement).style.background = 'transparent'
            }}>
              {label}
            </Link>
          ))}
        </nav>

        {/* Right actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 0 }}>

          {/* Search */}
          {searchOpen ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg3)', border: '1px solid var(--green)', borderRadius: 8, padding: '7px 14px' }}>
              <Search size={15} color="var(--green)" />
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    router.push(`/search?q=${encodeURIComponent(searchQuery)}`)
                    setSearchOpen(false)
                    setSearchQuery('')
                  }
                  if (e.key === 'Escape') setSearchOpen(false)
                }}
                placeholder={t.nav.search}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 18, width: 160 }}
              />
              <button onClick={() => setSearchOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex' }}>
                <X size={15} />
              </button>
            </div>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="btn-ghost" style={{ padding: '7px 11px' }}>
              <Search size={17} />
            </button>
          )}

          {/* Theme toggle — render after mount only to avoid hydration mismatch */}
          <button
            onClick={toggle}
            className="btn-ghost"
            style={{ padding: '7px 11px' }}
            title={theme === 'dark' ? 'ธีมสว่าง' : 'ธีมมืด'}
            suppressHydrationWarning
          >
            {mounted
              ? theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />
              : <Moon size={17} />
            }
          </button>

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
          <button className="mobile-menu-btn btn-ghost" style={{ padding: '7px 11px', display: 'none' }} onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg2)', padding: '12px 20px' }}>
          {[
            { href: '/', label: t.nav.home },
            { href: '/products', label: t.nav.products },
            { href: '/categories', label: t.nav.categories },
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
          ].map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)} style={{
              display: 'block', padding: '12px 0', borderBottom: '1px solid var(--border)',
              color: 'var(--text2)', textDecoration: 'none', fontSize: 19, fontWeight: 600,
            }}>
              {label}
            </Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
      `}</style>
    </header>
  )
}
