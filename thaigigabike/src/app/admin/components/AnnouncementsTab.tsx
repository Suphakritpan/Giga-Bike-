'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Pin, Edit, Trash2, Eye, EyeOff } from 'lucide-react'
import { ConfirmDialog, Spinner, useToast } from '@/components/ui'
import { ANNOUNCEMENT_TYPES, ANNOUNCEMENT_TYPE_LABELS } from './types'
import type { Announcement, AnnouncementType } from './types'

type FormState = {
  title_th: string; title_en: string; body_th: string; body_en: string
  type: AnnouncementType; pinned: boolean; published: boolean
}
const EMPTY: FormState = { title_th: '', title_en: '', body_th: '', body_en: '', type: 'info', pinned: false, published: true }

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: 14, border: '1px solid var(--border2)',
  borderRadius: 9, background: 'var(--bg3)', color: 'var(--text)', outline: 'none', boxSizing: 'border-box',
}

/** Announcements management — create / edit / publish / pin / delete shop
 *  announcements that appear in /notifications + the navbar bell. Self-contained:
 *  loads + mutates via /api/admin/announcements directly. */
export function AnnouncementsTab() {
  const [items, setItems] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const { toast } = useToast()

  const load = useCallback(async () => {
    setLoading(true)
    const d = await fetch('/api/admin/announcements').then(r => r.json()).catch(() => ({ announcements: [] }))
    setItems(d.announcements ?? [])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditingId(null); setForm(EMPTY); setError(''); setShowForm(true) }
  const openEdit = (a: Announcement) => {
    setEditingId(a.id)
    setForm({ title_th: a.title_th, title_en: a.title_en ?? '', body_th: a.body_th ?? '', body_en: a.body_en ?? '', type: a.type, pinned: a.pinned, published: a.published })
    setError(''); setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY); setError('') }
  const set = (patch: Partial<FormState>) => setForm(prev => ({ ...prev, ...patch }))

  const save = async () => {
    if (!form.title_th.trim()) { setError('กรุณากรอกหัวข้อ (ไทย)'); return }
    setSaving(true); setError('')
    const res = await fetch(
      editingId ? `/api/admin/announcements/${editingId}` : '/api/admin/announcements',
      { method: editingId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) },
    ).catch(() => null)
    setSaving(false)
    if (!res?.ok) { const e = await res?.json().catch(() => ({})); setError(e?.error || 'บันทึกไม่สำเร็จ'); return }
    const wasEdit = !!editingId
    closeForm()
    load()
    toast(wasEdit ? 'บันทึกประกาศแล้ว' : 'เพิ่มประกาศแล้ว')
  }

  // Optimistic toggle for publish / pin
  const patch = async (id: string, fields: Partial<Announcement>) => {
    const prev = items
    setItems(items.map(a => a.id === id ? { ...a, ...fields } : a))
    const res = await fetch(`/api/admin/announcements/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(fields),
    }).catch(() => null)
    if (!res?.ok) setItems(prev)
  }

  const remove = async (id: string) => {
    setItems(items.filter(a => a.id !== id))
    await fetch(`/api/admin/announcements/${id}`, { method: 'DELETE' }).catch(() => {})
    toast('ลบประกาศแล้ว')
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 14, color: 'var(--text2)' }}>
          {items.length} ประกาศ · {items.filter(a => a.published).length} เผยแพร่อยู่
        </span>
        {!showForm && (
          <button className="btn-primary" style={{ fontSize: 15, padding: '7px 14px' }} onClick={openCreate}>
            <Plus size={14} /> เพิ่มประกาศ
          </button>
        )}
      </div>

      {/* Create / edit form */}
      {showForm && (
        <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 12, padding: 18, marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>{editingId ? 'แก้ไขประกาศ' : 'ประกาศใหม่'}</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              <label style={{ fontSize: 13, color: 'var(--text2)' }}>
                หัวข้อ (ไทย) *
                <input style={{ ...inputStyle, marginTop: 4 }} value={form.title_th} onChange={e => set({ title_th: e.target.value })} placeholder="เช่น ปิดทำการวันหยุด" />
              </label>
              <label style={{ fontSize: 13, color: 'var(--text2)' }}>
                หัวข้อ (อังกฤษ)
                <input style={{ ...inputStyle, marginTop: 4 }} value={form.title_en} onChange={e => set({ title_en: e.target.value })} placeholder="optional" />
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
              <label style={{ fontSize: 13, color: 'var(--text2)' }}>
                เนื้อหา (ไทย)
                <textarea style={{ ...inputStyle, marginTop: 4, minHeight: 70, resize: 'vertical' }} value={form.body_th} onChange={e => set({ body_th: e.target.value })} />
              </label>
              <label style={{ fontSize: 13, color: 'var(--text2)' }}>
                เนื้อหา (อังกฤษ)
                <textarea style={{ ...inputStyle, marginTop: 4, minHeight: 70, resize: 'vertical' }} value={form.body_en} onChange={e => set({ body_en: e.target.value })} />
              </label>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <label style={{ fontSize: 13, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 8 }}>
                ประเภท
                <select className="input" style={{ fontSize: 14, padding: '6px 10px', width: 'auto' }} value={form.type} onChange={e => set({ type: e.target.value as AnnouncementType })}>
                  {ANNOUNCEMENT_TYPES.map(t => <option key={t} value={t}>{ANNOUNCEMENT_TYPE_LABELS[t]}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 14, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.pinned} onChange={e => set({ pinned: e.target.checked })} /> ปักหมุด
              </label>
              <label style={{ fontSize: 14, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.published} onChange={e => set({ published: e.target.checked })} /> เผยแพร่ทันที
              </label>
            </div>
            {error && <span style={{ fontSize: 13, color: 'var(--red)' }}>{error}</span>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" style={{ fontSize: 14, padding: '8px 18px' }} disabled={saving} onClick={save}>
                {saving ? '...' : editingId ? 'บันทึก' : 'เพิ่มประกาศ'}
              </button>
              <button className="btn-ghost" style={{ fontSize: 14 }} onClick={closeForm}>ยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <Spinner center />
      ) : items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 56, color: 'var(--text3)', fontSize: 15 }}>
          ยังไม่มีประกาศ — กด “เพิ่มประกาศ” เพื่อสร้างอันแรก
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(a => (
            <div key={a.id} style={{
              background: 'var(--bg2)', border: `0.5px solid ${a.published ? 'var(--border)' : 'rgba(249,115,22,.35)'}`,
              borderLeft: `3px solid ${a.published ? '#22c55e' : '#f97316'}`, borderRadius: 10, padding: '14px 18px',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {a.pinned && <Pin size={13} color="#f59e0b" fill="#f59e0b" />}
                    {a.title_th}
                    <span className="badge badge-gray" style={{ fontSize: 11 }}>{ANNOUNCEMENT_TYPE_LABELS[a.type]}</span>
                  </div>
                  {a.title_en && <div style={{ fontSize: 13, color: 'var(--text3)' }}>{a.title_en}</div>}
                  {a.body_th && <p style={{ fontSize: 13, color: 'var(--text2)', marginTop: 6, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{a.body_th}</p>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                    background: a.published ? 'rgba(34,197,94,.15)' : 'rgba(249,115,22,.15)',
                    color: a.published ? '#22c55e' : '#f97316',
                  }}>
                    {a.published ? 'เผยแพร่' : 'ซ่อน'}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>{new Date(a.created_at).toLocaleDateString('th-TH')}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 12px' }} onClick={() => patch(a.id, { published: !a.published })}>
                  {a.published ? <><EyeOff size={13} /> ซ่อน</> : <><Eye size={13} /> เผยแพร่</>}
                </button>
                <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 12px', color: a.pinned ? '#f59e0b' : 'var(--text2)' }} onClick={() => patch(a.id, { pinned: !a.pinned })}>
                  <Pin size={13} /> {a.pinned ? 'เลิกปักหมุด' : 'ปักหมุด'}
                </button>
                <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 12px' }} onClick={() => openEdit(a)}>
                  <Edit size={13} /> แก้ไข
                </button>
                <button className="btn-ghost" style={{ fontSize: 13, padding: '5px 12px', color: 'var(--red)' }} onClick={() => setConfirmDeleteId(a.id)}>
                  <Trash2 size={13} /> ลบ
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDeleteId}
        danger
        title="ลบประกาศนี้?"
        message="ประกาศจะถูกลบถาวร ไม่สามารถย้อนกลับได้"
        confirmLabel="ลบประกาศ"
        cancelLabel="ยกเลิก"
        onConfirm={() => { if (confirmDeleteId) remove(confirmDeleteId); setConfirmDeleteId(null) }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  )
}
