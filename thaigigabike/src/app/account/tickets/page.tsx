'use client'
import { useEffect, useState, useCallback } from 'react'
import { LifeBuoy, Plus, X, Check, ChevronDown, ChevronUp, Send, Camera, Loader, Star, CheckCircle } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { PageHeader, SkeletonList, EmptyState, Button } from '@/components/ui'

type Ticket = {
  id: string; topic: string; order_id: string | null; subject: string; body: string
  status: 'open' | 'answered' | 'closed'; rating: number | null; created_at: string
}
type Reply = { id: string; author: 'customer' | 'shop'; body: string; images: string[]; created_at: string }

const TOPICS = ['general', 'order', 'shipping', 'product', 'refund', 'claim', 'payment']

export default function TicketsPage() {
  const { t, locale } = useLang()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  const topicLabel: Record<string, { th: string; en: string }> = {
    general: { th: 'ทั่วไป', en: 'General' }, order: { th: 'ออเดอร์', en: 'Order' },
    shipping: { th: 'จัดส่ง', en: 'Shipping' }, product: { th: 'สินค้า', en: 'Product' },
    refund: { th: 'คืนเงิน', en: 'Refund' }, claim: { th: 'เคลม', en: 'Claim' }, payment: { th: 'ชำระเงิน', en: 'Payment' },
  }

  const load = useCallback(async () => {
    setLoading(true)
    const d = await fetch('/api/account/tickets').then(r => r.json()).catch(() => ({ tickets: [] }))
    setTickets(d.tickets ?? [])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const statusInfo = (s: Ticket['status']) => ({
    open:     { th: 'เปิด',    en: 'Open',     color: '#3b82f6', bg: 'rgba(59,130,246,.15)' },
    answered: { th: 'ตอบแล้ว', en: 'Answered', color: 'var(--green)', bg: 'rgba(34,197,94,.15)' },
    closed:   { th: 'ปิด',     en: 'Closed',   color: 'var(--text3)', bg: 'var(--bg3)' },
  }[s])

  return (
    <div>
      <PageHeader
        title={t.account.tickets}
        actions={
          <Button style={{ padding: '8px 16px' }} onClick={() => setShowForm(true)}>
            <Plus size={15} /> {locale === 'th' ? 'เปิด Ticket' : 'New ticket'}
          </Button>
        }
      />

      {showForm && <TicketForm onClose={() => setShowForm(false)} onSaved={() => { setShowForm(false); load() }} />}

      {loading ? (
        <SkeletonList rows={3} height={110} />
      ) : tickets.length === 0 ? (
        <EmptyState icon={<LifeBuoy size={40} />} title={t.account.empty} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tickets.map(tk => {
            const s = statusInfo(tk.status)
            return (
              <div key={tk.id} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--bg3)', color: 'var(--text2)' }}>{topicLabel[tk.topic]?.[locale] ?? tk.topic}</span>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{tk.subject}</span>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: s.bg, color: s.color }}>{locale === 'th' ? s.th : s.en}</span>
                </div>
                {tk.order_id && <div style={{ fontSize: 12, color: 'var(--green)', marginBottom: 4 }}>{tk.order_id}</div>}
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6 }}>{tk.body}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>{new Date(tk.created_at).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB')}</span>
                  <button onClick={() => setOpenId(openId === tk.id ? null : tk.id)} className="btn-ghost" style={{ fontSize: 13, padding: '4px 12px' }}>
                    {openId === tk.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />} {locale === 'th' ? 'บทสนทนา' : 'Thread'}
                  </button>
                </div>
                {openId === tk.id && <TicketThread ticket={tk} onChanged={load} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )

  function TicketThread({ ticket, onChanged }: { ticket: Ticket; onChanged: () => void }) {
    const [replies, setReplies] = useState<Reply[]>([])
    const [text, setText]       = useState('')
    const [images, setImages]   = useState<string[]>([])
    const [uploading, setUploading] = useState(false)
    const [sending, setSending] = useState(false)
    const [rating, setRating]   = useState(ticket.rating ?? 0)

    const loadThread = async () => {
      const d = await fetch(`/api/account/tickets/${ticket.id}`).then(r => r.json()).catch(() => ({ replies: [] }))
      setReplies(d.replies ?? [])
    }
    useEffect(() => { loadThread() }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const upload = async (file: File) => {
      if (images.length >= 3) return
      setUploading(true)
      const fd = new FormData(); fd.append('image', file)
      const d = await fetch('/api/reviews/upload-image', { method: 'POST', body: fd }).then(r => r.json()).catch(() => ({}))
      if (d.url) setImages(p => [...p, d.url])
      setUploading(false)
    }
    const send = async () => {
      if (!text.trim()) return
      setSending(true)
      await fetch(`/api/account/tickets/${ticket.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body: text, images }) })
      setText(''); setImages([]); setSending(false); loadThread()
    }
    const closeTicket = async () => {
      await fetch(`/api/account/tickets/${ticket.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'closed' }) })
      onChanged()
    }
    const rate = async (n: number) => {
      setRating(n)
      await fetch(`/api/account/tickets/${ticket.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rating: n }) })
      onChanged()
    }

    return (
      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '0.5px solid var(--border)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {replies.length === 0 && <p style={{ fontSize: 13, color: 'var(--text3)' }}>{locale === 'th' ? 'ยังไม่มีการตอบกลับจากร้าน' : 'No replies yet'}</p>}
          {replies.map(r => (
            <div key={r.id} style={{ alignSelf: r.author === 'customer' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <div style={{ background: r.author === 'customer' ? 'var(--green)' : 'var(--bg3)', color: r.author === 'customer' ? '#fff' : 'var(--text)', borderRadius: 12, padding: '8px 12px', fontSize: 14, lineHeight: 1.5 }}>
                {r.body}
                {r.images?.length > 0 && <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>{r.images.map((u, i) => <img key={i} src={u} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }} />)}</div>}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2, textAlign: r.author === 'customer' ? 'right' : 'left' }}>{r.author === 'customer' ? (locale === 'th' ? 'คุณ' : 'You') : (locale === 'th' ? 'ร้าน' : 'Shop')}</div>
            </div>
          ))}
        </div>

        {ticket.status === 'closed' ? (
          <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>{locale === 'th' ? 'ให้คะแนนการช่วยเหลือ' : 'Rate this support'}</p>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onClick={() => rate(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <Star size={22} fill={rating >= n ? '#f59e0b' : 'none'} color={rating >= n ? '#f59e0b' : 'var(--border2)'} />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                {images.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                    {images.map((u, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <img src={u} alt="" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6 }} />
                        <button onClick={() => setImages(p => p.filter((_, j) => j !== i))} style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: 'var(--red)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={9} /></button>
                      </div>
                    ))}
                  </div>
                )}
                <textarea value={text} onChange={e => setText(e.target.value)} placeholder={locale === 'th' ? 'พิมพ์ข้อความ...' : 'Type a reply...'}
                  style={{ width: '100%', minHeight: 44, padding: '8px 12px', fontSize: 14, border: '1px solid var(--border2)', borderRadius: 9, background: 'var(--bg3)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
              </div>
              <label style={{ width: 40, height: 40, borderRadius: 9, border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text3)', flexShrink: 0 }}>
                <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }} disabled={uploading || images.length >= 3} />
                {uploading ? <Loader size={16} style={{ animation: 'spin .7s linear infinite' }} /> : <Camera size={16} />}
              </label>
              <button onClick={send} disabled={sending || !text.trim()} className="btn-primary" style={{ width: 40, height: 40, padding: 0, justifyContent: 'center', flexShrink: 0, opacity: (sending || !text.trim()) ? 0.6 : 1 }}><Send size={16} /></button>
            </div>
            <button onClick={closeTicket} className="btn-ghost" style={{ fontSize: 13, padding: '5px 12px', marginTop: 8 }}>
              <CheckCircle size={13} /> {locale === 'th' ? 'ปิด Ticket' : 'Close ticket'}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </>
        )}
      </div>
    )
  }

  function TicketForm({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
    const [topic, setTopic]     = useState('general')
    const [subject, setSubject] = useState('')
    const [body, setBody]       = useState('')
    const [orderId, setOrderId] = useState('')
    const [saving, setSaving]   = useState(false)

    const submit = async (e: React.FormEvent) => {
      e.preventDefault()
      setSaving(true)
      await fetch('/api/account/tickets', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, subject, body, order_id: orderId }) })
      setSaving(false)
      onSaved()
    }
    const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', fontSize: 15, border: '1px solid var(--border2)', borderRadius: 9, background: 'var(--bg3)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }

    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
        <div style={{ background: 'var(--bg)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}><X size={20} /></button>
          <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>{locale === 'th' ? 'เปิด Ticket' : 'New ticket'}</h2>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {TOPICS.map(tp => (
                <button key={tp} type="button" onClick={() => setTopic(tp)} style={{
                  padding: '5px 12px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '0.5px solid',
                  background: topic === tp ? 'var(--green)' : 'var(--bg3)', color: topic === tp ? '#fff' : 'var(--text2)', borderColor: topic === tp ? 'var(--green)' : 'var(--border2)',
                }}>{topicLabel[tp]?.[locale] ?? tp}</button>
              ))}
            </div>
            <input style={inp} value={subject} onChange={e => setSubject(e.target.value)} placeholder={locale === 'th' ? 'หัวข้อ' : 'Subject'} required />
            <input style={inp} value={orderId} onChange={e => setOrderId(e.target.value)} placeholder={locale === 'th' ? 'เลขออเดอร์ (ถ้ามี) GGB-XXXXX' : 'Order ID (optional)'} />
            <textarea style={{ ...inp, minHeight: 110, resize: 'vertical' }} value={body} onChange={e => setBody(e.target.value)} placeholder={locale === 'th' ? 'อธิบายปัญหา...' : 'Describe your issue...'} required />
            <button type="submit" className="btn-primary" disabled={saving} style={{ justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
              <Check size={16} /> {saving ? '...' : (locale === 'th' ? 'ส่ง Ticket' : 'Submit')}
            </button>
          </form>
        </div>
      </div>
    )
  }
}
