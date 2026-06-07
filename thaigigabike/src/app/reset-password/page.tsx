'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { KeyRound, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { AuthShell, authInput, authLabel } from '@/components/auth/AuthShell'

export default function ResetPasswordPage() {
  const { t } = useLang()
  const router = useRouter()
  const supabase = createClient()
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
    // The recovery link establishes a session; updateUser sets the new password.
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    setDone(true)
    setLoading(false)
    setTimeout(() => { router.push('/account'); router.refresh() }, 1500)
  }

  if (done) {
    return (
      <AuthShell title={t.auth.passwordUpdated}>
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <CheckCircle size={48} color="var(--green)" style={{ display: 'block', margin: '0 auto 14px' }} />
          <p style={{ fontSize: 15, color: 'var(--text2)' }}>→ {t.account.dashboard}</p>
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
