'use client'

type Props = {
  title: string
  /** Short helper line under the title. */
  subtitle?: string
  /** Right-aligned actions (buttons, filters). */
  actions?: React.ReactNode
}

/** Standard page heading for account/admin pages — one h1 per page. */
export function PageHeader({ title, subtitle, actions }: Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      gap: 12, flexWrap: 'wrap', marginBottom: 20,
    }}>
      <div>
        <h1 className="page-title" style={{ marginBottom: subtitle ? 4 : 0 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 14, color: 'var(--text2)' }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  )
}
