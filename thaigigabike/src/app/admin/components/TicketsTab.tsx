'use client'
import { useState } from 'react'
import { Headphones, Star, ChevronUp, ChevronDown } from 'lucide-react'
import { Spinner } from '@/components/ui'
import { AdminThread } from './AdminThread'
import { TICKET_TOPIC_LABELS } from './types'
import type { AdminTicket, TicketStatus } from './types'

/** Support tickets tab — ticket list with status, rating, and reply thread.
 *  Expanded-thread tracking is local UI state; data/handlers come from shell. */
export function TicketsTab({ tickets, openCount, loading, onRefresh, onSetStatus, onAnswered }: {
  tickets: AdminTicket[]
  openCount: number
  loading: boolean
  onRefresh: () => void
  onSetStatus: (id: string, status: TicketStatus) => void
  onAnswered: (id: string) => void
}) {
  const [openTicketId, setOpenTicketId] = useState<string | null>(null)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 14, color: 'var(--text2)' }}>
          {tickets.length} ตั๋ว · {openCount} รอตอบ
        </span>
        <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 12px' }} onClick={onRefresh}>
          รีเฟรช
        </button>
      </div>
      {loading ? (
        <Spinner center />
      ) : tickets.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 56, color: 'var(--text3)', fontSize: 15 }}>
          <Headphones size={36} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.4 }} />
          ยังไม่มีตั๋วซัพพอร์ต
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tickets.map(tk => {
            const open = openTicketId === tk.id
            const sc = tk.status === 'open' ? '#22c55e' : tk.status === 'answered' ? '#3b82f6' : 'var(--text3)'
            const sbg = tk.status === 'open' ? 'rgba(34,197,94,.15)' : tk.status === 'answered' ? 'rgba(59,130,246,.15)' : 'var(--bg3)'
            const sLabel = tk.status === 'open' ? 'รอตอบ' : tk.status === 'answered' ? 'ตอบแล้ว' : 'ปิด'
            return (
              <div key={tk.id} style={{
                background: 'var(--bg2)', border: `0.5px solid ${tk.status === 'open' ? 'rgba(34,197,94,.4)' : 'var(--border)'}`,
                borderLeft: `3px solid ${sc}`, borderRadius: 10, padding: '14px 18px',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>
                      {tk.subject}
                      <span className="badge badge-gray" style={{ fontSize: 11, marginLeft: 8 }}>{TICKET_TOPIC_LABELS[tk.topic] ?? tk.topic}</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text3)' }}>
                      {tk.email}
                      {tk.order_id && <span style={{ color: 'var(--green)', marginLeft: 6, fontFamily: 'var(--font-display)' }}>{tk.order_id}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {tk.rating != null && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2, fontSize: 12, color: '#f59e0b' }}>
                        <Star size={12} fill="#f59e0b" color="#f59e0b" /> {tk.rating}
                      </span>
                    )}
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: sbg, color: sc }}>{sLabel}</span>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>{new Date(tk.created_at).toLocaleDateString('th-TH')}</span>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 8, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{tk.body}</p>
                {tk.images?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {tk.images.map((u, i) => <a key={i} href={u} target="_blank" rel="noreferrer"><img src={u} alt="" style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 6 }} /></a>)}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                  <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 12px' }}
                    onClick={() => setOpenTicketId(open ? null : tk.id)}>
                    {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />} บทสนทนา
                  </button>
                  {tk.status !== 'closed' ? (
                    <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 12px', color: 'var(--text3)' }}
                      onClick={() => onSetStatus(tk.id, 'closed')}>
                      ปิดตั๋ว
                    </button>
                  ) : (
                    <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 12px' }}
                      onClick={() => onSetStatus(tk.id, 'open')}>
                      เปิดใหม่
                    </button>
                  )}
                </div>
                {open && (
                  <AdminThread
                    base={`/api/admin/tickets/${encodeURIComponent(tk.id)}`}
                    onSent={() => onAnswered(tk.id)}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
