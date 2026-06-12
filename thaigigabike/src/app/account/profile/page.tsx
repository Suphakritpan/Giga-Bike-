'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Camera, Check, Loader, MailCheck, MailWarning } from 'lucide-react'
import { useAuth } from '@/lib/auth/AuthContext'
import { useLang } from '@/lib/lang'
import { Button, Card, Field, PageHeader } from '@/components/ui'

export default function ProfilePage() {
  const { user, profile, refreshProfile, refreshUser } = useAuth()
  const { t, locale } = useLang()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone]       = useState('')
  const [lineId, setLineId]     = useState('')
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

  useEffect(() => {
    if (user) setLineId(user.line_id ?? '')
  }, [user])

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
      body: JSON.stringify({ full_name: fullName.trim(), phone: phone.trim(), line_id: lineId.trim() }),
    })
    // line_id lives on the user object — refresh both
    await Promise.all([refreshProfile(), refreshUser()])
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const initial = (fullName || user?.email || '?').charAt(0).toUpperCase()

  return (
    <div>
      <PageHeader title={t.account.profile} />

      <Card style={{ padding: 24, maxWidth: 520 }}>
        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', overflow: 'hidden', background: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 30, fontFamily: 'var(--font-display)', flexShrink: 0 }}>
            {avatarUrl ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initial}
          </div>
          <div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }}
              onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatar(f) }} />
            <Button variant="ghost" small onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader size={14} className="animate-pulse-green" /> : <Camera size={14} />}
              {t.account.changeAvatar}
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label={t.auth.fullName} value={fullName} onChange={e => setFullName(e.target.value)} />
          <Field label={t.account.phone} value={phone} onChange={e => setPhone(e.target.value)} placeholder="081-xxx-xxxx" />
          <Field
            label="LINE ID"
            value={lineId}
            onChange={e => setLineId(e.target.value)}
            placeholder={locale === 'th' ? 'สำหรับติดต่อเรื่องออเดอร์ (ไม่บังคับ)' : 'For order contact (optional)'}
            maxLength={100}
          />
          <div>
            <Field
              label={t.auth.email}
              value={user?.email ?? ''}
              disabled
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
            <p style={{ fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              {user?.email_verified_at ? (
                <span style={{ color: 'var(--green)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <MailCheck size={13} /> {locale === 'th' ? 'ยืนยันอีเมลแล้ว' : 'Verified'}
                </span>
              ) : (
                <span style={{ color: 'var(--orange)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <MailWarning size={13} /> {locale === 'th' ? 'ยังไม่ได้ยืนยัน —' : 'Not verified —'}
                  <Link href="/account/settings" style={{ color: 'var(--green)', fontWeight: 600 }}>
                    {locale === 'th' ? 'ยืนยันที่ตั้งค่า' : 'verify in Settings'}
                  </Link>
                </span>
              )}
            </p>
          </div>

          <Button onClick={handleSave} loading={saving}>
            {saved ? <><Check size={16} /> {t.account.saved}</> : t.account.save}
          </Button>
        </div>
      </Card>
    </div>
  )
}
