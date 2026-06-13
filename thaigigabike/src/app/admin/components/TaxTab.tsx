'use client'
import { Receipt } from 'lucide-react'
import type { TaxRequest } from './types'

/** Tax-invoice requests tab — queue with mark-issued / revert. */
export function TaxTab({ requests, pendingCount, loading, onRefresh, onSetStatus }: {
  requests: TaxRequest[]
  pendingCount: number
  loading: boolean
  onRefresh: () => void
  onSetStatus: (id: string, status: TaxRequest['status']) => void
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 14, color: 'var(--text2)' }}>
          {requests.length} คำขอ · {pendingCount} รอออก
        </span>
        <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 12px' }} onClick={onRefresh}>
          รีเฟรช
        </button>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>กำลังโหลด...</div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 56, color: 'var(--text3)', fontSize: 15 }}>
          <Receipt size={36} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.4 }} />
          ยังไม่มีคำขอใบกำกับภาษี
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {requests.map(r => {
            const issued = r.status === 'issued'
            return (
              <div key={r.id} style={{
                background: 'var(--bg2)', border: `0.5px solid ${issued ? 'var(--border)' : 'rgba(249,115,22,.35)'}`,
                borderLeft: `3px solid ${issued ? '#22c55e' : '#f97316'}`, borderRadius: 10, padding: '14px 18px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{r.company}</div>
                    <div style={{ fontSize: 13, color: 'var(--text3)' }}>
                      เลขผู้เสียภาษี: <span style={{ fontFamily: 'var(--font-display)', color: 'var(--text2)' }}>{r.tax_id}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                      background: issued ? 'rgba(34,197,94,.15)' : 'rgba(249,115,22,.15)',
                      color: issued ? '#22c55e' : '#f97316',
                    }}>
                      {issued ? 'ออกแล้ว' : 'รอออก'}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>{new Date(r.created_at).toLocaleDateString('th-TH')}</span>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginTop: 10 }}>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>ออเดอร์</div>
                    <div style={{ fontSize: 14, fontFamily: 'var(--font-display)', color: 'var(--green)' }}>{r.order_id}</div>
                    {r.order_total != null && <div style={{ fontSize: 13, color: 'var(--text3)' }}>฿{r.order_total.toLocaleString()} · {r.order_email}</div>}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 2 }}>ที่อยู่ออกใบกำกับ</div>
                    <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{r.address}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  {!issued ? (
                    <button onClick={() => onSetStatus(r.id, 'issued')}
                      style={{ fontSize: 13, padding: '5px 12px', borderRadius: 7, cursor: 'pointer', background: '#22c55e', color: '#fff', border: 'none', fontWeight: 600 }}>
                      ✓ ออกใบกำกับแล้ว
                    </button>
                  ) : (
                    <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 12px', color: 'var(--text3)' }}
                      onClick={() => onSetStatus(r.id, 'requested')}>
                      ย้อนเป็นรอออก
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
