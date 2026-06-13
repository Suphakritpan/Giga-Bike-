'use client'
import { Plus, Edit, Trash2, Package } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { AdminSearchInput, AdminPagination, AdminTableShell, AdminViewToggle, AdminSortSelect, useAdminView } from './AdminUI'
import { LOW_STOCK_THRESHOLD } from './types'
import type { ProductSort } from './types'
import type { Product } from '@/data/products'

/** Products tab — table OR card-grid view (toggle remembered in localStorage),
 *  search, price/stock sort, add/edit/delete, pagination. Sort + paging happen
 *  in the shell (sort applies across all pages, not just the current one). */
export function ProductsTab({ rows, total, search, onSearch, sort, onSort, page, totalPages, onPageChange, loading, onAdd, onEdit, onDelete }: {
  rows: Product[]
  total: number
  search: string
  onSearch: (value: string) => void
  sort: ProductSort
  onSort: (value: ProductSort) => void
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  loading: boolean
  onAdd: () => void
  onEdit: (p: Product) => void
  onDelete: (p: Product) => void
}) {
  const [view, setView] = useAdminView('tgb-admin-products-view')

  const imgBox = (p: Product, size: number, radius: number) => (
    <div style={{ width: size, height: size, borderRadius: radius, overflow: 'hidden', background: 'var(--bg3)', border: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {p.images?.[0]
        ? <img src={p.images[0]} alt={p.code} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        : <span style={{ fontSize: size > 60 ? 30 : 16 }}>📦</span>}
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <AdminSearchInput value={search} onChange={onSearch} placeholder="ค้นหารหัส / ชื่อสินค้า..." />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <AdminSortSelect value={sort} onChange={onSort} />
          <AdminViewToggle view={view} onChange={setView} />
          <span style={{ fontSize: 14, color: 'var(--text2)' }}>{total} รายการ</span>
          <button className="btn-primary" style={{ fontSize: 15, padding: '7px 14px' }} onClick={onAdd}>
            <Plus size={14} /> เพิ่มสินค้า
          </button>
        </div>
      </div>

      {loading ? (
        <Spinner center />
      ) : rows.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text3)', fontSize: 15 }}>
          <Package size={36} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.4 }} />
          {search ? 'ไม่พบสินค้าที่ค้นหา' : 'ยังไม่มีสินค้า — กด “เพิ่มสินค้า” เพื่อเริ่ม'}
        </div>
      ) : view === 'table' ? (
        <>
          <AdminTableShell headers={['รูป', 'รหัส', 'ชื่อสินค้า', 'หมวด', 'ราคา', 'สต็อก', 'สถานะ', '']}>
            {rows.map((p) => (
              <tr key={p.id} style={{ borderTop: '0.5px solid var(--border)' }}>
                <td style={{ padding: '7px 8px 7px 12px', width: 48 }}>{imgBox(p, 40, 7)}</td>
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
                    <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 13 }} onClick={() => onEdit(p)} title="แก้ไข" aria-label={`แก้ไข ${p.nameTh}`}><Edit size={13} /></button>
                    <button className="btn-ghost" style={{ padding: '4px 8px', fontSize: 13, color: 'var(--red)' }} onClick={() => onDelete(p)} title="ลบ" aria-label={`ลบ ${p.nameTh}`}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </AdminTableShell>
          <AdminPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 12 }}>
            {rows.map((p) => (
              <div key={p.id} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ aspectRatio: '4 / 3', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {p.images?.[0]
                    ? <img src={p.images[0]} alt={p.code} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
                    : <span style={{ fontSize: 34 }}>📦</span>}
                </div>
                <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--font-display)' }}>{p.code}</span>
                    <span className={`badge ${p.inStock ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 11 }}>{p.inStock ? 'มีสินค้า' : 'หมด'}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{p.nameTh}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 'auto', gap: 8, paddingTop: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>฿{p.price.toLocaleString()}</span>
                    <span style={{ fontSize: 12, color: p.stockCount === 0 ? 'var(--red)' : p.stockCount <= LOW_STOCK_THRESHOLD ? 'var(--orange)' : 'var(--text3)', fontWeight: p.stockCount <= LOW_STOCK_THRESHOLD ? 700 : 400 }}>คงเหลือ {p.stockCount}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <button className="btn-ghost" style={{ flex: 1, fontSize: 13, padding: '5px 0', justifyContent: 'center' }} onClick={() => onEdit(p)}><Edit size={13} /> แก้ไข</button>
                    <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 10px', color: 'var(--red)' }} onClick={() => onDelete(p)} title="ลบ" aria-label={`ลบ ${p.nameTh}`}><Trash2 size={13} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <AdminPagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </>
      )}
    </div>
  )
}
