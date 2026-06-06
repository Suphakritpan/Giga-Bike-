'use client'
import { useState, useEffect, useCallback } from 'react'
import { Star, CheckCircle, ThumbsUp, PenLine, X } from 'lucide-react'
import { useLang } from '@/lib/lang'

type Review = {
  id: string
  product_id: string | null
  reviewer_name: string
  rating: number
  comment: string | null
  helpful_count: number
  created_at: string
}

function StarRow({ rating, size = 16, interactive = false, onChange }: {
  rating: number; size?: number; interactive?: boolean; onChange?: (r: number) => void
}) {
  const [hover, setHover] = useState(0)
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => interactive && onChange?.(n)}
          onMouseEnter={() => interactive && setHover(n)}
          onMouseLeave={() => interactive && setHover(0)}
          style={{ background: 'none', border: 'none', cursor: interactive ? 'pointer' : 'default', padding: 0, display: 'flex' }}
        >
          <Star
            size={size}
            fill={(hover || rating) >= n ? '#f59e0b' : 'none'}
            color={(hover || rating) >= n ? '#f59e0b' : 'var(--border2)'}
          />
        </button>
      ))}
    </div>
  )
}

function ReviewCard({ review }: { review: Review }) {
  const { locale } = useLang()
  const [helpful, setHelpful] = useState(review.helpful_count)
  const [voted, setVoted] = useState(false)

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB', {
    year: 'numeric', month: 'short', day: 'numeric',
  })

  const handleHelpful = () => {
    if (voted) return
    setHelpful(h => h + 1)
    setVoted(true)
  }

  return (
    <div style={{
      background: 'var(--bg2)', border: '0.5px solid var(--border)',
      borderRadius: 12, padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 12 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{review.reviewer_name}</div>
          <StarRow rating={review.rating} />
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)', whiteSpace: 'nowrap' }}>
          {fmtDate(review.created_at)}
        </div>
      </div>

      {review.product_id && (
        <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, fontFamily: 'var(--font-display)' }}>
          {locale === 'th' ? 'สินค้า:' : 'Product:'} {review.product_id}
        </div>
      )}

      {review.comment && (
        <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.7, marginBottom: 12 }}>
          {review.comment}
        </p>
      )}

      <button
        onClick={handleHelpful}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          fontSize: 13, color: voted ? 'var(--green)' : 'var(--text3)',
          background: 'none', border: '0.5px solid var(--border2)', borderRadius: 999,
          padding: '4px 12px', cursor: voted ? 'default' : 'pointer',
          transition: 'all .15s',
        }}
      >
        <ThumbsUp size={13} />
        {locale === 'th' ? 'มีประโยชน์' : 'Helpful'}
        {helpful > 0 && <span style={{ fontWeight: 700 }}>({helpful})</span>}
      </button>
    </div>
  )
}

function RatingSummary({ reviews }: { reviews: Review[] }) {
  const { locale } = useLang()
  if (reviews.length === 0) return null
  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
  const counts = [5, 4, 3, 2, 1].map(n => ({ n, c: reviews.filter(r => r.rating === n).length }))
  return (
    <div style={{
      background: 'var(--bg2)', border: '0.5px solid var(--border)',
      borderRadius: 12, padding: '20px 24px', marginBottom: 20,
      display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 52, fontWeight: 800, fontFamily: 'var(--font-display)', color: '#f59e0b', lineHeight: 1 }}>
          {avg.toFixed(1)}
        </div>
        <StarRow rating={Math.round(avg)} size={18} />
        <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>
          {reviews.length} {locale === 'th' ? 'รีวิว' : 'reviews'}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 180 }}>
        {counts.map(({ n, c }) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--text3)', width: 10 }}>{n}</span>
            <Star size={12} fill="#f59e0b" color="#f59e0b" />
            <div style={{ flex: 1, height: 6, background: 'var(--bg3)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 3, background: '#f59e0b',
                width: reviews.length > 0 ? `${(c / reviews.length) * 100}%` : '0%',
                transition: 'width .4s',
              }} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--text3)', width: 16, textAlign: 'right' }}>{c}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function WriteReviewForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { t, locale } = useLang()
  const [name, setName]         = useState('')
  const [productId, setProductId] = useState('')
  const [orderId, setOrderId]   = useState('')
  const [rating, setRating]     = useState(0)
  const [comment, setComment]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || rating < 1) { setError(t.reviews.required); return }
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewer_name: name, product_id: productId, order_id: orderId, rating, comment }),
      })
      if (!res.ok) throw new Error()
      onSuccess()
    } catch {
      setError(locale === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่' : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '10px 14px', fontSize: 15,
    border: '0.5px solid var(--border2)', borderRadius: 8,
    background: 'var(--bg3)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 300,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: 'var(--bg)', borderRadius: 16, padding: 28, width: '100%', maxWidth: 520,
        maxHeight: '90vh', overflowY: 'auto', position: 'relative',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16, background: 'none', border: 'none',
          cursor: 'pointer', color: 'var(--text3)', display: 'flex',
        }}>
          <X size={20} />
        </button>

        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20 }}>{t.reviews.writeReview}</h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>
              {t.reviews.yourName} *
            </label>
            <input style={inp} value={name} onChange={e => setName(e.target.value)}
              placeholder={locale === 'th' ? 'ชื่อ / ชื่อร้าน' : 'Your name / shop'} required />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 13, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>
              {t.reviews.rating} *
            </label>
            <StarRow rating={rating} size={28} interactive onChange={setRating} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>
                {t.reviews.product}
              </label>
              <input style={inp} value={productId} onChange={e => setProductId(e.target.value)}
                placeholder={t.reviews.productPlaceholder} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>
                {t.reviews.orderId}
              </label>
              <input style={inp} value={orderId} onChange={e => setOrderId(e.target.value)}
                placeholder={t.reviews.orderIdPlaceholder} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 13, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>
              {t.reviews.comment}
            </label>
            <textarea
              style={{ ...inp, minHeight: 110, resize: 'vertical' }}
              value={comment} onChange={e => setComment(e.target.value)}
              placeholder={t.reviews.commentPlaceholder}
            />
          </div>

          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 14,
              background: 'rgba(220,38,38,.06)', border: '0.5px solid rgba(220,38,38,.25)', color: 'var(--red)',
            }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary" disabled={loading}
            style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
            {loading ? t.reviews.submitting : t.reviews.submit}
          </button>

          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 10, textAlign: 'center' }}>
            {t.reviews.pendingNote}
          </p>
        </form>
      </div>
    </div>
  )
}

export default function ReviewsPage() {
  const { t, locale } = useLang()
  const [reviews, setReviews]     = useState<Review[]>([])
  const [total, setTotal]         = useState(0)
  const [pages, setPages]         = useState(0)
  const [page, setPage]           = useState(1)
  const [ratingFilter, setRatingFilter] = useState(0)
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('write') === '1')
  const [submitted, setSubmitted] = useState(false)

  const loadReviews = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (ratingFilter > 0) params.set('rating', String(ratingFilter))
    try {
      const res  = await fetch(`/api/reviews?${params}`)
      const data = await res.json()
      setReviews(data.reviews ?? [])
      setTotal(data.total ?? 0)
      setPages(data.pages ?? 0)
    } catch { /* ignore */ }
    setLoading(false)
  }, [page, ratingFilter])

  useEffect(() => { loadReviews() }, [loadReviews])
  useEffect(() => { setPage(1) }, [ratingFilter])

  const handleSuccess = () => {
    setShowForm(false)
    setSubmitted(true)
  }

  return (
    <div>
      {showForm && (
        <WriteReviewForm onClose={() => setShowForm(false)} onSuccess={handleSuccess} />
      )}

      {/* Header */}
      <section style={{ background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)', padding: '32px 0' }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 34, marginBottom: 4 }}>{t.reviews.title}</h1>
              <p style={{ color: 'var(--text2)', fontSize: 16 }}>{t.reviews.subtitle}</p>
            </div>
            <button className="btn-primary" onClick={() => setShowForm(true)} style={{ gap: 7 }}>
              <PenLine size={15} />
              {t.reviews.writeReview}
            </button>
          </div>
        </div>
      </section>

      <div className="container section" style={{ maxWidth: 760 }}>

        {/* Submission success banner */}
        {submitted && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px',
            background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.3)',
            borderRadius: 10, marginBottom: 20, fontSize: 15, color: 'var(--green)', fontWeight: 500,
          }}>
            <CheckCircle size={18} color="var(--green)" />
            {t.reviews.successTitle} {t.reviews.successSub}
          </div>
        )}

        {/* Rating summary */}
        {!loading && reviews.length > 0 && <RatingSummary reviews={reviews} />}

        {/* Rating filter */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {[0, 5, 4, 3, 2, 1].map(n => (
            <button
              key={n}
              onClick={() => setRatingFilter(n)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '5px 13px', borderRadius: 999, fontSize: 13, fontWeight: 500,
                border: '0.5px solid', cursor: 'pointer',
                background:  ratingFilter === n ? 'var(--green)' : 'var(--bg3)',
                color:       ratingFilter === n ? '#fff'         : 'var(--text2)',
                borderColor: ratingFilter === n ? 'var(--green)' : 'var(--border2)',
              }}
            >
              {n === 0 ? t.reviews.filterAll : (
                <>
                  <Star size={12} fill="#f59e0b" color="#f59e0b" />
                  {n} {t.reviews.filterRating}
                </>
              )}
            </button>
          ))}
          {total > 0 && (
            <span style={{ fontSize: 13, color: 'var(--text3)', alignSelf: 'center', marginLeft: 4 }}>
              {total} {locale === 'th' ? 'รีวิว' : 'reviews'}
            </span>
          )}
        </div>

        {/* Reviews list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 120, background: 'var(--bg3)', borderRadius: 12 }} />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
            <Star size={40} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: 17, fontWeight: 600, marginBottom: 6 }}>{t.reviews.empty}</p>
            <p style={{ fontSize: 14, marginBottom: 20 }}>{t.reviews.emptySub}</p>
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <PenLine size={14} /> {t.reviews.writeReview}
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
            </div>

            {/* Pagination */}
            {pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 6, paddingTop: 24 }}>
                {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)} style={{
                    width: 36, height: 36, borderRadius: 8, border: '0.5px solid',
                    background: page === p ? 'var(--green)' : 'var(--bg3)',
                    color:      page === p ? '#fff'         : 'var(--text2)',
                    borderColor: page === p ? 'var(--green)' : 'var(--border2)',
                    fontWeight: page === p ? 700 : 400, cursor: 'pointer', fontSize: 14,
                  }}>
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
