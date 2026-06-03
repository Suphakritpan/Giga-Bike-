'use client'
import Link from 'next/link'
import { useState } from 'react'
import { ShoppingCart, Search, Zap, Menu, X } from 'lucide-react'
import { useCart } from '@/lib/cart'
import { useLang } from '@/lib/lang'
import type { Locale } from '@/lib/i18n'

export function Navbar() {
  const { totalItems } = useCart()
  const { t, locale, setLocale } = useLang()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(15,15,15,.95)',
      backdropFilter: 'blur(12px)',
      borderBottom: '0.5px solid var(--border)',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 16, height: 56 }}>

        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <Zap size={18} color="var(--green)" />
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '.02em' }}>
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
            { href: '/contact', label: t.nav.contact },
          ].map(({ href, label }) => (
            <Link key={href} href={href} style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg3)', border: '0.5px solid var(--green)', borderRadius: 8, padding: '6px 12px' }}>
              <Search size={14} color="var(--green)" />
              <input
                autoFocus
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    window.location.href = `/products?q=${encodeURIComponent(searchQuery)}`
                  }
                  if (e.key === 'Escape') setSearchOpen(false)
                }}
                placeholder={t.nav.search}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--text)', fontSize: 13, width: 160 }}
              />
              <button onClick={() => setSearchOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex' }}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <button onClick={() => setSearchOpen(true)} className="btn-ghost" style={{ padding: '7px 10px' }}>
              <Search size={16} />
            </button>
          )}

          {/* Language toggle */}
          <div style={{ display: 'flex', background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 8, overflow: 'hidden' }}>
            {(['th', 'en'] as Locale[]).map(l => (
              <button key={l} onClick={() => setLocale(l)} style={{
                padding: '6px 10px', fontSize: 12, fontWeight: 500,
                border: 'none', cursor: 'pointer',
                background: locale === l ? 'var(--green)' : 'transparent',
                color: locale === l ? '#000' : 'var(--text2)',
                transition: 'all .15s',
              }}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Cart */}
          <Link href="/cart" style={{ textDecoration: 'none' }}>
            <button style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--green)', color: '#000',
              border: 'none', borderRadius: 8,
              padding: '7px 14px', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', fontFamily: 'var(--font-display)',
              transition: 'background .15s',
            }}>
              <ShoppingCart size={15} />
              {t.nav.cart}
              {totalItems > 0 && (
                <span style={{
                  background: '#000', color: 'var(--green)',
                  borderRadius: 999, padding: '1px 7px', fontSize: 11, fontWeight: 700,
                }}>
                  {totalItems}
                </span>
              )}
            </button>
          </Link>

          {/* Mobile menu toggle */}
          <button className="mobile-menu-btn btn-ghost" style={{ padding: '7px 10px', display: 'none' }} onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div style={{ borderTop: '0.5px solid var(--border)', background: 'var(--bg2)', padding: '12px 20px' }}>
          {[
            { href: '/', label: t.nav.home },
            { href: '/products', label: t.nav.products },
            { href: '/categories', label: t.nav.categories },
            { href: '/gallery', label: t.nav.gallery },
            { href: '/contact', label: t.nav.contact },
            { href: '/order', label: t.nav.trackOrder },
          ].map(({ href, label }) => (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)} style={{
              display: 'block', padding: '10px 0', borderBottom: '0.5px solid var(--border)',
              color: 'var(--text2)', textDecoration: 'none', fontSize: 15,
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
