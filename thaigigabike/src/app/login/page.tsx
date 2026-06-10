'use client'
import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { LogIn, Eye, EyeOff } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { sanitizeNextPath } from '@/lib/safe-next'
import { AuthShell, authInput, authLabel } from '@/components/auth/AuthShell'

function LoginContent() {
  const { t } = useLang()
  const router = useRouter()
  const params = useSearchParams()
  // Validated to an internal path — never trust ?next= for redirects (open-redirect guard).
  const next = sanitizeNextPath(params.get('next'))

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow]         = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await fetch('/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email: email.trim().toLowerCase(), password }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || t.auth.invalidCred)
      setLoading(false)
      return
    }
    // Record login event (fire-and-forget)
    fetch('/api/account/login-events', { method: 'POST' }).catch(() => {})
    router.push(next)
    router.refresh()
  }

  return (
    <AuthShell
      title={t.auth.loginTitle}
      subtitle={t.auth.loginSub}
      footer={<>{t.auth.noAccount} <Link href="/signup" style={{ color: 'var(--green)', fontWeight: 700 }}>{t.auth.signup}</Link></>}
    >
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={authLabel}>{t.auth.email}</label>
          <input style={authInput} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoFocus />
        </div>
        <div>
          <label style={authLabel}>{t.auth.password}</label>
          <div style={{ position: 'relative' }}>
            <input style={{ ...authInput, paddingRight: 42 }} type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex' }}>
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <Link href="/forgot-password" style={{ fontSize: 13, color: 'var(--text2)' }}>{t.auth.forgotPassword}</Link>
        </div>

        {error && <div style={{ fontSize: 14, color: 'var(--red)', background: 'rgba(239,68,68,.08)', border: '0.5px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '8px 12px' }}>{error}</div>}

        <button type="submit" className="btn-primary" disabled={loading} style={{ justifyContent: 'center', opacity: loading ? 0.7 : 1 }}>
          <LogIn size={16} /> {loading ? '...' : t.auth.login}
        </button>
      </form>
    </AuthShell>
  )
}

export default function LoginPage() {
  return <Suspense fallback={null}><LoginContent /></Suspense>
}
