'use client'
import { useEffect, useState, useCallback } from 'react'
import { Star, Trash2, Pencil, Check, X } from 'lucide-react'
import { useLang } from '@/lib/lang'

type Review = {
  id: string; product_id: string | null; rating: number; comment: string | null
  images: string[]; published: boolean; helpful_count: number; created_at: string
}

export default function MyReviewsPage() {
  const { t, locale } = useLang()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editRating, setEditRating] = useState(0)
  const [editComment, setEditComment] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const d = await fetch('/api/account/reviews').then(r => r.json()).catch(() => ({ reviews: [] }))
    setReviews(d.reviews ?? [])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const remove = async (id: string) => {
    await fetch(`/api/account/reviews/${id}`, { method: 'DELETE' })
    setReviews(prev => prev.filter(r => r.id !== id))
  }

  const startEdit = (r: Review) => { setEditing(r.id); setEditRating(r.rating); setEditComment(r.comment ?? '') }
  const cancelEdit = () => { setEditing(null); setEditRating(0); setEditComment('') }
  const saveEdit = async (id: string) => {
    await fetch(`/api/account/reviews/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: editRating, comment: editComment }),
    })
    // Editing resets review to unpublished (pending re-approval)
    setReviews(prev => prev.map(r => r.id === id ? { ...r, rating: editRating, comment: editComment, published: false } : r))
    cancelEdit()
  }

  const statusBadge = (published: boolean) => published
    ? { text: locale === 'th' ? 'เผยแพร่' : 'Published', color: 'var(--green)', bg: 'rgba(34,197,94,.15)' }
    : { text: locale === 'th' ? 'รออนุมัติ' : 'Pending', color: '#f97316', bg: 'rgba(249,115,22,.15)' }

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 20 }}>{t.account.reviews}</h1>
      {loading ? (
        <div style={{ color: 'var(--text3)', padding: 40, textAlign: 'center' }}>...</div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text3)' }}>
          <Star size={40} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.4 }} />
          {t.account.empty}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reviews.map(r => {
            const b = statusBadge(r.published)
            return (
              <div key={r.id} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ display: 'flex', gap: 1 }}>
                      {[1,2,3,4,5].map(n => <Star key={n} size={14} fill={r.rating >= n ? '#f59e0b' : 'none'} color={r.rating >= n ? '#f59e0b' : 'var(--border2)'} />)}
                    </span>
                    {r.product_id && <span style={{ fontSize: 12, color: 'var(--green)', fontFamily: 'var(--font-display)' }}>{r.product_id}</span>}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: b.bg, color: b.color }}>{b.text}</span>
                </div>
                {editing === r.id ? (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
                      {[1,2,3,4,5].map(n => (
                        <button key={n} type="button" onClick={() => setEditRating(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          <Star size={20} fill={editRating >= n ? '#f59e0b' : 'none'} color={editRating >= n ? '#f59e0b' : 'var(--border2)'} />
                        </button>
                      ))}
                    </div>
                    <textarea value={editComment} onChange={e => setEditComment(e.target.value)}
                      style={{ width: '100%', minHeight: 70, padding: '8px 12px', fontSize: 14, border: '1px solid var(--border2)', borderRadius: 8, background: 'var(--bg3)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button onClick={() => saveEdit(r.id)} className="btn-primary" style={{ fontSize: 13, padding: '6px 14px' }}><Check size={13} /> {t.account.save}</button>
                      <button onClick={cancelEdit} className="btn-ghost" style={{ fontSize: 13, padding: '6px 14px' }}><X size={13} /> {t.account.cancel}</button>
                    </div>
                  </div>
                ) : (
                  <>
                    {r.comment && <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 8 }}>{r.comment}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: 'var(--text3)' }}>{new Date(r.created_at).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB')} · 👍 {r.helpful_count}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => startEdit(r)} className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }}>
                          <Pencil size={12} /> {t.account.edit}
                        </button>
                        <button onClick={() => remove(r.id)} className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px', color: 'var(--red)' }}>
                          <Trash2 size={12} /> {t.account.delete}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
