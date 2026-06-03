'use client'
import { useState, useEffect } from 'react'
import { X, Save, AlertCircle } from 'lucide-react'
import { categories, bikeModels } from '@/data/products'
import type { Product } from '@/data/products'

const ALL_COLORS = ['black', 'silver', 'gold', 'hard', 'polished', 'black-silver', 'raw', 'gray']
const COLOR_LABELS: Record<string, string> = {
  black: 'ดำ', silver: 'เงิน', gold: 'ทอง', hard: 'ฮาร์ด',
  polished: 'ปัดเงา', 'black-silver': 'ดำ-เงิน', raw: 'กัดดิบ', gray: 'เทา',
}

type FormData = {
  code: string
  name: string
  nameTh: string
  price: string
  category: string
  bikeModels: string[]
  colors: string[]
  inStock: boolean
  stockCount: string
  material: string
  description: string
  descriptionTh: string
  featured: boolean
}

type Errors = Partial<Record<keyof FormData, string>>

const EMPTY_FORM: FormData = {
  code: '', name: '', nameTh: '', price: '', category: categories[0].id,
  bikeModels: [], colors: [], inStock: true, stockCount: '0',
  material: '', description: '', descriptionTh: '', featured: false,
}

function sanitizeText(val: string): string {
  return val.replace(/[<>"'`]/g, '').slice(0, 500)
}

function validate(form: FormData): Errors {
  const e: Errors = {}
  if (!form.code.trim()) e.code = 'กรุณากรอกรหัสสินค้า'
  else if (!/^[A-Za-z0-9.\-\s]+$/.test(form.code)) e.code = 'รหัสสินค้าใช้ได้เฉพาะ A-Z, 0-9, จุด, ขีด'
  if (!form.name.trim()) e.name = 'กรุณากรอกชื่อภาษาอังกฤษ'
  if (!form.nameTh.trim()) e.nameTh = 'กรุณากรอกชื่อภาษาไทย'
  const price = Number(form.price)
  if (!form.price || isNaN(price) || price <= 0) e.price = 'ราคาต้องมากกว่า 0'
  if (price > 10_000_000) e.price = 'ราคาเกินขีดจำกัด'
  if (!form.category) e.category = 'กรุณาเลือกหมวดหมู่'
  if (form.colors.length === 0) e.colors = 'กรุณาเลือกอย่างน้อย 1 สี'
  const stock = Number(form.stockCount)
  if (isNaN(stock) || stock < 0) e.stockCount = 'จำนวนต้องไม่ติดลบ'
  if (stock > 99999) e.stockCount = 'จำนวนเกินขีดจำกัด'
  if (!form.material.trim()) e.material = 'กรุณากรอกวัสดุ'
  if (!form.description.trim()) e.description = 'กรุณากรอกรายละเอียด (EN)'
  if (!form.descriptionTh.trim()) e.descriptionTh = 'กรุณากรอกรายละเอียด (TH)'
  return e
}

type Props = {
  product: Product | null
  onClose: () => void
  onSave: (data: Omit<Product, 'id'> & { id?: string }) => Promise<void>
}

export function ProductModal({ product, onClose, onSave }: Props) {
  const isEdit = !!product
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')

  useEffect(() => {
    if (product) {
      setForm({
        code: product.code,
        name: product.name,
        nameTh: product.nameTh,
        price: String(product.price),
        category: product.category,
        bikeModels: product.bikeModels,
        colors: product.colors,
        inStock: product.inStock,
        stockCount: String(product.stockCount),
        material: product.material,
        description: product.description,
        descriptionTh: product.descriptionTh,
        featured: product.featured,
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setErrors({})
    setServerError('')
  }, [product])

  const set = (field: keyof FormData, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const toggleArray = (field: 'bikeModels' | 'colors', val: string) =>
    set(field, form[field].includes(val)
      ? form[field].filter(v => v !== val)
      : [...form[field], val])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setSaving(true)
    setServerError('')
    try {
      await onSave({
        ...(isEdit ? { id: product!.id } : {}),
        code: sanitizeText(form.code.trim()),
        name: sanitizeText(form.name.trim()),
        nameTh: sanitizeText(form.nameTh.trim()),
        price: Number(form.price),
        category: form.category,
        bikeModels: form.bikeModels,
        colors: form.colors,
        inStock: form.inStock,
        stockCount: Math.max(0, Math.floor(Number(form.stockCount))),
        material: sanitizeText(form.material.trim()),
        description: sanitizeText(form.description.trim()),
        descriptionTh: sanitizeText(form.descriptionTh.trim()),
        images: product?.images ?? [],
        featured: form.featured,
      })
      onClose()
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setSaving(false)
    }
  }

  const inputErr = (field: keyof FormData) =>
    errors[field] ? { borderColor: 'var(--red)' } : {}

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 16, width: '100%', maxWidth: 680, padding: 28, position: 'relative' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ fontSize: 24 }}>{isEdit ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Section: รหัส + ราคา */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Field label="รหัสสินค้า *" error={errors.code}>
              <input className="input" style={inputErr('code')} value={form.code} maxLength={20}
                onChange={e => set('code', e.target.value)} placeholder="G.232" />
            </Field>
            <Field label="ราคา (฿) *" error={errors.price}>
              <input className="input" style={inputErr('price')} value={form.price} type="number" min={1} max={10000000}
                onChange={e => set('price', e.target.value)} placeholder="6000" />
            </Field>
          </div>

          {/* Section: ชื่อ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Field label="ชื่อสินค้า (EN) *" error={errors.name}>
              <input className="input" style={inputErr('name')} value={form.name} maxLength={200}
                onChange={e => set('name', e.target.value)} placeholder="Custom Brake Disc SR 310mm." />
            </Field>
            <Field label="ชื่อสินค้า (TH) *" error={errors.nameTh}>
              <input className="input" style={inputErr('nameTh')} value={form.nameTh} maxLength={200}
                onChange={e => set('nameTh', e.target.value)} placeholder="จานเบรคแต่ง SR 310mm." />
            </Field>
          </div>

          {/* Section: หมวดหมู่ + วัสดุ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
            <Field label="หมวดหมู่ *" error={errors.category}>
              <select className="input" style={inputErr('category')} value={form.category}
                onChange={e => set('category', e.target.value)}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nameTh} ({c.name})</option>)}
              </select>
            </Field>
            <Field label="วัสดุ *" error={errors.material}>
              <input className="input" style={inputErr('material')} value={form.material} maxLength={200}
                onChange={e => set('material', e.target.value)} placeholder="Alloy 6061 CNC Billet" />
            </Field>
          </div>

          {/* Section: สต็อก */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
            <Field label="จำนวนสต็อก *" error={errors.stockCount}>
              <input className="input" style={inputErr('stockCount')} value={form.stockCount} type="number" min={0} max={99999}
                onChange={e => set('stockCount', e.target.value)} />
            </Field>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingTop: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 16 }}>
                <input type="checkbox" checked={form.inStock} onChange={e => set('inStock', e.target.checked)} />
                มีสินค้า
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 16 }}>
                <input type="checkbox" checked={form.featured} onChange={e => set('featured', e.target.checked)} />
                สินค้าแนะนำ
              </label>
            </div>
          </div>

          {/* Section: สี */}
          <Field label="สี * (เลือกได้หลายสี)" error={errors.colors}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {ALL_COLORS.map(c => (
                <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14, padding: '4px 10px', borderRadius: 6, border: `0.5px solid ${form.colors.includes(c) ? 'var(--green)' : 'var(--border2)'}`, background: form.colors.includes(c) ? 'rgba(34,197,94,.1)' : 'var(--bg3)', color: form.colors.includes(c) ? 'var(--green)' : 'var(--text2)' }}>
                  <input type="checkbox" checked={form.colors.includes(c)} onChange={() => toggleArray('colors', c)} style={{ display: 'none' }} />
                  {COLOR_LABELS[c]}
                </label>
              ))}
            </div>
          </Field>

          {/* Section: รุ่นรถ */}
          <div style={{ marginBottom: 16 }}>
            <p style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 8 }}>รุ่นรถที่รองรับ (เลือกได้หลายรุ่น)</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 6 }}>
              {bikeModels.map(bm => (
                <label key={bm.id} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 14, padding: '4px 8px', borderRadius: 6, border: `0.5px solid ${form.bikeModels.includes(bm.id) ? 'var(--green)' : 'var(--border)'}`, background: form.bikeModels.includes(bm.id) ? 'rgba(34,197,94,.08)' : 'transparent', color: form.bikeModels.includes(bm.id) ? 'var(--green)' : 'var(--text2)' }}>
                  <input type="checkbox" checked={form.bikeModels.includes(bm.id)} onChange={() => toggleArray('bikeModels', bm.id)} style={{ display: 'none' }} />
                  {bm.brand} {bm.model}
                </label>
              ))}
            </div>
          </div>

          {/* Section: รายละเอียด */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <Field label="รายละเอียด (EN) *" error={errors.description}>
              <textarea className="input" style={{ ...inputErr('description'), height: 88, resize: 'none' }}
                value={form.description} maxLength={500}
                onChange={e => set('description', e.target.value)} placeholder="Description in English..." />
            </Field>
            <Field label="รายละเอียด (TH) *" error={errors.descriptionTh}>
              <textarea className="input" style={{ ...inputErr('descriptionTh'), height: 88, resize: 'none' }}
                value={form.descriptionTh} maxLength={500}
                onChange={e => set('descriptionTh', e.target.value)} placeholder="รายละเอียดภาษาไทย..." />
            </Field>
          </div>

          {/* Server error */}
          {serverError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, color: 'var(--red)', background: 'rgba(239,68,68,.08)', border: '0.5px solid rgba(239,68,68,.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16 }}>
              <AlertCircle size={15} /> {serverError}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn-ghost" onClick={onClose}>ยกเลิก</button>
            <button type="submit" className="btn-primary" disabled={saving} style={{ opacity: saving ? 0.7 : 1 }}>
              <Save size={15} /> {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <label style={{ fontSize: 14, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>{label}</label>
      {children}
      {error && <p style={{ fontSize: 13, color: 'var(--red)', marginTop: 3 }}>{error}</p>}
    </div>
  )
}
