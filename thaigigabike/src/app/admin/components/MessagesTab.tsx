'use client'
import { useState } from 'react'
import { MessageCircle, ChevronUp, ChevronDown } from 'lucide-react'
import { AdminThread } from './AdminThread'
import type { AdminMessage } from './types'

/** Messages tab — customer messages with status + in-chat reply thread.
 *  Expanded-thread tracking is local UI state; data/handlers come from shell. */
export function MessagesTab({ messages, newCount, loading, onRefresh, onMark, onReplied }: {
  messages: AdminMessage[]
  newCount: number
  loading: boolean
  onRefresh: () => void
  onMark: (id: string, status: AdminMessage['status']) => void
  onReplied: (id: string) => void
}) {
  const [openMessageId, setOpenMessageId] = useState<string | null>(null)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 14, color: 'var(--text2)' }}>
          {messages.length} ข้อความ · {newCount} ใหม่
        </span>
        <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 12px' }} onClick={onRefresh}>
          รีเฟรช
        </button>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>กำลังโหลด...</div>
      ) : messages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 56, color: 'var(--text3)', fontSize: 15 }}>
          <MessageCircle size={36} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.4 }} />
          ยังไม่มีข้อความ
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.map(msg => (
            <div key={msg.id} style={{
              background: 'var(--bg2)', border: `0.5px solid ${msg.status === 'new' ? 'rgba(34,197,94,.4)' : 'var(--border)'}`,
              borderLeft: `3px solid ${msg.status === 'new' ? '#22c55e' : msg.status === 'replied' ? '#3b82f6' : 'var(--border2)'}`,
              borderRadius: 10, padding: '14px 18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{msg.sender_name}</div>
                  <div style={{ fontSize: 13, color: 'var(--text3)' }}>
                    {msg.sender_email}
                    {msg.sender_phone && ` · ${msg.sender_phone}`}
                    {msg.product_code && <span style={{ color: 'var(--green)', marginLeft: 6 }}>รหัส: {msg.product_code}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                    background: msg.status === 'new' ? 'rgba(34,197,94,.15)' : msg.status === 'replied' ? 'rgba(59,130,246,.15)' : 'var(--bg3)',
                    color: msg.status === 'new' ? '#22c55e' : msg.status === 'replied' ? '#3b82f6' : 'var(--text3)',
                  }}>
                    {msg.status === 'new' ? 'ใหม่' : msg.status === 'replied' ? 'ตอบแล้ว' : 'ปิด'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {new Date(msg.created_at).toLocaleDateString('th-TH')}
                  </span>
                </div>
              </div>
              {msg.subject && <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 8, fontWeight: 600 }}>{msg.subject}</div>}
              <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 8, lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{msg.body}</p>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 12px' }}
                  onClick={() => setOpenMessageId(openMessageId === msg.id ? null : msg.id)}>
                  {openMessageId === msg.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />} ตอบกลับในแชต
                </button>
                <a href={`mailto:${msg.sender_email}?subject=Re: ${msg.subject || 'ข้อความจาก GigaBike'}`}
                  style={{
                    fontSize: 13, padding: '5px 12px', borderRadius: 7,
                    background: '#3b82f6', color: '#fff', textDecoration: 'none', fontWeight: 600,
                  }}>
                  ตอบกลับ Email
                </a>
                {msg.status !== 'replied' && (
                  <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 12px' }}
                    onClick={() => onMark(msg.id, 'replied')}>
                    ✓ ทำเครื่องหมายตอบแล้ว
                  </button>
                )}
                {msg.status !== 'closed' && (
                  <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 12px', color: 'var(--text3)' }}
                    onClick={() => onMark(msg.id, 'closed')}>
                    ปิด
                  </button>
                )}
              </div>
              {openMessageId === msg.id && (
                <AdminThread
                  base={`/api/admin/messages/${encodeURIComponent(msg.id)}`}
                  onSent={() => onReplied(msg.id)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
