'use client'
import { useState, useEffect, useCallback } from 'react'
import { Send, Camera, X } from 'lucide-react'
import { Spinner } from '@/components/ui'
import type { ThreadReply } from './types'

/** Reply thread (chat bubbles + reply box with image upload) — shared by the
 *  messages and tickets tabs. `base` is the thread's API endpoint. */
export function AdminThread({ base, onSent }: { base: string; onSent?: () => void }) {
  const [replies, setReplies]   = useState<ThreadReply[]>([])
  const [loading, setLoading]   = useState(true)
  const [text, setText]         = useState('')
  const [images, setImages]     = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [sending, setSending]   = useState(false)

  const load = useCallback(async () => {
    const d = await fetch(base).then(r => r.json()).catch(() => ({ replies: [] }))
    setReplies(d.replies ?? [])
    setLoading(false)
  }, [base])
  useEffect(() => { load() }, [load])

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
    await fetch(base, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: text, images }),
    })
    setText(''); setImages([]); setSending(false)
    await load()
    onSent?.()
  }

  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: '0.5px solid var(--border)' }}>
      {loading ? (
        <div style={{ color: 'var(--text3)', fontSize: 13 }}>กำลังโหลด...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {replies.length === 0 && <p style={{ fontSize: 13, color: 'var(--text3)' }}>ยังไม่มีการตอบกลับ</p>}
          {replies.map(r => (
            <div key={r.id} style={{ alignSelf: r.author === 'shop' ? 'flex-end' : 'flex-start', maxWidth: '80%' }}>
              <div style={{
                background: r.author === 'shop' ? 'var(--green)' : 'var(--bg3)',
                color: r.author === 'shop' ? '#fff' : 'var(--text)',
                borderRadius: 12, padding: '8px 12px', fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap',
              }}>
                {r.body}
                {r.images?.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    {r.images.map((u, i) => <a key={i} href={u} target="_blank" rel="noreferrer"><img src={u} alt="" style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 6 }} /></a>)}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2, textAlign: r.author === 'shop' ? 'right' : 'left' }}>
                {r.author === 'shop' ? 'ร้าน' : 'ลูกค้า'} · {new Date(r.created_at).toLocaleString('th-TH')}
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
          <textarea value={text} onChange={e => setText(e.target.value)} placeholder="พิมพ์คำตอบถึงลูกค้า..."
            style={{ width: '100%', minHeight: 44, padding: '8px 12px', fontSize: 14, border: '1px solid var(--border2)', borderRadius: 9, background: 'var(--bg3)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />
        </div>
        <label style={{ width: 40, height: 40, borderRadius: 9, border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text3)', flexShrink: 0 }}>
          <input type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) upload(f) }} disabled={uploading || images.length >= 3} />
          {uploading ? <Spinner small /> : <Camera size={16} />}
        </label>
        <button onClick={send} disabled={sending || !text.trim()} className="btn-primary" style={{ width: 40, height: 40, padding: 0, justifyContent: 'center', flexShrink: 0, opacity: (sending || !text.trim()) ? 0.6 : 1 }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  )
}
