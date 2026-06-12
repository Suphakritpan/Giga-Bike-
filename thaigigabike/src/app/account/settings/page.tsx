'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sun, Moon, Globe, Bell, Download, Trash2, AlertTriangle, Check, Shield, Mail, LogOut, Monitor, MailCheck, MailWarning, KeyRound } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { useTheme } from '@/lib/theme'
import { useAuth } from '@/lib/auth/AuthContext'
import { Card, Toggle, PageHeader } from '@/components/ui'
import type { Locale } from '@/lib/i18n'

type LoginEvent = { id: string; ip_hash: string | null; user_agent: string | null; created_at: string }

export default function SettingsPage() {
  const { t, locale, setLocale } = useLang()
  const { theme, toggle } = useTheme()
  const { user, profile, refreshProfile, signOut } = useAuth()
  const router = useRouter()

  const [prefs, setPrefs] = useState({ notify_order: true, notify_promo: true, notify_reply: true })
  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailMsg, setEmailMsg] = useState('')
  const [emailErr, setEmailErr] = useState('')
  const [verifySent, setVerifySent] = useState(false)
  const [verifySending, setVerifySending] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwMsg, setPwMsg] = useState('')
  const [pwErr, setPwErr] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [showEmail, setShowEmail] = useState(false)
  const [loginEvents, setLoginEvents] = useState<LoginEvent[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [savedPrefs, setSavedPrefs] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [delPassword, setDelPassword] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [delError, setDelError] = useState('')

  useEffect(() => {
    if (profile) setPrefs({ notify_order: profile.notify_order, notify_promo: profile.notify_promo, notify_reply: profile.notify_reply })
  }, [profile])

  const togglePref = async (key: keyof typeof prefs) => {
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next)
    await fetch('/api/account/profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ [key]: next[key] }) })
    await refreshProfile()
    setSavedPrefs(true)
    setTimeout(() => setSavedPrefs(false), 1500)
  }

  const downloadData = () => { window.location.href = '/api/account/export' }

  const changeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailMsg('')
    setEmailErr('')
    const res = await fetch('/api/account/change-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ new_email: newEmail.trim().toLowerCase(), password: emailPassword }),
    })
    const d = await res.json().catch(() => ({}))
    if (!res.ok) {
      setEmailErr(d.error || (locale === 'th' ? 'เกิดข้อผิดพลาด กรุณาลองใหม่' : 'Something went wrong'))
      return
    }
    setEmailMsg(locale === 'th' ? 'เปลี่ยนอีเมลเรียบร้อยแล้ว' : 'Email updated')
    setNewEmail('')
    setEmailPassword('')
    router.refresh()
  }

  const logoutAllDevices = async () => {
    if (!confirm(locale === 'th' ? 'ออกจากระบบทุกอุปกรณ์?' : 'Log out from all devices?')) return
    await fetch('/api/auth/logout-all', { method: 'POST' }).catch(() => {})
    await signOut()
    router.push('/login')
    router.refresh()
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwMsg('')
    setPwErr('')
    if (pwNew.length < 8) { setPwErr(t.auth.pwMin); return }
    if (pwNew !== pwConfirm) { setPwErr(t.auth.pwMismatch); return }
    setPwSaving(true)
    const res = await fetch('/api/account/change-password', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_password: pwCurrent, new_password: pwNew }),
    }).catch(() => null)
    setPwSaving(false)
    const d = await res?.json().catch(() => ({}))
    if (!res?.ok) {
      setPwErr(d?.error || t.auth.genericError)
      return
    }
    setPwMsg(locale === 'th' ? 'เปลี่ยนรหัสผ่านแล้ว — อุปกรณ์อื่นถูกออกจากระบบ' : 'Password changed — other devices were signed out')
    setPwCurrent(''); setPwNew(''); setPwConfirm('')
  }

  const sendVerification = async () => {
    setVerifySending(true)
    const res = await fetch('/api/auth/send-verification', { method: 'POST' }).catch(() => null)
    setVerifySending(false)
    if (res?.ok) setVerifySent(true)
  }

  const loadHistory = async () => {
    if (!showHistory) {
      const d = await fetch('/api/account/login-events').then(r => r.json()).catch(() => ({ events: [] }))
      setLoginEvents(d.events ?? [])
    }
    setShowHistory(v => !v)
  }

  const deleteAccount = async () => {
    setDelError('')
    setDeleting(true)
    const res = await fetch('/api/account/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: delPassword }) })
    if (res.ok) {
      await signOut()
      router.push('/')
      router.refresh()
      return
    }
    const d = await res.json()
    setDelError(d.error || t.auth.genericError)
    setDeleting(false)
  }

  const Row = ({ icon, label, control }: { icon: React.ReactNode; label: string; control: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 15, color: 'var(--text)' }}>{icon} {label}</span>
      {control}
    </div>
  )
  const cardStyle = { maxWidth: 560 }

  return (
    <div>
      <PageHeader title={t.account.settings} />

      {/* Appearance */}
      <Card style={cardStyle} title={<>{t.account.theme} & {t.account.language}</>}>
        <Row icon={theme === 'dark' ? <Moon size={17} color="var(--text2)" /> : <Sun size={17} color="var(--text2)" />} label={t.account.theme}
          control={<button onClick={toggle} className="btn-ghost" style={{ fontSize: 13, padding: '5px 12px' }}>{theme === 'dark' ? 'Dark' : 'Light'}</button>} />
        <Row icon={<Globe size={17} color="var(--text2)" />} label={t.account.language}
          control={
            <div style={{ display: 'flex', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 8, overflow: 'hidden' }}>
              {(['th', 'en'] as Locale[]).map(l => (
                <button key={l} onClick={() => setLocale(l)} style={{ padding: '5px 12px', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', background: locale === l ? 'var(--green)' : 'transparent', color: locale === l ? '#fff' : 'var(--text2)' }}>{l.toUpperCase()}</button>
              ))}
            </div>
          } />
      </Card>

      {/* Notifications */}
      <Card style={cardStyle} title={<>
        <Bell size={14} /> {locale === 'th' ? 'การแจ้งเตือน' : 'Notifications'}
        {savedPrefs && <span style={{ color: 'var(--green)', fontSize: 12, fontWeight: 600 }}><Check size={12} /> {t.account.saved}</span>}
      </>}>
        <Row icon={<span style={{ width: 17 }} />} label={t.account.notifyOrder} control={<Toggle on={prefs.notify_order} onClick={() => togglePref('notify_order')} label={t.account.notifyOrder} />} />
        <Row icon={<span style={{ width: 17 }} />} label={t.account.notifyPromo} control={<Toggle on={prefs.notify_promo} onClick={() => togglePref('notify_promo')} label={t.account.notifyPromo} />} />
        <Row icon={<span style={{ width: 17 }} />} label={t.account.notifyReply} control={<Toggle on={prefs.notify_reply} onClick={() => togglePref('notify_reply')} label={t.account.notifyReply} />} />
      </Card>

      {/* Security */}
      <Card style={cardStyle} title={<>
        <Shield size={14} /> {locale === 'th' ? 'ความปลอดภัย' : 'Security'}
      </>}>

        {/* Email verification status */}
        {user?.email_verified_at ? (
          <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--green)', marginBottom: 12 }}>
            <MailCheck size={15} /> {locale === 'th' ? 'ยืนยันอีเมลแล้ว' : 'Email verified'}
          </p>
        ) : (
          <div style={{ background: 'rgba(234,88,12,.07)', border: '1px solid rgba(234,88,12,.3)', borderRadius: 10, padding: '10px 14px', marginBottom: 14 }}>
            <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--orange)', fontWeight: 600, marginBottom: 4 }}>
              <MailWarning size={15} /> {locale === 'th' ? 'ยังไม่ได้ยืนยันอีเมล' : 'Email not verified'}
            </p>
            <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8 }}>
              {locale === 'th'
                ? 'ยืนยันอีเมลเพื่อดูประวัติออเดอร์ที่เคยสั่งด้วยอีเมลนี้ และกล่องข้อความ'
                : 'Verify your email to see guest orders and messages sent with this address.'}
            </p>
            {verifySent ? (
              <span style={{ fontSize: 13, color: 'var(--green)' }}>
                ✓ {locale === 'th' ? 'ส่งลิงก์แล้ว — เช็คกล่องอีเมลของคุณ' : 'Link sent — check your inbox'}
              </span>
            ) : (
              <button onClick={sendVerification} disabled={verifySending} className="btn-ghost" style={{ fontSize: 13, padding: '6px 12px' }}>
                <Mail size={14} /> {verifySending ? '...' : (locale === 'th' ? 'ส่งลิงก์ยืนยัน' : 'Send verification link')}
              </button>
            )}
          </div>
        )}

        {/* Change email */}
        {!showEmail ? (
          <button onClick={() => setShowEmail(true)} className="btn-ghost" style={{ fontSize: 14, marginBottom: 10 }}>
            <Mail size={15} /> {locale === 'th' ? 'เปลี่ยนอีเมล' : 'Change email'}
          </button>
        ) : (
          <form onSubmit={changeEmail} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, maxWidth: 360 }}>
            <div style={{ fontSize: 13, color: 'var(--text3)' }}>{locale === 'th' ? 'อีเมลปัจจุบัน' : 'Current'}: {user?.email}</div>
            <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder={locale === 'th' ? 'อีเมลใหม่' : 'New email'} required
              style={{ padding: '10px 14px', fontSize: 15, border: '1px solid var(--border2)', borderRadius: 9, background: 'var(--bg3)', color: 'var(--text)', outline: 'none' }} />
            <input type="password" value={emailPassword} onChange={e => setEmailPassword(e.target.value)} placeholder={locale === 'th' ? 'รหัสผ่านปัจจุบัน (เพื่อยืนยัน)' : 'Current password (to confirm)'} required
              style={{ padding: '10px 14px', fontSize: 15, border: '1px solid var(--border2)', borderRadius: 9, background: 'var(--bg3)', color: 'var(--text)', outline: 'none' }} />
            {emailMsg && <span style={{ fontSize: 13, color: 'var(--green)' }}>{emailMsg}</span>}
            {emailErr && <span style={{ fontSize: 13, color: 'var(--red)' }}>{emailErr}</span>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" className="btn-primary" style={{ fontSize: 14, padding: '8px 16px' }}>{locale === 'th' ? 'เปลี่ยนอีเมล' : 'Change email'}</button>
              <button type="button" onClick={() => { setShowEmail(false); setEmailMsg(''); setEmailErr('') }} className="btn-ghost" style={{ fontSize: 14 }}>{t.account.cancel}</button>
            </div>
          </form>
        )}

        {/* Change password */}
        {!showPw ? (
          <button onClick={() => setShowPw(true)} className="btn-ghost" style={{ fontSize: 14, marginBottom: 10, display: 'block' }}>
            <KeyRound size={15} /> {locale === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change password'}
          </button>
        ) : (
          <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, maxWidth: 360 }}>
            <input type="password" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)} placeholder={locale === 'th' ? 'รหัสผ่านปัจจุบัน' : 'Current password'} required autoComplete="current-password"
              style={{ padding: '10px 14px', fontSize: 15, border: '1px solid var(--border2)', borderRadius: 9, background: 'var(--bg3)', color: 'var(--text)', outline: 'none' }} />
            <input type="password" value={pwNew} onChange={e => setPwNew(e.target.value)} placeholder={locale === 'th' ? 'รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)' : 'New password (min 8 chars)'} required autoComplete="new-password"
              style={{ padding: '10px 14px', fontSize: 15, border: '1px solid var(--border2)', borderRadius: 9, background: 'var(--bg3)', color: 'var(--text)', outline: 'none' }} />
            <input type="password" value={pwConfirm} onChange={e => setPwConfirm(e.target.value)} placeholder={locale === 'th' ? 'ยืนยันรหัสผ่านใหม่' : 'Confirm new password'} required autoComplete="new-password"
              style={{ padding: '10px 14px', fontSize: 15, border: '1px solid var(--border2)', borderRadius: 9, background: 'var(--bg3)', color: 'var(--text)', outline: 'none' }} />
            {pwMsg && <span style={{ fontSize: 13, color: 'var(--green)' }}>{pwMsg}</span>}
            {pwErr && <span style={{ fontSize: 13, color: 'var(--red)' }}>{pwErr}</span>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" disabled={pwSaving} className="btn-primary" style={{ fontSize: 14, padding: '8px 16px', opacity: pwSaving ? 0.7 : 1 }}>
                {pwSaving ? '...' : (locale === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change password')}
              </button>
              <button type="button" onClick={() => { setShowPw(false); setPwMsg(''); setPwErr(''); setPwCurrent(''); setPwNew(''); setPwConfirm('') }} className="btn-ghost" style={{ fontSize: 14 }}>{t.account.cancel}</button>
            </div>
          </form>
        )}

        {/* Login history */}
        <button onClick={loadHistory} className="btn-ghost" style={{ fontSize: 14, marginBottom: showHistory ? 10 : 10, display: 'block' }}>
          <Monitor size={15} /> {locale === 'th' ? 'ประวัติการเข้าสู่ระบบ' : 'Login history'}
        </button>
        {showHistory && (
          <div style={{ background: 'var(--bg3)', borderRadius: 10, padding: '8px 14px', marginBottom: 12 }}>
            {loginEvents.length === 0 ? (
              <p style={{ fontSize: 13, color: 'var(--text3)', padding: '6px 0' }}>{t.account.empty}</p>
            ) : loginEvents.map(ev => (
              <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)', padding: '5px 0', borderBottom: '0.5px solid var(--border)' }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}>{ev.user_agent?.split(')')[0]?.split('(')[1] ?? ev.user_agent ?? 'Unknown'}</span>
                <span style={{ color: 'var(--text3)' }}>{new Date(ev.created_at).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-GB')}</span>
              </div>
            ))}
          </div>
        )}

        {/* Logout all devices */}
        <button onClick={logoutAllDevices} className="btn-ghost" style={{ fontSize: 14, color: 'var(--orange)', display: 'block' }}>
          <LogOut size={15} /> {locale === 'th' ? 'ออกจากระบบทุกอุปกรณ์' : 'Log out all devices'}
        </button>

        <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 10 }}>
          🔒 {locale === 'th' ? '2FA — เร็วๆ นี้' : '2FA — coming soon'}
        </p>
      </Card>

      {/* Privacy / Data */}
      <Card style={cardStyle} title={t.account.privacy}>
        <button onClick={downloadData} className="btn-ghost" style={{ fontSize: 14 }}>
          <Download size={15} /> {t.account.downloadData}
        </button>
      </Card>

      {/* Danger zone */}
      <div style={{ background: 'rgba(239,68,68,.04)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 14, padding: 20, maxWidth: 560 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--red)', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={14} /> {t.account.dangerZone}
        </h3>
        <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 14, lineHeight: 1.5 }}>{t.account.deleteAccountWarn}</p>
        {!showDelete ? (
          <button onClick={() => setShowDelete(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            <Trash2 size={14} /> {t.account.deleteAccount}
          </button>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 320 }}>
            <input type="password" value={delPassword} onChange={e => setDelPassword(e.target.value)} placeholder={t.account.confirmPassword}
              style={{ padding: '10px 14px', fontSize: 15, border: '1px solid rgba(239,68,68,.4)', borderRadius: 9, background: 'var(--bg3)', color: 'var(--text)', outline: 'none' }} />
            {delError && <span style={{ fontSize: 13, color: 'var(--red)' }}>{delError}</span>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={deleteAccount} disabled={deleting || !delPassword} style={{ background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 9, padding: '9px 18px', fontSize: 14, fontWeight: 700, cursor: 'pointer', opacity: (deleting || !delPassword) ? 0.6 : 1 }}>
                {deleting ? '...' : t.account.deleteAccount}
              </button>
              <button onClick={() => { setShowDelete(false); setDelPassword(''); setDelError('') }} className="btn-ghost" style={{ fontSize: 14 }}>{t.account.cancel}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
