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

export const authInput: React.CSSProperties = {
  width: '100%', padding: '11px 14px', fontSize: 16,
  border: '1px solid var(--border2)', borderRadius: 9,
  background: 'var(--bg3)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
}

export const authLabel: React.CSSProperties = {
  fontSize: 13, color: 'var(--text2)', display: 'block', marginBottom: 5, fontWeight: 600,
}
