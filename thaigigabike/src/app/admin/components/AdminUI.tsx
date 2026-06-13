'use client'
import { Search } from 'lucide-react'

/**
 * Small building blocks shared across the admin dashboard tabs. Extracted from
 * admin/page.tsx so the search box, pager, and table frame are defined once
 * (they were duplicated verbatim across the products/stock/orders tabs).
 * Styling is unchanged from the original inline markup.
 */

/** Search box with a leading magnifier icon (products / stock / orders tabs). */
export function AdminSearchInput({ value, onChange, placeholder }: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 360 }}>
      <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
      <input
        className="input"
        style={{ paddingLeft: 30, fontSize: 14 }}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

/** Centered prev/next pager. Renders nothing when there is only one page. */
export function AdminPagination({ page, totalPages, onPageChange }: {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 14 }}>
      <button className="btn-ghost" style={{ padding: '4px 10px' }} disabled={page === 1} onClick={() => onPageChange(page - 1)}>‹</button>
      <span style={{ fontSize: 14, color: 'var(--text2)' }}>หน้า {page} / {totalPages}</span>
      <button className="btn-ghost" style={{ padding: '4px 10px' }} disabled={page === totalPages} onClick={() => onPageChange(page + 1)}>›</button>
    </div>
  )
}

/** Bordered table card with the standard uppercase header row; pass tbody rows as children. */
export function AdminTableShell({ headers, children }: {
  headers: string[]
  children: React.ReactNode
}) {
  return (
    <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: 'var(--bg3)' }}>
          <tr>
            {headers.map(h => (
              <th key={h} style={{ padding: '9px 12px', textAlign: 'left', fontSize: 12, color: 'var(--text3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
