'use client'
import { useState, useEffect } from 'react'
import { Search, LayoutList, LayoutGrid, ChevronDown } from 'lucide-react'
import { PRODUCT_SORT_OPTIONS } from './types'
import type { ProductSort } from './types'

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

export type AdminView = 'table' | 'grid'

/** Table/grid view state persisted in localStorage under `storageKey`. */
export function useAdminView(storageKey: string): [AdminView, (v: AdminView) => void] {
  const [view, setView] = useState<AdminView>('table')
  useEffect(() => {
    try { const v = localStorage.getItem(storageKey); if (v === 'grid' || v === 'table') setView(v) } catch { /* ignore */ }
  }, [storageKey])
  const change = (v: AdminView) => {
    setView(v)
    try { localStorage.setItem(storageKey, v) } catch { /* ignore */ }
  }
  return [view, change]
}

/** Segmented table / card-grid view switch. */
export function AdminViewToggle({ view, onChange }: { view: AdminView; onChange: (v: AdminView) => void }) {
  const btn = (v: AdminView, label: string, icon: React.ReactNode) => (
    <button onClick={() => onChange(v)} aria-pressed={view === v} title={label}
      style={{
        padding: '6px 10px', border: 'none', cursor: 'pointer', display: 'flex',
        background: view === v ? '#22c55e' : 'transparent',
        color: view === v ? '#000' : 'var(--text3)',
      }}>
      {icon}
    </button>
  )
  return (
    <div style={{ display: 'flex', border: '1px solid var(--border2)', borderRadius: 8, overflow: 'hidden' }} role="group" aria-label="สลับมุมมอง">
      {btn('table', 'มุมมองตาราง', <LayoutList size={15} />)}
      {btn('grid', 'มุมมองการ์ด', <LayoutGrid size={15} />)}
    </div>
  )
}

/** Sort dropdown (price / stock, asc / desc) for the products + stock tabs. */
export function AdminSortSelect({ value, onChange }: { value: ProductSort; onChange: (v: ProductSort) => void }) {
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <select className="input" value={value} onChange={e => onChange(e.target.value as ProductSort)}
        aria-label="เรียงลำดับ"
        style={{ fontSize: 14, padding: '7px 30px 7px 12px', appearance: 'none', cursor: 'pointer', width: 'auto' }}>
        {PRODUCT_SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={13} style={{ position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text3)' }} />
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
