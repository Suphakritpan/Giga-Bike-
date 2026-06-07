'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Mail, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { AuthShell, authInput, authLabel } from '@/components/auth/AuthShell'

export default function ForgotPasswordPage() {
  const { t } = useLang()
  const supabase = createClient()
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    // Always show success (no enumeration)
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <AuthShell title={t.auth.checkEmail}>
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <MailCheck size={48} color="var(--green)" style={{ display: 'block', margin: '0 auto 14px' }} />
          <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 18 }}>{t.auth.resetSent}</p>
          <Link href="/login" className="btn-ghost" style={{ fontSize: 15 }}>{t.auth.login}</Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={t.auth.resetTitle}
      subtitle={t.auth.resetSub}
      footer={<Link href="/login" style={{ color: 'var(--green)', fontWeight: 700 }}>← {t.auth.login}</Link>}
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={authLabel}>{t.auth.email}</label>
          <input style={authInput} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
        </div>
        <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
          <Mail size={16} /> {loading ? '...' : t.auth.sendResetLink}
        </button>
      </form>
    </AuthShell>
  )
}
