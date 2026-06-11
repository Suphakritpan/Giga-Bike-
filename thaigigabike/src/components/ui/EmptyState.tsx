'use client'

type Props = {
  /** Lucide icon element, e.g. <Heart size={40} /> */
  icon?: React.ReactNode
  title: string
  description?: string
  /** Call-to-action — <Link className="btn-primary"> or <Button>. */
  action?: React.ReactNode
}

/**
 * Standard empty state — what the user sees the first time they open a page
 * with no data yet. Always offer a next step (action) when one exists.
 */
export function EmptyState({ icon, title, description, action }: Props) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text3)' }}>
      {icon && (
        <span style={{ display: 'block', margin: '0 auto 12px', opacity: 0.4, width: 'fit-content' }} aria-hidden="true">
          {icon}
        </span>
      )}
      <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text2)', marginBottom: description ? 4 : 16 }}>{title}</p>
      {description && <p style={{ fontSize: 14, marginBottom: 16 }}>{description}</p>}
      {action}
    </div>
  )
}
