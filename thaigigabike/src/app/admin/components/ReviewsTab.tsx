'use client'
import { useState } from 'react'
import { Star } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui'
import type { AdminReview } from './types'

/** Reviews tab — moderation list (approve/hide/delete). */
export function ReviewsTab({ reviews, pendingCount, loading, onRefresh, onTogglePublished, onDelete }: {
  reviews: AdminReview[]
  pendingCount: number
  loading: boolean
  onRefresh: () => void
  onTogglePublished: (id: string, published: boolean) => void
  onDelete: (id: string) => void
}) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <span style={{ fontSize: 14, color: 'var(--text2)' }}>
          {reviews.length} รีวิว · {pendingCount} รอ approve
        </span>
        <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 12px' }} onClick={onRefresh}>
          รีเฟรช
        </button>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text3)' }}>กำลังโหลด...</div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 56, color: 'var(--text3)', fontSize: 15 }}>
          <Star size={36} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.4 }} />
          ยังไม่มีรีวิว
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {reviews.map(rev => (
            <div key={rev.id} style={{
              background: 'var(--bg2)',
              border: `0.5px solid ${!rev.published ? 'rgba(249,115,22,.35)' : 'var(--border)'}`,
              borderLeft: `3px solid ${!rev.published ? '#f97316' : '#22c55e'}`,
              borderRadius: 10, padding: '14px 18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{rev.reviewer_name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} size={13} fill={rev.rating > i ? '#f59e0b' : 'none'} color={rev.rating > i ? '#f59e0b' : 'var(--border2)'} />
                    ))}
                    {rev.product_id && (
                      <span style={{ fontSize: 12, color: 'var(--green)', marginLeft: 4 }}>{rev.product_id}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                    background: rev.published ? 'rgba(34,197,94,.15)' : 'rgba(249,115,22,.15)',
                    color: rev.published ? '#22c55e' : '#f97316',
                  }}>
                    {rev.published ? 'เผยแพร่' : 'รอ approve'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>
                    {new Date(rev.created_at).toLocaleDateString('th-TH')}
                  </span>
                </div>
              </div>
              {rev.comment && <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 8, lineHeight: 1.65 }}>{rev.comment}</p>}
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  onClick={() => onTogglePublished(rev.id, !rev.published)}
                  style={{
                    fontSize: 13, padding: '5px 12px', borderRadius: 7, cursor: 'pointer',
                    background: rev.published ? 'var(--bg3)' : '#22c55e',
                    color: rev.published ? 'var(--text2)' : '#fff',
                    border: '0.5px solid var(--border2)', fontWeight: 600,
                  }}>
                  {rev.published ? 'ซ่อน' : '✓ Approve'}
                </button>
                <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 12px', color: 'var(--red)' }}
                  onClick={() => setConfirmDeleteId(rev.id)}>
                  ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDeleteId}
        danger
        title="ลบรีวิวนี้?"
        message="รีวิวจะถูกลบออกจากระบบถาวร ไม่สามารถย้อนกลับได้"
        confirmLabel="ลบรีวิว"
        cancelLabel="ยกเลิก"
        onConfirm={() => { if (confirmDeleteId) onDelete(confirmDeleteId); setConfirmDeleteId(null) }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  )
}
