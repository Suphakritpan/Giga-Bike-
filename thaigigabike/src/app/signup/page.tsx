'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { UserPlus, Eye, EyeOff, MailCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useLang } from '@/lib/lang'
import { AuthShell, GoogleButton, authInput, authLabel } from '@/components/auth/AuthShell'

function SignupContent() {
  const { t } = useLang()
  const params = useSearchParams()
  const supabase = createClient()
  const next = params.get('next') || '/account'

  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [sent, setSent]         = useState(false)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError(t.auth.pwMin); return }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: fullName.trim() },
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })
    if (error) { setError(error.message); setLoading(false); return }
    // If email confirmation required, session is null
    if (!data.session) { setSent(true); setLoading(false); return }
    window.location.href = next
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    })
  }

  if (sent) {
    return (
      <AuthShell title={t.auth.checkEmail}>
        <div style={{ textAlign: 'center', padding: '12px 0' }}>
          <MailCheck size={48} color="var(--green)" style={{ display: 'block', margin: '0 auto 14px' }} />
          <p style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.6, marginBottom: 18 }}>{t.auth.checkEmailSub}</p>
          <Link href="/login" className="btn-ghost" style={{ fontSize: 15 }}>{t.auth.login}</Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title={t.auth.signupTitle}
      subtitle={t.auth.signupSub}
      footer={<>{t.auth.haveAccount} <Link href="/login" style={{ color: 'var(--green)', fontWeight: 700 }}>{t.auth.login}</Link></>}
    >
      <GoogleButton onClick={handleGoogle} label={t.auth.googleLogin} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        <span style={{ fontSize: 13, color: 'var(--text3)' }}>{t.auth.orDivider}</span>
        <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      </div>

      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={authLabel}>{t.auth.fullName}</label>
          <input style={authInput} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="..." required autoFocus />
        </div>
        <div>
          <label style={authLabel}>{t.auth.email}</label>
          <input style={authInput} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>
        <div>
          <label style={authLabel}>{t.auth.password}</label>
          <div style={{ position: 'relative' }}>
            <input style={{ ...authInput, paddingRight: 42 }} type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="อย่างน้อย 8 ตัวอักษร" required />
            <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex' }}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && <div style={{ fontSize: 14, color: 'var(--red)', background: 'rgba(239,68,68,.08)', border: '0.5px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '8px 12px' }}>{error}</div>}

        <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
          <UserPlus size={16} /> {loading ? '...' : t.auth.signup}
        </button>
      </form>
    </AuthShell>
  )
}

export default function SignupPage() {
  return <Suspense fallback={null}><SignupContent /></Suspense>
}
