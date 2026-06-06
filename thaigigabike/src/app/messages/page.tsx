'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { MessageCircle, CheckCircle, Phone, Send } from 'lucide-react'
import { useLang } from '@/lib/lang'

function MessagesContent() {
  const searchParams = useSearchParams()
  const { t, locale } = useLang()

  const [name, setName]               = useState('')
  const [email, setEmail]             = useState('')
  const [phone, setPhone]             = useState('')
  const [subject, setSubject]         = useState('')
  const [productCode, setProductCode] = useState(searchParams.get('product') || '')
  const [message, setMessage]         = useState('')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState<string | null>(null)
  const [sent, setSent]               = useState(false)

  // Populate product code from URL param
  useEffect(() => {
    const p = searchParams.get('product')
    if (p) setProductCode(p)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError(t.messages.required)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, subject, product_code: productCode, message }),
      })
      if (!res.ok) throw new Error()
      setSent(true)
    } catch {
      setError(locale === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่' : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', fontSize: 16,
    border: '0.5px solid var(--border2)', borderRadius: 8,
    background: 'var(--bg3)', color: 'var(--text)',
    outline: 'none', boxSizing: 'border-box',
  }

  return (
    <div>
      {/* Header */}
      <section style={{ background: 'var(--bg2)', borderBottom: '0.5px solid var(--border)', padding: '32px 0' }}>
        <div className="container" style={{ maxWidth: 640 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <MessageCircle size={22} color="var(--green)" />
            <h1 style={{ fontSize: 34 }}>{t.messages.title}</h1>
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 16 }}>{t.messages.subtitle}</p>
        </div>
      </section>

      <div className="container section" style={{ maxWidth: 640 }}>

        {sent ? (
          /* Success state */
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <CheckCircle size={52} color="var(--green)" style={{ display: 'block', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>{t.messages.successTitle}</h2>
            <p style={{ fontSize: 16, color: 'var(--text2)', marginBottom: 24, lineHeight: 1.6 }}>{t.messages.successSub}</p>
            <button className="btn-ghost" onClick={() => { setSent(false); setMessage(''); setSubject('') }} style={{ fontSize: 15 }}>
              {t.messages.sendAnother}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>
                  {t.messages.name} *
                </label>
                <input style={inputStyle} value={name} onChange={e => setName(e.target.value)}
                  placeholder={locale === 'th' ? 'ชื่อ-นามสกุล' : 'Your name'} required />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>
                  {t.messages.email} *
                </label>
                <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" required />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>
                  {t.messages.phone}
                </label>
                <input style={inputStyle} value={phone} onChange={e => setPhone(e.target.value)}
                  placeholder="081-xxx-xxxx" />
              </div>
              <div>
                <label style={{ fontSize: 13, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>
                  {t.messages.productCode}
                </label>
                <input style={inputStyle} value={productCode} onChange={e => setProductCode(e.target.value)}
                  placeholder={t.messages.productCodePlaceholder} />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>
                {t.messages.subject}
              </label>
              <input style={inputStyle} value={subject} onChange={e => setSubject(e.target.value)}
                placeholder={locale === 'th' ? 'เช่น สอบถามสต็อก, สั่งพิเศษ' : 'e.g. Stock inquiry, custom order'} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 13, color: 'var(--text3)', display: 'block', marginBottom: 5 }}>
                {t.messages.message} *
              </label>
              <textarea
                style={{ ...inputStyle, minHeight: 130, resize: 'vertical' }}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder={t.messages.messagePlaceholder}
                required
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', borderRadius: 8, marginBottom: 14, fontSize: 14,
                background: 'rgba(220,38,38,.06)', border: '0.5px solid rgba(220,38,38,.25)',
                color: 'var(--red)',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
            >
              <Send size={15} />
              {loading ? t.messages.sending : t.messages.send}
            </button>
          </form>
        )}

        {/* Quick contact alternatives */}
        <div style={{ marginTop: 36, paddingTop: 24, borderTop: '0.5px solid var(--border)' }}>
          <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 14 }}>{t.messages.quickLinks}</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a
              href="https://line.me/ti/p/~thaigigabike"
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: '#06C755', color: '#fff',
                padding: '9px 18px', borderRadius: 8, fontWeight: 700, fontSize: 14,
                textDecoration: 'none',
              }}
            >
              <MessageCircle size={15} />
              LINE: thaigigabike
            </a>
            <a
              href="tel:+66814249407"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'var(--bg3)', color: 'var(--text)',
                border: '0.5px solid var(--border2)',
                padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: 14,
                textDecoration: 'none',
              }}
            >
              <Phone size={15} />
              081-424-9407
            </a>
          </div>
          <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 10 }}>
            {locale === 'th' ? 'เปิดทุกวัน 9:00–20:00 น.' : 'Open daily 9 AM – 8 PM (ICT)'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="section">
        <div className="container" style={{ maxWidth: 640 }}>
          <div style={{ height: 40, background: 'var(--bg3)', borderRadius: 8, maxWidth: 300, marginBottom: 24 }} />
          <div style={{ height: 200, background: 'var(--bg3)', borderRadius: 12 }} />
        </div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  )
}
