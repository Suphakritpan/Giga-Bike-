'use client'
import { useState, useEffect, useCallback } from 'react'
import { MapPin, Plus, Star, Trash2, Edit2, X, Check } from 'lucide-react'
import { useLang } from '@/lib/lang'
import { PageHeader, SkeletonList, EmptyState, Button } from '@/components/ui'

type Address = {
  id: string; label: string; recipient_name: string; phone: string
  address: string; is_default: boolean
}

export default function AddressesPage() {
  const { t } = useLang()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Address | null>(null)
  const [showForm, setShowForm] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await fetch('/api/account/addresses').then(r => r.json()).catch(() => ({ addresses: [] }))
    setAddresses(r.addresses ?? [])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const labelText: Record<string, string> = {
    home: t.account.labelHome, work: t.account.labelWork, shop: t.account.labelShop, other: t.account.labelOther,
  }

  const setDefault = async (id: string) => {
    await fetch(`/api/account/addresses/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_default: true }) })
    load()
  }
  const remove = async (id: string) => {
    await fetch(`/api/account/addresses/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div>
      <PageHeader
        title={t.account.addresses}
        actions={
          <Button style={{ padding: '8px 16px' }} onClick={() => { setEditing(null); setShowForm(true) }}>
            <Plus size={15} /> {t.account.addAddress}
          </Button>
        }
      />

      {showForm && (
        <AddressForm
          initial={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load() }}
        />
      )}

      {loading ? (
        <SkeletonList rows={2} height={140} />
      ) : addresses.length === 0 ? (
        <EmptyState icon={<MapPin size={40} />} title={t.account.empty} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {addresses.map(a => (
            <div key={a.id} style={{ background: 'var(--bg2)', border: `0.5px solid ${a.is_default ? 'var(--green)' : 'var(--border)'}`, borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--bg3)', color: 'var(--text2)' }}>{labelText[a.label] ?? a.label}</span>
                {a.is_default && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(34,197,94,.15)', color: 'var(--green)' }}>{t.account.defaultBadge}</span>}
              </div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{a.recipient_name}</div>
              <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 4 }}>{a.phone}</div>
              <div style={{ fontSize: 14, color: 'var(--text2)', lineHeight: 1.5 }}>{a.address}</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
                {!a.is_default && (
                  <button onClick={() => setDefault(a.id)} className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }}>
                    <Star size={12} /> {t.account.setDefault}
                  </button>
                )}
                <button onClick={() => { setEditing(a); setShowForm(true) }} className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }}>
                  <Edit2 size={12} />
                </button>
                <button onClick={() => remove(a.id)} className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px', color: 'var(--red)' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AddressForm({ initial, onClose, onSaved }: { initial: Address | null; onClose: () => void; onSaved: () => void }) {
  const { t } = useLang()
  const [label, setLabel]   = useState(initial?.label ?? 'home')
  const [name, setName]     = useState(initial?.recipient_name ?? '')
  const [phone, setPhone]   = useState(initial?.phone ?? '')
  const [address, setAddr]  = useState(initial?.address ?? '')
  const [isDefault, setDef] = useState(initial?.is_default ?? false)
  const [saving, setSaving] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const payload = { label, recipient_name: name, phone, address, is_default: isDefault }
    if (initial) {
      await fetch(`/api/account/addresses/${initial.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      await fetch('/api/account/addresses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    setSaving(false)
    onSaved()
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', fontSize: 15, border: '1px solid var(--border2)', borderRadius: 9, background: 'var(--bg3)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }
  const LABELS = [
    { id: 'home', label: t.account.labelHome }, { id: 'work', label: t.account.labelWork },
    { id: 'shop', label: t.account.labelShop }, { id: 'other', label: t.account.labelOther },
  ]

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: 'var(--bg)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 460, position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)' }}><X size={20} /></button>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>{initial ? t.account.editAddress : t.account.addAddress}</h2>
        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {LABELS.map(l => (
              <button key={l.id} type="button" onClick={() => setLabel(l.id)} style={{
                padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '0.5px solid',
                background: label === l.id ? 'var(--green)' : 'var(--bg3)', color: label === l.id ? '#fff' : 'var(--text2)', borderColor: label === l.id ? 'var(--green)' : 'var(--border2)',
              }}>{l.label}</button>
            ))}
          </div>
          <input style={inp} value={name} onChange={e => setName(e.target.value)} placeholder={t.account.recipientName} required />
          <input style={inp} value={phone} onChange={e => setPhone(e.target.value)} placeholder={t.account.phone} required />
          <textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={address} onChange={e => setAddr(e.target.value)} placeholder={t.account.addressDetail} required />
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, cursor: 'pointer' }}>
            <input type="checkbox" checked={isDefault} onChange={e => setDef(e.target.checked)} />
            {t.account.setDefault}
          </label>
          <button type="submit" className="btn-primary" disabled={saving} style={{ justifyContent: 'center', opacity: saving ? 0.7 : 1 }}>
            <Check size={16} /> {saving ? '...' : t.account.save}
          </button>
        </form>
      </div>
    </div>
  )
}
