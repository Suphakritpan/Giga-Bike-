'use client'
import { useState, useEffect } from 'react'
import { Zap } from 'lucide-react'

export function PageLoader() {
  const [visible, setVisible] = useState(true)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), 700)
    const t2 = setTimeout(() => setVisible(false), 1050)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 20,
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.35s ease',
      pointerEvents: fading ? 'none' : 'all',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Zap size={36} color="var(--green)" strokeWidth={2.5} />
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 700, color: 'var(--text)', letterSpacing: '.02em' }}>
          Thai<span style={{ color: 'var(--green)' }}>Giga</span>Bike
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ width: 180, height: 3, background: 'var(--border)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          background: 'var(--green)',
          borderRadius: 999,
          animation: 'loader-bar 0.85s cubic-bezier(.4,0,.2,1) forwards',
        }} />
      </div>
    </div>
  )
}
