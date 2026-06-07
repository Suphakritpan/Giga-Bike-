'use client'
import Link from 'next/link'
import { Zap } from 'lucide-react'

export function AuthShell({
  title, subtitle, children, footer,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 10, textDecoration: 'none' }}>
            <Zap size={22} color="var(--green)" strokeWidth={2.5} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>
              Thai<span style={{ color: 'var(--green)' }}>Giga</span>Bike
            </span>
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>{title}</h1>
          {subtitle && <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.5 }}>{subtitle}</p>}
        </div>

        <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 28 }}>
          {children}
        </div>

        {footer && (
          <p style={{ textAlign: 'center', marginTop: 18, fontSize: 14, color: 'var(--text2)' }}>
            {footer}
          </p>
        )}
      </div>
    </div>
  )
}

export function GoogleButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%',
        background: 'var(--bg3)', color: 'var(--text)', border: '1px solid var(--border2)',
        borderRadius: 9, padding: '11px 16px', fontSize: 15, fontWeight: 600, cursor: 'pointer',
      }}
    >
      <svg width="17" height="17" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#FFC107" d="M43.6 20.5h-1.9V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C33.6 6.1 29 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
        <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C33.6 6.1 29 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
        <path fill="#4CAF50" d="M24 44c5 0 9.5-1.9 12.9-5l-6-5c-1.9 1.4-4.3 2.2-6.9 2.2-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.2 44 24 44z"/>
        <path fill="#1976D2" d="M43.6 20.5H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6 5C40.9 36 44 30.6 44 24c0-1.3-.1-2.3-.4-3.5z"/>
      </svg>
      {label}
    </button>
  )
}

export const authInput: React.CSSProperties = {
  width: '100%', padding: '11px 14px', fontSize: 16,
  border: '1px solid var(--border2)', borderRadius: 9,
  background: 'var(--bg3)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
}

export const authLabel: React.CSSProperties = {
  fontSize: 13, color: 'var(--text2)', display: 'block', marginBottom: 5, fontWeight: 600,
}
