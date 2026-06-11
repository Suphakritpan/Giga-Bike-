'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { UserPlus, Eye, EyeOff } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { useAuth } from '@/lib/auth/AuthContext'
import { sanitizeNextPath } from '@/lib/safe-next'
import { AuthShell, authInput, authLabel } from '@/components/auth/AuthShell'

function SignupContent() {
  const { t } = useLang()
  const { refreshUser } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  // Validated to an internal path — never trust ?next= for redirects (open-redirect guard).
  const next   = sanitizeNextPath(params.get('next'))

  const [fullName, setFullName] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) { setError(t.auth.pwMin); return }
    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        email:     email.trim().toLowerCase(),
        password,
        full_name: fullName.trim() || null,
      }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error || (t.auth.genericError ?? 'สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่'))
      setLoading(false)
      return
    }
    await refreshUser()
    router.push(next)
    router.refresh()
  }

  return (
    <AuthShell
      title={t.auth.signupTitle}
      subtitle={t.auth.signupSub}
      footer={<>{t.auth.haveAccount} <Link href="/login" style={{ color: 'var(--green)', fontWeight: 700 }}>{t.auth.login}</Link></>}
    >
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
