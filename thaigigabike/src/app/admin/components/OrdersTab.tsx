'use client'
import { useState } from 'react'
import { ChevronDown, Download } from 'lucide-react'
import { ConfirmDialog, Spinner } from '@/components/ui'
import { AdminSearchInput } from './AdminUI'
import { STATUS_COLORS, STATUS_LABELS } from './types'
import type { Order, OrderStatus } from './types'

/** Orders tab — search, status change, tracking-number inline edit, slip view,
 *  CSV export. State + handlers stay in the shell (optimistic update). */
export function OrdersTab({
  orders, search, onSearch, statusFilter, onStatusFilter, statusCounts, onExport, loading,
  slipLoading, onViewSlip, onUpdateStatus,
  editingTracking, setEditingTracking, trackingInput, setTrackingInput, savingTracking, onSaveTracking,
}: {
  orders: Order[]
  search: string
  onSearch: (value: string) => void
  statusFilter: OrderStatus | 'all'
  onStatusFilter: (status: OrderStatus | 'all') => void
  statusCounts: Record<OrderStatus | 'all', number>
  onExport: () => void
  loading: boolean
  slipLoading: string | null
  onViewSlip: (orderId: string) => void
  onUpdateStatus: (orderId: string, status: OrderStatus) => void
  editingTracking: string | null
  setEditingTracking: (id: string | null) => void
  trackingInput: string
  setTrackingInput: (value: string) => void
  savingTracking: boolean
  onSaveTracking: (orderId: string) => void
}) {
  const [cancelId, setCancelId] = useState<string | null>(null)
  const isFiltered = search !== '' || statusFilter !== 'all'
  const STATUS_FILTERS: { value: OrderStatus | 'all'; label: string }[] = [
    { value: 'all', label: 'ทั้งหมด' },
    { value: 'pending', label: STATUS_LABELS.pending },
    { value: 'paid', label: STATUS_LABELS.paid },
    { value: 'shipping', label: STATUS_LABELS.shipping },
    { value: 'delivered', label: STATUS_LABELS.delivered },
    { value: 'cancelled', label: STATUS_LABELS.cancelled },
  ]
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
        <AdminSearchInput value={search} onChange={onSearch} placeholder="ค้นหาเลขออเดอร์ / ชื่อ / เบอร์..." />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 14, color: 'var(--text2)' }}>{orders.length} ออเดอร์</span>
          <button className="btn-ghost" onClick={onExport} style={{ fontSize: 14 }}><Download size={13} /> Export CSV</button>
        </div>
      </div>

      {/* Status filter chips */}
      <div role="group" aria-label="กรองตามสถานะ" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {STATUS_FILTERS.map(f => {
          const active = statusFilter === f.value
          return (
            <button key={f.value} onClick={() => onStatusFilter(f.value)} aria-pressed={active}
              style={{
                fontSize: 13, padding: '5px 12px', borderRadius: 999, cursor: 'pointer',
                border: `1px solid ${active ? '#22c55e' : 'var(--border2)'}`,
                background: active ? '#22c55e' : 'transparent',
                color: active ? '#000' : 'var(--text2)', fontWeight: active ? 700 : 500,
              }}>
              {f.label} <span style={{ opacity: .7 }}>{statusCounts[f.value]}</span>
            </button>
          )
        })}
      </div>

      {loading ? (
        <Spinner center />
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text3)' }}>
          {isFiltered ? 'ไม่พบออเดอร์ที่ค้นหา' : 'ยังไม่มีออเดอร์'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {orders.map(o => (
            <div key={o.id} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700 }}>{o.id}</span>
                  <span className={`badge ${STATUS_COLORS[o.status]}`} style={{ fontSize: 12 }}>{STATUS_LABELS[o.status]}</span>
                </div>
                <span style={{ fontSize: 13, color: 'var(--text3)' }}>{new Date(o.created_at).toLocaleString('th-TH')}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10, marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>ลูกค้า</div>
                  <div style={{ fontSize: 15, fontWeight: 500 }}>{o.recipient_name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)' }}>{o.recipient_phone}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>ที่อยู่</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{o.recipient_address}</div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>การชำระ</div>
                  <div style={{ fontSize: 14 }}>
                    {o.payment_method === 'transfer' ? 'โอนเงิน' : 'COD'}
                    {(o.slip_path || o.slip_url) && (
                      <button
                        onClick={() => onViewSlip(o.id)}
                        disabled={slipLoading === o.id}
                        style={{ marginLeft: 8, fontSize: 12, color: 'var(--green)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                      >
                        {slipLoading === o.id ? 'กำลังเปิด...' : 'ดูสลิป'}
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>ยอดรวม</div>
                  <div style={{ fontSize: 19, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>฿{o.total.toLocaleString()}</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)' }}>{o.items?.length ?? 0} รายการ · ค่าส่ง ฿{o.shipping_fee}</div>
                </div>
              </div>
              {o.items?.length > 0 && (
                <div style={{ marginBottom: 12, padding: '8px 12px', background: 'var(--bg3)', borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {o.items.map((it, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13 }}>
                      <span style={{ color: 'var(--text2)' }}>
                        {it.nameTh || it.name}
                        {it.color && <span style={{ color: 'var(--text3)' }}> · {it.color}</span>}
                        <span style={{ color: 'var(--text3)' }}> ×{it.quantity}</span>
                      </span>
                      <span style={{ color: 'var(--text2)', whiteSpace: 'nowrap' }}>฿{(it.price * it.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', borderTop: '0.5px solid var(--border)', paddingTop: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, color: 'var(--text3)' }}>สถานะ:</span>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <select value={o.status} onChange={e => {
                      const next = e.target.value as OrderStatus
                      if (next === 'cancelled') setCancelId(o.id)
                      else onUpdateStatus(o.id, next)
                    }} className="input" style={{ fontSize: 13, padding: '4px 26px 4px 8px', appearance: 'none', width: 'auto', cursor: 'pointer' }}>
                      {(['pending', 'paid', 'shipping', 'delivered', 'cancelled'] as OrderStatus[]).map(s => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </select>
                    <ChevronDown size={11} style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text3)' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                  <span style={{ fontSize: 13, color: 'var(--text3)', whiteSpace: 'nowrap' }}>เลขพัสดุ:</span>
                  {editingTracking === o.id ? (
                    <>
                      <input autoFocus className="input" style={{ fontSize: 13, padding: '4px 8px', width: 180 }} value={trackingInput}
                        onChange={e => setTrackingInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') onSaveTracking(o.id); if (e.key === 'Escape') setEditingTracking(null) }}
                        placeholder="เลขพัสดุ..." />
                      <button className="btn-primary" style={{ fontSize: 12, padding: '4px 10px' }} disabled={savingTracking} onClick={() => onSaveTracking(o.id)}>
                        {savingTracking ? '...' : 'บันทึก'}
                      </button>
                      <button className="btn-ghost" style={{ fontSize: 12, padding: '4px 8px' }} onClick={() => setEditingTracking(null)}>ยกเลิก</button>
                    </>
                  ) : (
                    <button className="btn-ghost" style={{ fontSize: 13, padding: '4px 10px', color: o.tracking_no ? 'var(--green)' : 'var(--text3)', fontFamily: o.tracking_no ? 'var(--font-display)' : 'inherit' }}
                      onClick={() => { setEditingTracking(o.id); setTrackingInput(o.tracking_no ?? '') }}>
                      {o.tracking_no ?? '+ เพิ่มเลขพัสดุ'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!cancelId}
        danger
        title="ยกเลิกออเดอร์นี้?"
        message="ระบบจะส่งอีเมลแจ้งลูกค้าว่าออเดอร์ถูกยกเลิก"
        confirmLabel="ยกเลิกออเดอร์"
        cancelLabel="ไม่ใช่ตอนนี้"
        onConfirm={() => { if (cancelId) onUpdateStatus(cancelId, 'cancelled'); setCancelId(null) }}
        onCancel={() => setCancelId(null)}
      />
    </div>
  )
}
