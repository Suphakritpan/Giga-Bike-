import type { ReactNode } from 'react'

/** Dashboard summary tile (icon + big value + label + optional sub-line). */
export function StatCard({ icon, value, label, color, sub }: { icon: ReactNode; value: number | string; label: string; color: string; sub?: string }) {
  return (
    <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'center' }}>
      <div style={{ width: 42, height: 42, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color, lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 14, color: 'var(--text2)', marginTop: 1 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  )
}
