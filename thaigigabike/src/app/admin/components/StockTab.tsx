'use client'
import { useState } from 'react'
import { Plus, Minus, Download, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { AdminSearchInput, AdminPagination, AdminTableShell } from './AdminUI'
import { LOW_STOCK_THRESHOLD } from './types'
import type { Product } from '@/data/products'

/** Stock tab — summary cards + inline-editable stock table.
 *  Mutations stay in the shell (optimistic + rollback); the inline-edit
 *  field is purely local UI state so it lives here. */
export function StockTab({ allProducts, rows, filteredCount, lowStock, outOfStock, search, onSearch, onExport, page, totalPages, onPageChange, onAdjust, onSetStock, onToggleInStock }: {
  allProducts: Product[]
  rows: Product[]
  filteredCount: number
  lowStock: number
  outOfStock: number
  search: string
  onSearch: (value: string) => void
  onExport: () => void
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  onAdjust: (id: string, delta: number) => void
  onSetStock: (id: string, value: number) => void
  onToggleInStock: (id: string) => void
}) {
  const [editingStock, setEditingStock] = useState<string | null>(null)
  const [stockInput, setStockInput] = useState('')

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { icon: <CheckCircle size={16} color="var(--green)" />, label: 'มีสินค้า', value: allProducts.filter(p => p.stockCount > LOW_STOCK_THRESHOLD).length, color: 'var(--green)' },
          { icon: <AlertTriangle size={16} color="var(--orange)" />, label: `สต็อกต่ำ (≤${LOW_STOCK_THRESHOLD})`, value: lowStock, color: 'var(--orange)' },
          { icon: <XCircle size={16} color="var(--red)" />, label: 'สินค้าหมด', value: outOfStock, color: 'var(--red)' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            {s.icon}
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <AdminSearchInput value={search} onChange={onSearch} placeholder="ค้นหารหัส / ชื่อสินค้า..." />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, color: 'var(--text2)' }}>{filteredCount} รายการ · รวม {allProducts.reduce((s, p) => s + p.stockCount, 0)} ชิ้น</span>
          <button className="btn-ghost" onClick={onExport} style={{ fontSize: 14 }}><Download size={13} /> Export CSV</button>
        </div>
      </div>

      <AdminTableShell headers={['รูป', 'รหัส', 'ชื่อสินค้า', 'หมวด', 'จำนวนสต็อก', 'สถานะ']}>
        {rows.map((p) => {
          const isLow = p.stockCount > 0 && p.stockCount <= LOW_STOCK_THRESHOLD
          const isEmpty = p.stockCount === 0
          return (
            <tr key={p.id} style={{ borderTop: '0.5px solid var(--border)', background: isEmpty ? 'rgba(239,68,68,.03)' : isLow ? 'rgba(249,115,22,.03)' : 'transparent' }}>
              <td style={{ padding: '7px 8px 7px 12px', width: 48 }}>
                <div style={{ width: 40, height: 40, borderRadius: 7, overflow: 'hidden', background: 'var(--bg3)', border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {p.images?.[0] ? <img src={p.images[0]} alt={p.code} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} /> : <span style={{ fontSize: 16 }}>📦</span>}
                </div>
              </td>
              <td style={{ padding: '10px 12px', fontSize: 13, color: 'var(--text3)', fontFamily: 'var(--font-display)', whiteSpace: 'nowrap' }}>{p.code}</td>
              <td style={{ padding: '10px 12px', fontSize: 14, maxWidth: 220 }}>
                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nameTh}</div>
              </td>
              <td style={{ padding: '10px 12px' }}><span className="badge badge-gray" style={{ fontSize: 12 }}>{p.category}</span></td>
              <td style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <button onClick={() => onAdjust(p.id, -1)} style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--bg3)', border: '0.5px solid var(--border2)', color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><Minus size={12} /></button>
                  {editingStock === p.id ? (
                    <input autoFocus type="number" min={0} max={99999} value={stockInput}
                      onChange={e => setStockInput(e.target.value)}
                      onBlur={() => { onSetStock(p.id, parseInt(stockInput)); setEditingStock(null) }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { onSetStock(p.id, parseInt(stockInput)); setEditingStock(null) }
                        if (e.key === 'Escape') setEditingStock(null)
                      }}
                      style={{ width: 60, textAlign: 'center', fontSize: 16, fontWeight: 600, background: 'var(--bg3)', border: '1px solid var(--green)', borderRadius: 6, padding: '3px 6px', color: 'var(--text)', outline: 'none' }}
                    />
                  ) : (
                    <button onClick={() => { setEditingStock(p.id); setStockInput(String(p.stockCount)) }} title="คลิกเพื่อแก้ไข"
                      style={{ width: 60, textAlign: 'center', fontSize: 16, fontWeight: 600, background: 'var(--bg3)', border: '0.5px solid var(--border2)', borderRadius: 6, padding: '3px 6px', cursor: 'text', color: isEmpty ? 'var(--red)' : isLow ? 'var(--orange)' : 'var(--text)', fontFamily: 'var(--font-display)' }}>
                      {p.stockCount}
                    </button>
                  )}
                  <button onClick={() => onAdjust(p.id, 1)} style={{ width: 26, height: 26, borderRadius: 6, background: 'var(--green)', border: 'none', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}><Plus size={12} /></button>
                  {isEmpty && <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 700 }}>หมด</span>}
                  {isLow && !isEmpty && <span style={{ fontSize: 12, color: 'var(--orange)', fontWeight: 700 }}>ใกล้หมด</span>}
                </div>
              </td>
              <td style={{ padding: '10px 12px' }}>
                <button onClick={() => onToggleInStock(p.id)} className={`badge ${p.inStock ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 12, cursor: 'pointer', border: 'none', fontFamily: 'inherit' }}>
                  {p.inStock ? 'มีสินค้า' : 'หมด'}
                </button>
              </td>
            </tr>
          )
        })}
      </AdminTableShell>
      <AdminPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  )
}
