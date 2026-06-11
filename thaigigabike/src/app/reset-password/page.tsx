'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { KeyRound, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { AuthShell, authInput, authLabel } from '@/components/auth/AuthShell'

function ResetPasswordContent() {
  const { t } = useLang()
  const router = useRouter()
  const params = useSearchParams()
  const token  = params.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [show, setShow]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [done, setDone]         = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError(t.auth.pwMin); return }
    if (password !== confirm) { setError(t.auth.pwMismatch); return }
    setLoading(true)
    const res = await fetch('/api/auth/reset-password', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token, password }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่')
      setLoading(false)
      return
    }
    setDone(true)
    setLoading(false)
    setTimeout(() => { router.push('/login'); router.refresh() }, 1500)
  }

  // No token in the URL — the link is broken or was typed by hand
  if (!token) {
    return (
      <AuthShell title={t.auth.resetTitle}>
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 18 }}>
            ลิงก์ไม่ถูกต้องหรือหมดอายุ — กรุณาขอลิงก์ตั้งรหัสผ่านใหม่อีกครั้ง
          </p>
          <Link href="/forgot-password" className="btn-primary" style={{ fontSize: 15, justifyContent: 'center' }}>
            {t.auth.sendResetLink}
          </Link>
        </div>
      </AuthShell>
    )
  }

  if (done) {
    return (
      <AuthShell title={t.auth.passwordUpdated}>
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <CheckCircle size={48} color="var(--green)" style={{ display: 'block', margin: '0 auto 14px' }} />
          <p style={{ fontSize: 15, color: 'var(--text2)' }}>→ {t.auth.login}</p>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell title={t.auth.resetTitle}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={authLabel}>{t.auth.newPassword}</label>
          <div style={{ position: 'relative' }}>
            <input style={{ ...authInput, paddingRight: 42 }} type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required autoFocus />
            <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex' }}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <div>
          <label style={authLabel}>{t.auth.confirmPassword}</label>
          <input style={authInput} type={show ? 'text' : 'password'} value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required />
        </div>

        {error && <div style={{ fontSize: 14, color: 'var(--red)', background: 'rgba(239,68,68,.08)', border: '0.5px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '8px 12px' }}>{error}</div>}

        <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
          <KeyRound size={16} /> {loading ? '...' : t.auth.updatePassword}
        </button>
      </form>
    </AuthShell>
  )
}

export default function ResetPasswordPage() {
  return <Suspense fallback={null}><ResetPasswordContent /></Suspense>
}
