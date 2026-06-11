'use client'
import { useState, useEffect, useRef } from 'react'
import { Camera, Check, Loader } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useLang } from '@/lib/lang'

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth()
  const { t } = useLang()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone]       = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? '')
      setPhone(profile.phone ?? '')
      setAvatarUrl(profile.avatar_url ?? null)
    }
  }, [profile])

  const handleAvatar = async (file: File) => {
    if (!user) return
    setUploading(true)
    const form = new FormData()
    form.append('file', file)
    const res = await fetch('/api/account/avatar', { method: 'POST', body: form }).catch(() => null)
    if (res?.ok) {
      const d = await res.json()
      setAvatarUrl(d.avatar_url)
      await refreshProfile()
    }
    setUploading(false)
  }

  const handleSave = async () => {
    setSaving(true)
    await fetch('/api/account/profile', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName.trim(), phone: phone.trim() }),
    })
    await refreshProfile()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px', fontSize: 16, border: '1px solid var(--border2)',
    borderRadius: 9, background: 'var(--bg3)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
  }
  const lbl: React.CSSProperties = { fontSize: 13, color: 'var(--text2)', display: 'block', marginBottom: 5, fontWeight: 600 }

  const initial = (fullName || user?.email || '?').charAt(0).toUpperCase()

  return (
    <div>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 20 }}>{t.account.profile}</h1>

      <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 14, padding: 24, maxWidth: 520 }}>
        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 30, fontFamily: 'var(--font-display)', flexShrink: 0 }}>
            {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatar(f) }} />
            <button onClick={() => fileRef.current?.click()} className="btn-ghost" disabled={uploading} style={{ fontSize: 14 }}>
              {uploading ? <Loader size={14} style={{ animation: 'spin .7s linear infinite' }} /> : <Camera size={14} />}
              {t.account.changeAvatar}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lbl}>{t.auth.fullName}</label>
            <input style={inp} value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div>
            <label style={lbl}>{t.account.phone}</label>
            <input style={inp} value={phone} onChange={e => setPhone(e.target.value)} placeholder="081-xxx-xxxx" />
          </div>
          <div>
            <label style={lbl}>{t.auth.email}</label>
            <input style={{ ...inp, opacity: 0.6, cursor: 'not-allowed' }} value={user?.email ?? ''} disabled />
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 4 }}>
              {/* email change requires verification — handled in settings */}
            </p>
          </div>

          <button onClick={handleSave} className="btn-primary" disabled={saving} style={{ justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
            {saved ? <><Check size={16} /> {t.account.saved}</> : (saving ? '...' : t.account.save)}
          </button>
        </div>
      </div>
    </div>
  )
}
