'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, User, MapPin, Package, Heart, Star,
  MessageSquare, LifeBuoy, Settings, LogOut, Clock,
} from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useLang } from '@/lib/lang'

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading, signOut } = useAuth()
  const { t, locale } = useLang()
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    await signOut()
    router.push('/')
    router.refresh()
  }

  const NAV = [
    { href: '/account',           icon: <LayoutDashboard size={17} />, label: t.account.dashboard },
    { href: '/account/orders',    icon: <Package size={17} />,         label: t.account.orders },
    { href: '/account/wishlist',  icon: <Heart size={17} />,           label: t.account.wishlist },
    { href: '/account/history',   icon: <Clock size={17} />,           label: locale === 'th' ? 'ประวัติการดู' : 'History' },
    { href: '/account/addresses', icon: <MapPin size={17} />,          label: t.account.addresses },
    { href: '/account/reviews',   icon: <Star size={17} />,            label: t.account.reviews },
    { href: '/account/messages',  icon: <MessageSquare size={17} />,   label: t.account.messages },
    { href: '/account/tickets',   icon: <LifeBuoy size={17} />,        label: t.account.tickets },
    { href: '/account/profile',   icon: <User size={17} />,            label: t.account.profile },
    { href: '/account/settings',  icon: <Settings size={17} />,        label: t.account.settings },
  ]

  if (loading) {
    return (
      <div className="container section" style={{ textAlign: 'center', color: 'var(--text3)' }}>
        <div style={{ width: 40, height: 40, border: '3px solid var(--green)', borderTopColor: 'transparent', borderRadius: '50%', margin: '40px auto', animation: 'spin .8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!user) return null // middleware redirects; safety guard

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Member'
  const initial = displayName.charAt(0).toUpperCase()

  return (
    <div className="container section">
      <div className="account-grid">
        {/* Sidebar */}
        <aside>
          <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 14, padding: 18, position: 'sticky', top: 76 }}>
            {/* User chip */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: '0.5px solid var(--border)' }}>
              <div style={{ width: 46, height: 46, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 20, fontFamily: 'var(--font-display)' }}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : initial}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
              </div>
            </div>

            {/* Nav */}
            <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {NAV.map(item => {
                const active = item.href === '/account' ? pathname === '/account' : pathname.startsWith(item.href)
                return (
                  <Link key={item.href} href={item.href} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8,
                    fontSize: 14, fontWeight: 600, textDecoration: 'none',
                    color: active ? 'var(--green)' : 'var(--text2)',
                    background: active ? 'rgba(34,197,94,.1)' : 'transparent',
                  }}>
                    {item.icon} {item.label}
                  </Link>
                )
              })}
              <button onClick={handleLogout} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8,
                fontSize: 14, fontWeight: 600, color: 'var(--red)', background: 'none', border: 'none',
                cursor: 'pointer', marginTop: 6, textAlign: 'left',
              }}>
                <LogOut size={17} /> {t.account.logout}
              </button>
            </nav>
          </div>
        </aside>

        {/* Main */}
        <div style={{ minWidth: 0 }}>{children}</div>
      </div>

      <style>{`
        .account-grid { display: grid; grid-template-columns: 240px 1fr; gap: 24px; align-items: start; }
        @media (max-width: 860px) { .account-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  )
}
