'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, LogIn, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Handle redirect from middleware when authenticated user is not allowlisted.
  // Sign them out so they are not stuck in a loop.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('error') === 'unauthorized') {
      setError('คุณไม่มีสิทธิ์เข้าถึงระบบแอดมิน')
      const supabase = createClient()
      supabase.auth.signOut()
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร')
      return
    }
    setLoading(true)
    try {
      // Server-side login: rate-limited + allowlist-checked (OWASP A07, A04)
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      })
      if (res.ok) {
        router.push('/admin')
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง')
        setLoading(false)
      }
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Zap size={22} color="var(--green)" />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>
              Thai<span style={{ color: 'var(--green)' }}>Giga</span>Bike
            </span>
          </div>
          <div style={{ fontSize: 16, color: 'var(--text3)' }}>ระบบหลังบ้าน · Admin</div>
        </div>

        {/* Card */}
        <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 16, padding: 28 }}>
          <h1 style={{ fontSize: 24, marginBottom: 20, textAlign: 'center' }}>เข้าสู่ระบบ</h1>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ fontSize: 14, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>อีเมล</label>
              <input
                className="input"
                type="email"
                placeholder="admin@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label style={{ fontSize: 14, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>รหัสผ่าน</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ fontSize: 16, color: 'var(--red)', background: 'rgba(239,68,68,.08)', border: '0.5px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '8px 12px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ justifyContent: 'center', marginTop: 4, opacity: loading ? 0.7 : 1 }}
            >
              <LogIn size={16} />
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--text3)' }}>
          เฉพาะผู้ดูแลระบบเท่านั้น
        </p>
      </div>
    </div>
  )
}
