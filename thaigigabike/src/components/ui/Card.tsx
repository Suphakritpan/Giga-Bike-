'use client'

type Props = {
  children: React.ReactNode
  /** Small uppercase section heading shown above the content. */
  title?: React.ReactNode
  /** Extra inline style on the card box. */
  style?: React.CSSProperties
}

/**
 * Content card — the standard box used across account/admin pages.
 * Replaces ad-hoc `background: var(--bg2); border: ...` blocks.
 */
export function Card({ children, title, style }: Props) {
  return (
    <div
      style={{
        background: 'var(--bg2)', border: '0.5px solid var(--border)',
        borderRadius: 14, padding: 20, marginBottom: 16,
        ...style,
      }}
    >
      {title && (
        <h3 style={{
          fontSize: 14, fontWeight: 700, color: 'var(--text3)',
          textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 12,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}
