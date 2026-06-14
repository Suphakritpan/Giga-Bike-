'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { ConfirmDialog, Spinner, useToast } from '@/components/ui'

type RegBike = { id: string; brand: string; model: string }
type RegColor = { id: string; label_th: string; hex: string | null }

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', fontSize: 14, border: '1px solid var(--border2)', borderRadius: 9,
  background: 'var(--bg3)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
}

/** Manage the bike-model / colour registry (admin additions on top of the
 *  built-in presets). Self-contained: reads /api/registry, writes via
 *  /api/admin/registry. */
export function RegistryTab() {
  const { toast } = useToast()
  const [bikes, setBikes] = useState<RegBike[]>([])
  const [colors, setColors] = useState<RegColor[]>([])
  const [loading, setLoading] = useState(true)
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [colorLabel, setColorLabel] = useState('')
  const [colorHex, setColorHex] = useState('')
  const [confirmDel, setConfirmDel] = useState<{ kind: 'bike' | 'color'; id: string; label: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const d = await fetch('/api/registry').then(r => r.json()).catch(() => ({}))
    setBikes(d.bikeModels ?? [])
    setColors(d.colors ?? [])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const addBike = async () => {
    if (!brand.trim() || !model.trim()) return
    const res = await fetch('/api/admin/registry', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'bike', brand, model }),
    }).catch(() => null)
    const d = await res?.json().catch(() => ({}))
    if (res?.ok && d.item) {
      setBikes(prev => prev.some(b => b.id === d.item.id) ? prev : [...prev, d.item])
      setBrand(''); setModel(''); toast('เพิ่มรุ่นรถแล้ว')
    } else { toast(d?.error || 'เพิ่มไม่สำเร็จ', 'error') }
  }

  const addColor = async () => {
    if (!colorLabel.trim()) return
    const res = await fetch('/api/admin/registry', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind: 'color', label_th: colorLabel, hex: colorHex }),
    }).catch(() => null)
    const d = await res?.json().catch(() => ({}))
    if (res?.ok && d.item) {
      setColors(prev => prev.some(c => c.id === d.item.id) ? prev : [...prev, d.item])
      setColorLabel(''); setColorHex(''); toast('เพิ่มสีแล้ว')
    } else { toast(d?.error || 'เพิ่มไม่สำเร็จ', 'error') }
  }

  const del = async (kind: 'bike' | 'color', id: string) => {
    if (kind === 'bike') setBikes(prev => prev.filter(b => b.id !== id))
    else setColors(prev => prev.filter(c => c.id !== id))
    await fetch(`/api/admin/registry?kind=${kind}&id=${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {})
    toast('ลบแล้ว')
  }

  if (loading) return <Spinner center />

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
      {/* รุ่นรถ */}
      <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 18 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>รุ่นรถ (เพิ่มเอง)</h3>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 12 }}>เพิ่มเติมจาก preset ในระบบ — ที่เพิ่มที่นี่จะเลือกได้ในฟอร์มสินค้า</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <input style={{ ...inputStyle, flex: '0 1 130px' }} placeholder="ยี่ห้อ" value={brand} onChange={e => setBrand(e.target.value)} />
          <input style={{ ...inputStyle, flex: '1 1 140px' }} placeholder="รุ่น" value={model} onChange={e => setModel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addBike() }} />
          <button className="btn-primary" style={{ fontSize: 14 }} onClick={addBike}><Plus size={14} /> เพิ่ม</button>
        </div>
        {bikes.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>ยังไม่มีรุ่นที่เพิ่มเอง</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {bikes.map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 14, padding: '6px 10px', background: 'var(--bg3)', borderRadius: 8 }}>
                <span><strong>{b.brand}</strong> {b.model}</span>
                <button className="btn-ghost" style={{ padding: '3px 8px', color: 'var(--red)' }} aria-label={`ลบ ${b.brand} ${b.model}`}
                  onClick={() => setConfirmDel({ kind: 'bike', id: b.id, label: `${b.brand} ${b.model}` })}><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* สี */}
      <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 18 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>สี (เพิ่มเอง)</h3>
        <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 12 }}>ชื่อสี + โค้ดสี (เช่น #1a3aff) — ไม่ใส่โค้ดก็ได้</p>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          <input style={{ ...inputStyle, flex: '1 1 130px' }} placeholder="ชื่อสี เช่น น้ำเงิน" value={colorLabel} onChange={e => setColorLabel(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addColor() }} />
          <input style={{ ...inputStyle, flex: '0 1 110px' }} placeholder="#1a3aff" value={colorHex} onChange={e => setColorHex(e.target.value)} />
          <button className="btn-primary" style={{ fontSize: 14 }} onClick={addColor}><Plus size={14} /> เพิ่ม</button>
        </div>
        {colors.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text3)' }}>ยังไม่มีสีที่เพิ่มเอง</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {colors.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, fontSize: 14, padding: '6px 10px', background: 'var(--bg3)', borderRadius: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 14, height: 14, borderRadius: '50%', background: c.hex ?? '#9ca3af', border: '0.5px solid rgba(255,255,255,.2)', flexShrink: 0 }} />
                  {c.label_th}
                </span>
                <button className="btn-ghost" style={{ padding: '3px 8px', color: 'var(--red)' }} aria-label={`ลบ ${c.label_th}`}
                  onClick={() => setConfirmDel({ kind: 'color', id: c.id, label: c.label_th })}><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDel}
        danger
        title="ลบรายการนี้?"
        message={confirmDel ? `ลบ "${confirmDel.label}" ออกจากรายการที่เพิ่มเอง (สินค้าที่ติดแท็กไว้แล้วไม่ถูกลบ)` : undefined}
        confirmLabel="ลบ"
        cancelLabel="ยกเลิก"
        onConfirm={() => { if (confirmDel) del(confirmDel.kind, confirmDel.id); setConfirmDel(null) }}
        onCancel={() => setConfirmDel(null)}
      />
    </div>
  )
}
