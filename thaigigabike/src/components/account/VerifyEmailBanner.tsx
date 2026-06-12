'use client'
import { useState } from 'react'
import { Mail, MailWarning } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useLang } from '@/lib/lang'

/**
 * Shown while the account email is unverified — explains why email-matched
 * guest orders/messages are hidden and offers a one-click resend.
 * Renders nothing once verified.
 */
export function VerifyEmailBanner() {
  const { user } = useAuth()
  const { locale } = useLang()
  const [sent, setSent]       = useState(false)
  const [sending, setSending] = useState(false)

  if (!user || user.email_verified_at) return null

  const send = async () => {
    setSending(true)
    const res = await fetch('/api/auth/send-verification', { method: 'POST' }).catch(() => null)
    setSending(false)
    if (res?.ok) setSent(true)
  }

  return (
    <div style={{
      background: 'rgba(234,88,12,.07)', border: '1px solid rgba(234,88,12,.3)',
      borderRadius: 10, padding: '12px 16px', marginBottom: 16,
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
    }}>
      <MailWarning size={18} color="var(--orange)" style={{ flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 220 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--orange)' }}>
          {locale === 'th' ? 'ยืนยันอีเมลเพื่อดูข้อมูลครบถ้วน' : 'Verify your email to see everything'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text2)' }}>
          {locale === 'th'
            ? 'ออเดอร์และข้อความที่เคยใช้อีเมลนี้ก่อนสมัครสมาชิก จะแสดงหลังยืนยันอีเมลแล้ว'
            : 'Guest orders and messages sent with this email will appear after verification.'}
        </div>
      </div>
      {sent ? (
        <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>
          ✓ {locale === 'th' ? 'ส่งลิงก์แล้ว — เช็คอีเมล' : 'Link sent — check your inbox'}
        </span>
      ) : (
        <button onClick={send} disabled={sending} className="btn-ghost" style={{ fontSize: 13, padding: '6px 12px', flexShrink: 0 }}>
          <Mail size={14} /> {sending ? '...' : (locale === 'th' ? 'ส่งลิงก์ยืนยัน' : 'Send link')}
        </button>
      )}
    </div>
  )
}
