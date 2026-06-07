'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { MessageSquare, Plus, ChevronDown, ChevronUp, Send, Camera, Loader, X } from 'lucide-react'
import { useLang } from '@/lib/lang'

type Msg = { id: string; subject: string | null; body: string; product_code: string | null; status: 'new' | 'replied' | 'closed'; created_at: string }
type Reply = { id: string; author: 'customer' | 'shop'; body: string; images: string[]; created_at: string }

export default function MyMessagesPage() {
  const { t, locale } = useLang()
  const [messages, setMessages] = useState<Msg[]>([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/account/messages').then(r => r.json())
      .then(d => setMessages(d.messages ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statusInfo = (s: Msg['status']) => ({
    new:     { th: 'รอตอบ',  en: 'Pending', color: '#3b82f6', bg: 'rgba(59,130,246,.15)' },
    replied: { th: 'ตอบแล้ว', en: 'Replied', color: 'var(--green)', bg: 'rgba(34,197,94,.15)' },
    closed:  { th: 'ปิด',    en: 'Closed',  color: 'var(--text3)', bg: 'var(--bg3)' },
  }[s])

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>{t.account.messages}</h1>
        <Link href="/messages" className="btn-primary" style={{ fontSize: 15, padding: '8px 16px' }}>
          <Plus size={15} /> {locale === 'th' ? 'ส่งข้อความ' : 'New message'}
        </Link>
      </div>

      {loading ? (
        <div style={{ color: 'var(--text3)', padding: 40, textAlign: 'center' }}>...</div>
      ) : messages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--text3)' }}>
          <MessageSquare size={40} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.4 }} />
          {t.account.empty}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {messages.map(m => {
            const s = statusInfo(m.status)
            const open = openId === m.id
            return (
              <div key={m.id} style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6, gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>
                    {m.subject || (locale === 'th' ? 'ข้อความ' : 'Message')}
                    {m.product_code && <span style={{ marginLeft: 8, fontSize: 12, color: 'var(--green)' }}>{m.product_code}</span>}
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: s.bg, color: s.color }}>{locale === 'th' ? s.th : s.en}</span>
                </div>
                <p style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{m.body}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>{new Date(m.created_at).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB')}</span>
                  <button onClick={() => setOpenId(open ? null : m.id)} className="btn-ghost" style={{ fontSize: 13, padding: '4px 12px' }}>
                    {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />} {locale === 'th' ? 'บทสนทนา' : 'Thread'}
                  </button>
                </div>
                {open && <Thread messageId={m.id} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Thread({ messageId }: { messageId: string }) {
  const { locale } = useLang()
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)

  const load = async () => {
    const d = await fetch(`/api/account/messages/${messageId}`).then(r => r.json()).catch(() => ({ replies: [] }))
    setReplies(d.replies ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const upload = async (file: File) => {
    if (images.length >= 3) return
    setUploading(true)
    const fd = new FormData(); fd.append('image', file)
    const d = await fetch('/api/reviews/upload-image', { method: 'POST', body: fd }).then(r => r.json()).catch(() => ({}))
    if (d.url) setImages(prev => [...prev, d.url])
    setUploading(false)
  }

  const send = async () => {
    if (!text.trim()) return
    setSending(true)
    await fetch(`/api/account/messages/${messageId}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text, images }),
    })
    setText(''); setImages([]); setSending(false)
    load()
  }

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '0.5px solid var(--border)' }}>
      {loading ? (
        <div style={{ color: 'var(--text3)', fontSize: 13 }}>...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {replies.length === 0 && <p style={{ fontSize: 13, color: 'var(--text3)' }}>{locale === 'th' ? 'ยังไม่มีการตอบกลับ' : 'No replies yet'}</p>}
          {replies.map(r => (
            <div key={r.id} style={{ alignSelf: r.author === 'customer' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <div style={{
                background: r.author === 'customer' ? 'var(--green)' : 'var(--bg3)',
                color: r.author === 'customer' ? '#fff' : 'var(--text)',
                borderRadius: 12, padding: '8px 12px', fontSize: 14, lineHeight: 1.5,
              }}>
                {r.body}
                {r.images?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {r.images.map((u, i) => <img key={i} src={u} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }} />)}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2, textAlign: r.author === 'customer' ? 'right' : 'left' }}>
                {r.author === 'customer' ? (locale === 'th' ? 'คุณ' : 'You') : (locale === 'th' ? 'ร้าน' : 'Shop')} · {new Date(r.created_at).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB')}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* reply box */}
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
        <button onClick={send} disabled={sending || !text.trim()} className="btn-primary" style={{ width: 40, height: 40, padding: 0, justifyContent: 'center', flexShrink: 0, opacity: (sending || !text.trim()) ? 0.6 : 1 }}>
          <Send size={16} />
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
