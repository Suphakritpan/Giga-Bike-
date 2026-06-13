'use client'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { AdminSearchInput, AdminPagination, AdminTableShell } from './AdminUI'
import { LOW_STOCK_THRESHOLD } from './types'
import type { Product } from '@/data/products'

/** Products tab — table with search, add/edit/delete, pagination.
 *  All data + handlers come from the admin page (state stays in the shell). */
export function ProductsTab({ rows, total, search, onSearch, page, totalPages, onPageChange, loading, onAdd, onEdit, onDelete }: {
  rows: Product[]
  total: number
  search: string
  onSearch: (value: string) => void
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  loading: boolean
  onAdd: () => void
  onEdit: (p: Product) => void
  onDelete: (p: Product) => void
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <AdminSearchInput value={search} onChange={onSearch} placeholder="ค้นหารหัส / ชื่อสินค้า..." />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, color: 'var(--text2)' }}>{total} รายการ</span>
          <button className="btn-primary" style={{ fontSize: 15, padding: '7px 14px' }} onClick={onAdd}>
            <Plus size={14} /> เพิ่มสินค้า
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text3)' }}>
          <Spinner />
          <div style={{ marginTop: 12 }}>กำลังโหลดสินค้า...</div>
        </div>
      ) : (
        <>
          <AdminTableShell headers={['รูป', 'รหัส', 'ชื่อสินค้า', 'หมวด', 'ราคา', 'สต็อก', 'สถานะ', '']}>
            {rows.map((p) => (
              <tr key={p.id} style={{ borderTop: '0.5px solid var(--border)' }}>
                <td style={{ padding: '7px 8px 7px 12px', width: 48 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 7, overflow: 'hidden', background: 'var(--bg3)', border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.code} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    ) : <span style={{ fontSize: 16 }}>📦</span>}
                  </div>
                </td>
                <td style={{ padding: '9px 12px', fontSize: 13, color: 'var(--text3)', fontFamily: 'var(--font-display)' }}>{p.code}</td>
                <td style={{ padding: '9px 12px', fontSize: 14, maxWidth: 200 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nameTh}</div>
                </td>
                <td style={{ padding: '9px 12px' }}>
                  <span className="badge badge-gray" style={{ fontSize: 12 }}>{p.category}</span>
                </td>
                <td style={{ padding: '9px 12px', fontSize: 15, fontWeight: 600, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>฿{p.price.toLocaleString()}</td>
                <td style={{ padding: '9px 12px', fontSize: 14 }}>
                  <span style={{ color: p.stockCount === 0 ? 'var(--red)' : p.stockCount <= LOW_STOCK_THRESHOLD ? 'var(--orange)' : 'var(--text)', fontWeight: p.stockCount <= LOW_STOCK_THRESHOLD ? 700 : 400 }}>{p.stockCount}</span>
                </td>
                <td style={{ padding: '9px 12px' }}>
                  <span className={`badge ${p.inStock ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 12 }}>{p.inStock ? 'มีสินค้า' : 'หมด'}</span>
                </td>
                <td style={{ padding: '9px 12px' }}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 13 }} onClick={() => onEdit(p)} title="แก้ไข"><Edit size={13} /></button>
                    <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 13, color: 'var(--red)' }} onClick={() => onDelete(p)} title="ลบ"><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </AdminTableShell>
          <AdminPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </>
      )}
    </div>
  )
}
