'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Save, AlertCircle, Upload, Trash2, ImagePlus, ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { categories, bikeModels } from '@/data/products'
import type { Product } from '@/data/products'
const ALL_COLORS = ['black', 'silver', 'gold', 'hard', 'polished', 'black-silver', 'raw', 'gray']
const COLOR_LABELS: Record<string, string> = {
  black: 'ดำ', silver: 'เงิน', gold: 'ทอง', hard: 'ฮาร์ด',
  polished: 'ปัดเงา', 'black-silver': 'ดำ-เงิน', raw: 'กัดดิบ', gray: 'เทา',
}
const COLOR_DOT: Record<string, string> = {
  black: '#1a1a1a', silver: '#c0c0c0', gold: '#d4af37', hard: '#555',
  polished: '#ddd', 'black-silver': 'linear-gradient(135deg,#1a1a1a 50%,#c0c0c0 50%)',
  raw: '#8a7560', gray: '#9ca3af',
}

// Group bike models by brand
const BIKE_BRANDS = Array.from(new Set(bikeModels.map(b => b.brand)))

type Section = 'info' | 'images' | 'spec'

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
  published: boolean
  images: string[]
}

type Errors = Partial<Record<keyof FormData, string>>

const EMPTY_FORM: FormData = {
  code: '', name: '', nameTh: '', price: '', category: categories[0].id,
  bikeModels: [], colors: [], inStock: true, stockCount: '0',
  material: '', description: '', descriptionTh: '', featured: false, published: true,
  images: [],
}

function sanitizeText(val: string): string {
  return val.replace(/[<>"'`]/g, '').slice(0, 500)
}

// Required = the minimum to list + sell an item fast: code, Thai name, price,
// category, colour, material, stock. English name + both descriptions are
// optional — English falls back to the Thai value on save (see persist), so the
// storefront never shows a blank EN name.
function validate(form: FormData): Errors {
  const e: Errors = {}
  if (!form.code.trim()) e.code = 'กรุณากรอกรหัสสินค้า'
  else if (!/^[A-Za-z0-9.\-\s]+$/.test(form.code)) e.code = 'รหัสสินค้าใช้ได้เฉพาะ A-Z, 0-9, จุด, ขีด'
  if (!form.nameTh.trim()) e.nameTh = 'กรุณากรอกชื่อสินค้า'
  const price = Number(form.price)
  if (!form.price || isNaN(price) || price <= 0) e.price = 'ราคาต้องมากกว่า 0'
  if (price > 10_000_000) e.price = 'ราคาเกินขีดจำกัด'
  if (!form.category) e.category = 'กรุณาเลือกหมวดหมู่'
  if (form.colors.length === 0) e.colors = 'กรุณาเลือกอย่างน้อย 1 สี'
  const stock = Number(form.stockCount)
  if (isNaN(stock) || stock < 0) e.stockCount = 'จำนวนต้องไม่ติดลบ'
  if (stock > 99999) e.stockCount = 'จำนวนเกินขีดจำกัด'
  if (!form.material.trim()) e.material = 'กรุณากรอกวัสดุ'
  return e
}

type Props = {
  product: Product | null
  onClose: () => void
  onSave: (data: Omit<Product, 'id'> & { id?: string }) => Promise<void>
}

export function ProductModal({ product, onClose, onSave }: Props) {
  const isEdit = !!product
  const fileInputRef = useRef<HTMLInputElement>(null)
  const codeRef = useRef<HTMLInputElement>(null)

  const [savedCount, setSavedCount] = useState(0)
  const [section, setSection] = useState<Section>('info')
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [serverError, setServerError] = useState('')
  const [previewIdx, setPreviewIdx] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [urlInput, setUrlInput] = useState('')
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    if (product) {
      setForm({
        code: product.code,
        name: product.name,
        nameTh: product.nameTh,
        price: String(product.price),
        category: product.category,
        bikeModels: product.bikeModels ?? [],
        colors: product.colors ?? [],
        inStock: product.inStock,
        stockCount: String(product.stockCount),
        material: product.material,
        description: product.description,
        descriptionTh: product.descriptionTh,
        featured: product.featured,
        published: product.published ?? true,
        images: product.images ?? [],
      })
    } else {
      setForm(EMPTY_FORM)
    }
    setErrors({})
    setServerError('')
    setSection('info')
    setPreviewIdx(0)
    setUploadError('')
    setUrlInput('')
    setSavedCount(0)
  }, [product])

  const set = (field: keyof FormData, value: unknown) =>
    setForm(prev => ({ ...prev, [field]: value }))

  const toggleArray = (field: 'bikeModels' | 'colors', val: string) =>
    set(field, (form[field] as string[]).includes(val)
      ? (form[field] as string[]).filter(v => v !== val)
      : [...(form[field] as string[]), val])

  // ─── Image upload via guarded server API ───
  const uploadFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files)
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    const invalid = arr.filter(f => !allowed.includes(f.type))
    if (invalid.length > 0) { setUploadError('รองรับเฉพาะ JPG, PNG, WebP'); return }
    const oversize = arr.filter(f => f.size > 5 * 1024 * 1024)
    if (oversize.length > 0) { setUploadError('แต่ละภาพต้องไม่เกิน 5 MB'); return }

    setUploading(true)
    setUploadError('')
    const newUrls: string[] = []

    // Sanitize code for use as a path segment.
    const productId = (form.code || 'product')
      .replace(/[^A-Za-z0-9._\-]/g, '-').replace(/-+/g, '-').slice(0, 80)

    for (const file of arr) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('productId', productId)
      const res = await fetch('/api/admin/product-images/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        setUploadError(`อัปโหลดล้มเหลว: ${json.error ?? 'Unknown error'}`)
        setUploading(false)
        return
      }
      const { url } = await res.json()
      newUrls.push(url)
    }

    setForm(prev => ({ ...prev, images: [...prev.images, ...newUrls] }))
    setUploading(false)
  }, [form.code])

  const addImageUrl = () => {
    const url = urlInput.trim()
    if (!url) return
    try { new URL(url) } catch { setUploadError('URL ไม่ถูกต้อง'); return }
    setForm(prev => ({ ...prev, images: [...prev.images, url] }))
    setUrlInput('')
    setUploadError('')
  }

  const removeImage = (idx: number) => {
    const url = form.images[idx]
    // Best-effort: delete from storage if this is a product-images storage object.
    if (url?.includes('/storage/v1/object/public/product-images/')) {
      fetch('/api/admin/product-images/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      }).catch(() => { /* non-blocking */ })
    }
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))
    setPreviewIdx(prev => Math.min(prev, Math.max(0, form.images.length - 2)))
  }

  const moveImage = (from: number, to: number) => {
    setForm(prev => {
      const imgs = [...prev.images]
      const [moved] = imgs.splice(from, 1)
      imgs.splice(to, 0, moved)
      return { ...prev, images: imgs }
    })
    setPreviewIdx(to)
  }

  // Validate + save. Returns true on success, false (and shows errors) otherwise.
  const persist = async (): Promise<boolean> => {
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      // Jump to first section with errors
      if (errs.code || errs.nameTh || errs.price || errs.category) {
        setSection('info')
      } else if (errs.material || errs.colors || errs.stockCount) {
        setSection('spec')
      }
      return false
    }
    setSaving(true)
    setServerError('')
    try {
      await onSave({
        ...(isEdit ? { id: product!.id } : {}),
        code: sanitizeText(form.code.trim()),
        // EN name falls back to the Thai name so the EN storefront never shows blank.
        name: sanitizeText(form.name.trim() || form.nameTh.trim()),
        nameTh: sanitizeText(form.nameTh.trim()),
        price: Number(form.price),
        category: form.category,
        bikeModels: form.bikeModels,
        colors: form.colors,
        inStock: form.inStock,
        stockCount: Math.max(0, Math.floor(Number(form.stockCount))),
        material: sanitizeText(form.material.trim()),
        // EN description falls back to the Thai one; both may be empty (optional).
        description: sanitizeText(form.description.trim() || form.descriptionTh.trim()),
        descriptionTh: sanitizeText(form.descriptionTh.trim()),
        images: form.images,
        featured: form.featured,
        published: form.published,
        reviewReasons: product?.reviewReasons ?? [],
      })
      return true
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่')
      return false
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (await persist()) onClose()
  }

  // Save, keep the modal open, and clear only the per-item fields so a batch of
  // similar parts can be entered fast — category/colours/bike models/material/
  // stock/flags carry over to the next product.
  const handleSaveAndAdd = async () => {
    if (!(await persist())) return
    setSavedCount(c => c + 1)
    setForm(prev => ({
      ...EMPTY_FORM,
      category: prev.category,
      colors: prev.colors,
      bikeModels: prev.bikeModels,
      material: prev.material,
      stockCount: prev.stockCount,
      inStock: prev.inStock,
      featured: prev.featured,
      published: prev.published,
    }))
    setErrors({})
    setServerError('')
    setSection('info')
    setPreviewIdx(0)
    setUrlInput('')
    setUploadError('')
    setTimeout(() => codeRef.current?.focus(), 0)
  }

  const inputErr = (field: keyof FormData) =>
    errors[field] ? { borderColor: 'var(--red)' } : {}

  const SECTIONS: { id: Section; label: string; hasError: boolean }[] = [
    {
      id: 'info', label: 'ข้อมูลสินค้า',
      hasError: !!(errors.code || errors.nameTh || errors.price || errors.category),
    },
    { id: 'images', label: 'รูปภาพ', hasError: false },
    {
      id: 'spec', label: 'สเปค & สต็อก',
      hasError: !!(errors.material || errors.colors || errors.stockCount),
    },
  ]

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '20px 16px', overflowY: 'auto' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--bg2)', border: '0.5px solid var(--border)', borderRadius: 18, width: '100%', maxWidth: 780, position: 'relative', overflow: 'hidden' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '0.5px solid var(--border)', background: 'var(--bg)' }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>
              {isEdit ? `แก้ไข: ${product!.code}` : 'เพิ่มสินค้าใหม่'}
            </h2>
            {isEdit
              ? <p style={{ fontSize: 13, color: 'var(--text3)' }}>{product!.nameTh}</p>
              : <p style={{ fontSize: 13, color: 'var(--text3)' }}>กรอกช่องที่มี <span style={{ color: 'var(--green)', fontWeight: 700 }}>*</span> ให้ครบ — ที่เหลือไม่บังคับ</p>}
          </div>
          <button onClick={onClose} style={{ background: 'var(--bg3)', border: '0.5px solid var(--border)', borderRadius: 8, cursor: 'pointer', color: 'var(--text2)', display: 'flex', padding: 6 }}>
            <X size={18} />
          </button>
        </div>

        {/* ── Section Tabs ── */}
        <div style={{ display: 'flex', borderBottom: '0.5px solid var(--border)', background: 'var(--bg)' }}>
          {SECTIONS.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)} style={{
              padding: '10px 22px', fontSize: 15, fontWeight: 500, border: 'none',
              borderBottom: section === s.id ? '2px solid var(--green)' : '2px solid transparent',
              background: 'transparent', cursor: 'pointer', position: 'relative',
              color: s.hasError ? 'var(--red)' : section === s.id ? 'var(--green)' : 'var(--text2)',
            }}>
              {s.label}
              {s.hasError && <span style={{ position: 'absolute', top: 8, right: 8, width: 6, height: 6, borderRadius: '50%', background: 'var(--red)' }} />}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div style={{ padding: 24 }}>

            {savedCount > 0 && !isEdit && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--green)', background: 'rgba(34,197,94,.08)', border: '0.5px solid rgba(34,197,94,.3)', borderRadius: 8, padding: '8px 12px', marginBottom: 16 }}>
                ⚡ โหมดเพิ่มต่อเนื่อง — หมวด / สี / รุ่นรถ / วัสดุ / สต็อก ถูกคงไว้ให้ · กรอกแค่ รหัส · ชื่อ · ราคา · รูป แล้วกด “บันทึก &amp; เพิ่มต่อ”
              </div>
            )}

            {/* ══════════ SECTION: ข้อมูลสินค้า ══════════ */}
            {section === 'info' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* รหัส + ราคา */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="รหัสสินค้า *" error={errors.code}>
                    <input ref={codeRef} className="input" style={inputErr('code')} value={form.code} maxLength={20}
                      onChange={e => set('code', e.target.value)} placeholder="G.232" autoFocus={!isEdit} />
                  </Field>
                  <Field label="ราคา (฿) *" error={errors.price}>
                    <input className="input" style={inputErr('price')} value={form.price} type="number" min={1} max={10000000}
                      onChange={e => set('price', e.target.value)} placeholder="6000" />
                  </Field>
                </div>

                {/* ชื่อ — ไทยจำเป็น, EN ออปชัน (เว้นว่าง = ใช้ชื่อไทย) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="ชื่อสินค้า (ไทย) *" error={errors.nameTh}>
                    <input className="input" style={inputErr('nameTh')} value={form.nameTh} maxLength={200}
                      onChange={e => set('nameTh', e.target.value)} placeholder="จานเบรคแต่ง SR 310mm." />
                  </Field>
                  <Field label="ชื่อสินค้า (EN)" error={errors.name} hint="เว้นว่างได้ — จะใช้ชื่อไทยแทน">
                    <input className="input" style={inputErr('name')} value={form.name} maxLength={200}
                      onChange={e => set('name', e.target.value)} placeholder="(ออปชัน) Custom Brake Disc SR 310mm." />
                  </Field>
                </div>

                {/* หมวดหมู่ */}
                <Field label="หมวดหมู่ *" error={errors.category}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
                    {categories.map(c => (
                      <label key={c.id} style={{
                        display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                        fontSize: 14, padding: '8px 12px', borderRadius: 8,
                        border: `0.5px solid ${form.category === c.id ? 'var(--green)' : 'var(--border2)'}`,
                        background: form.category === c.id ? 'rgba(34,197,94,.12)' : 'var(--bg3)',
                        color: form.category === c.id ? 'var(--green)' : 'var(--text2)',
                        transition: 'all .15s',
                      }}>
                        <input type="radio" name="category" checked={form.category === c.id} onChange={() => set('category', c.id)} style={{ display: 'none' }} />
                        <span style={{ fontWeight: form.category === c.id ? 600 : 400 }}>{c.nameTh}</span>
                        <span style={{ fontSize: 12, color: form.category === c.id ? 'rgba(34,197,94,.7)' : 'var(--text3)', marginLeft: 'auto' }}>{c.name}</span>
                      </label>
                    ))}
                  </div>
                </Field>

                {/* รายละเอียด — ไม่บังคับทั้งคู่ (EN เว้นว่าง = ใช้ไทย) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="รายละเอียด (ไทย)" error={errors.descriptionTh}>
                    <textarea className="input" style={{ ...inputErr('descriptionTh'), height: 100, resize: 'vertical' }}
                      value={form.descriptionTh} maxLength={500}
                      onChange={e => set('descriptionTh', e.target.value)} placeholder="รายละเอียดภาษาไทย... (ไม่บังคับ)" />
                    <span style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2, display: 'block' }}>{form.descriptionTh.length}/500</span>
                  </Field>
                  <Field label="รายละเอียด (EN)" error={errors.description} hint="เว้นว่างได้ — จะใช้รายละเอียดไทยแทน">
                    <textarea className="input" style={{ ...inputErr('description'), height: 100, resize: 'vertical' }}
                      value={form.description} maxLength={500}
                      onChange={e => set('description', e.target.value)} placeholder="(optional) Description in English..." />
                    <span style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2, display: 'block' }}>{form.description.length}/500</span>
                  </Field>
                </div>

                {/* Flags */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {[
                    { key: 'inStock', label: 'มีสินค้า', desc: 'แสดงว่ามีสินค้าในร้าน' },
                    { key: 'featured', label: 'สินค้าแนะนำ', desc: 'แสดงในหน้าแรก' },
                    { key: 'published', label: 'เผยแพร่', desc: 'ลูกค้ามองเห็น' },
                  ].map(({ key, label, desc }) => (
                    <label key={key} style={{
                      display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
                      padding: '10px 16px', borderRadius: 10,
                      border: `0.5px solid ${(form[key as keyof FormData] as boolean) ? 'var(--green)' : 'var(--border2)'}`,
                      background: (form[key as keyof FormData] as boolean) ? 'rgba(34,197,94,.08)' : 'var(--bg3)',
                      flex: 1, minWidth: 140,
                    }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${(form[key as keyof FormData] as boolean) ? 'var(--green)' : 'var(--border2)'}`,
                        background: (form[key as keyof FormData] as boolean) ? 'var(--green)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {(form[key as keyof FormData] as boolean) && <span style={{ color: '#000', fontSize: 12, fontWeight: 700 }}>✓</span>}
                      </div>
                      <input type="checkbox" checked={form[key as keyof FormData] as boolean}
                        onChange={e => set(key as keyof FormData, e.target.checked)} style={{ display: 'none' }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: (form[key as keyof FormData] as boolean) ? 'var(--green)' : 'var(--text)' }}>{label}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* ══════════ SECTION: รูปภาพ ══════════ */}
            {section === 'images' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Showcase preview */}
                {form.images.length > 0 ? (
                  <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: 'var(--bg3)', border: '0.5px solid var(--border)', aspectRatio: '16/9', maxHeight: 320 }}>
                    <img
                      src={form.images[previewIdx]}
                      alt={`preview-${previewIdx}`}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={e => { (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23333" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%23666" font-size="12">No image</text></svg>' }}
                    />
                    {/* Nav arrows */}
                    {form.images.length > 1 && (
                      <>
                        <button type="button"
                          onClick={() => setPreviewIdx(i => (i - 1 + form.images.length) % form.images.length)}
                          style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,.6)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', display: 'flex', padding: '6px 4px' }}>
                          <ChevronLeft size={20} />
                        </button>
                        <button type="button"
                          onClick={() => setPreviewIdx(i => (i + 1) % form.images.length)}
                          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,.6)', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', display: 'flex', padding: '6px 4px' }}>
                          <ChevronRight size={20} />
                        </button>
                      </>
                    )}
                    {/* Index badge */}
                    <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,.6)', borderRadius: 6, padding: '3px 8px', fontSize: 13, color: '#fff' }}>
                      {previewIdx + 1} / {form.images.length}
                    </div>
                    {/* Primary badge */}
                    {previewIdx === 0 && (
                      <div style={{ position: 'absolute', top: 10, left: 10, background: 'var(--green)', borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600, color: '#000', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={11} /> ภาพหลัก
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ borderRadius: 12, border: '2px dashed var(--border2)', padding: '40px 20px', textAlign: 'center', color: 'var(--text3)', background: 'var(--bg3)' }}>
                    <ImagePlus size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                    <p style={{ fontSize: 16 }}>ยังไม่มีรูปภาพ</p>
                    <p style={{ fontSize: 13, marginTop: 4 }}>อัปโหลดหรือวาง URL ด้านล่าง</p>
                  </div>
                )}

                {/* Thumbnail strip */}
                {form.images.length > 0 && (
                  <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                    {form.images.map((url, i) => (
                      <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                        <button type="button" onClick={() => setPreviewIdx(i)} style={{
                          width: 72, height: 72, borderRadius: 8, overflow: 'hidden', padding: 0,
                          border: `2px solid ${previewIdx === i ? 'var(--green)' : 'var(--border2)'}`,
                          cursor: 'pointer', background: 'var(--bg3)',
                        }}>
                          <img src={url} alt={`thumb-${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3' }} />
                        </button>
                        {/* Set as primary */}
                        {i !== 0 && (
                          <button type="button" title="ตั้งเป็นภาพหลัก"
                            onClick={() => moveImage(i, 0)}
                            style={{ position: 'absolute', top: -6, left: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--bg2)', border: '0.5px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Star size={10} color="var(--text3)" />
                          </button>
                        )}
                        {/* Remove */}
                        <button type="button"
                          onClick={() => removeImage(i)}
                          style={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', background: 'var(--red)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <X size={10} color="#fff" />
                        </button>
                        {i === 0 && (
                          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--green)', fontSize: 9, fontWeight: 700, color: '#000', textAlign: 'center', padding: '1px 0', borderRadius: '0 0 6px 6px' }}>
                            หลัก
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload area */}
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files) }}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: `2px dashed ${dragOver ? 'var(--green)' : 'var(--border2)'}`,
                    borderRadius: 10, padding: '20px', textAlign: 'center',
                    cursor: uploading ? 'wait' : 'pointer',
                    background: dragOver ? 'rgba(34,197,94,.05)' : 'var(--bg3)',
                    transition: 'all .15s',
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    style={{ display: 'none' }}
                    onChange={e => { if (e.target.files) uploadFiles(e.target.files) }}
                  />
                  {uploading ? (
                    <p style={{ color: 'var(--text2)', fontSize: 15 }}>กำลังอัปโหลด...</p>
                  ) : (
                    <>
                      <Upload size={22} style={{ margin: '0 auto 8px', color: 'var(--text3)' }} />
                      <p style={{ fontSize: 15, color: 'var(--text2)' }}>คลิกหรือลากไฟล์มาวางที่นี่</p>
                      <p style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>JPG, PNG, WebP · ไม่เกิน 5 MB ต่อภาพ</p>
                    </>
                  )}
                </div>

                {/* URL input */}
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 6 }}>หรือวาง URL รูปภาพ</p>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="input"
                      style={{ flex: 1, fontSize: 14 }}
                      placeholder="https://example.com/image.jpg"
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addImageUrl())}
                    />
                    <button type="button" className="btn-ghost" onClick={addImageUrl} style={{ whiteSpace: 'nowrap', fontSize: 14 }}>
                      เพิ่ม URL
                    </button>
                  </div>
                </div>

                {uploadError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--red)', background: 'rgba(239,68,68,.08)', borderRadius: 8, padding: '8px 12px' }}>
                    <AlertCircle size={14} /> {uploadError}
                  </div>
                )}
              </div>
            )}

            {/* ══════════ SECTION: สเปค & สต็อก ══════════ */}
            {section === 'spec' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* วัสดุ + สต็อก */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="วัสดุ *" error={errors.material}>
                    <input className="input" style={inputErr('material')} value={form.material} maxLength={200}
                      onChange={e => set('material', e.target.value)} placeholder="Alloy 6061 CNC Billet" />
                  </Field>
                  <Field label="จำนวนสต็อก *" error={errors.stockCount}>
                    <input className="input" style={inputErr('stockCount')} value={form.stockCount} type="number" min={0} max={99999}
                      onChange={e => set('stockCount', e.target.value)} />
                  </Field>
                </div>

                {/* สี */}
                <Field label="สี * (เลือกได้หลายสี)" error={errors.colors}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {ALL_COLORS.map(c => {
                      const selected = form.colors.includes(c)
                      return (
                        <label key={c} style={{
                          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
                          fontSize: 14, padding: '6px 12px', borderRadius: 8,
                          border: `1.5px solid ${selected ? 'var(--green)' : 'var(--border2)'}`,
                          background: selected ? 'rgba(34,197,94,.1)' : 'var(--bg3)',
                          color: selected ? 'var(--green)' : 'var(--text2)',
                          transition: 'all .12s',
                        }}>
                          <input type="checkbox" checked={selected} onChange={() => toggleArray('colors', c)} style={{ display: 'none' }} />
                          <span style={{
                            width: 14, height: 14, borderRadius: '50%', flexShrink: 0,
                            background: COLOR_DOT[c], border: '0.5px solid rgba(255,255,255,.2)',
                          }} />
                          {COLOR_LABELS[c]}
                        </label>
                      )
                    })}
                  </div>
                </Field>

                {/* รุ่นรถ — grouped by brand */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <p style={{ fontSize: 14, color: 'var(--text2)', fontWeight: 500 }}>รุ่นรถที่รองรับ ({form.bikeModels.length} รุ่น)</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="btn-ghost" style={{ fontSize: 13, padding: '3px 10px' }}
                        onClick={() => set('bikeModels', bikeModels.map(b => b.id))}>
                        เลือกทั้งหมด
                      </button>
                      <button type="button" className="btn-ghost" style={{ fontSize: 13, padding: '3px 10px' }}
                        onClick={() => set('bikeModels', [])}>
                        ล้าง
                      </button>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {BIKE_BRANDS.map(brand => {
                      const brandModels = bikeModels.filter(b => b.brand === brand)
                      const allSelected = brandModels.every(b => form.bikeModels.includes(b.id))
                      const someSelected = brandModels.some(b => form.bikeModels.includes(b.id))
                      return (
                        <div key={brand}>
                          {/* Brand header with select-all toggle */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                              <div style={{
                                width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                                border: `2px solid ${allSelected ? 'var(--green)' : someSelected ? 'var(--orange)' : 'var(--border2)'}`,
                                background: allSelected ? 'var(--green)' : someSelected ? 'rgba(249,115,22,.2)' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>
                                {(allSelected || someSelected) && <span style={{ color: allSelected ? '#000' : '#f97316', fontSize: 10, fontWeight: 700 }}>{allSelected ? '✓' : '—'}</span>}
                              </div>
                              <input type="checkbox" checked={allSelected} onChange={() => {
                                if (allSelected) {
                                  set('bikeModels', form.bikeModels.filter(id => !brandModels.find(b => b.id === id)))
                                } else {
                                  const ids = brandModels.map(b => b.id)
                                  set('bikeModels', [...new Set([...form.bikeModels, ...ids])])
                                }
                              }} style={{ display: 'none' }} />
                              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>{brand}</span>
                            </label>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 5, paddingLeft: 4 }}>
                            {brandModels.map(bm => {
                              const sel = form.bikeModels.includes(bm.id)
                              return (
                                <label key={bm.id} style={{
                                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                                  fontSize: 13, padding: '5px 10px', borderRadius: 7,
                                  border: `0.5px solid ${sel ? 'var(--green)' : 'var(--border)'}`,
                                  background: sel ? 'rgba(34,197,94,.08)' : 'transparent',
                                  color: sel ? 'var(--green)' : 'var(--text2)',
                                  transition: 'all .12s',
                                }}>
                                  <input type="checkbox" checked={sel} onChange={() => toggleArray('bikeModels', bm.id)} style={{ display: 'none' }} />
                                  <div style={{
                                    width: 12, height: 12, borderRadius: 3, flexShrink: 0,
                                    border: `1.5px solid ${sel ? 'var(--green)' : 'var(--border2)'}`,
                                    background: sel ? 'var(--green)' : 'transparent',
                                  }} />
                                  {bm.model}
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div style={{ borderTop: '0.5px solid var(--border)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg)', gap: 12 }}>
            {/* Section nav */}
            <div style={{ display: 'flex', gap: 8 }}>
              {section !== 'info' && (
                <button type="button" className="btn-ghost" style={{ fontSize: 15 }}
                  onClick={() => setSection(section === 'spec' ? 'images' : 'info')}>
                  ← ก่อนหน้า
                </button>
              )}
              {section !== 'spec' && (
                <button type="button" className="btn-ghost" style={{ fontSize: 15 }}
                  onClick={() => setSection(section === 'info' ? 'images' : 'spec')}>
                  ถัดไป →
                </button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {savedCount > 0 && (
                <span style={{ fontSize: 13, color: 'var(--green)', fontWeight: 600 }}>เพิ่มแล้ว {savedCount} รายการ</span>
              )}
              {serverError && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--red)' }}>
                  <AlertCircle size={13} /> {serverError}
                </div>
              )}
              <button type="button" className="btn-ghost" onClick={onClose} disabled={saving}>
                {savedCount > 0 ? 'เสร็จสิ้น' : 'ยกเลิก'}
              </button>
              {isEdit ? (
                <button type="submit" className="btn-primary" disabled={saving || uploading} style={{ opacity: saving ? 0.7 : 1 }}>
                  <Save size={15} /> {saving ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
              ) : (
                <>
                  <button type="submit" className="btn-ghost" disabled={saving || uploading}>
                    <Save size={15} /> บันทึก & ปิด
                  </button>
                  <button type="button" onClick={handleSaveAndAdd} disabled={saving || uploading} className="btn-primary"
                    title="บันทึกแล้วเปิดฟอร์มเปล่าต่อ — คงหมวด/สี/รุ่นรถ/วัสดุ/สต็อกไว้ให้กรอกตัวถัดไปเร็ว ๆ"
                    style={{ opacity: (saving || uploading) ? 0.7 : 1 }}>
                    <Save size={15} /> {saving ? 'กำลังบันทึก...' : 'บันทึก & เพิ่มต่อ'}
                  </button>
                </>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <label style={{ fontSize: 14, color: 'var(--text2)', display: 'block', marginBottom: 5 }}>{label}</label>
      {children}
      {hint && !error && <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 3 }}>{hint}</p>}
      {error && <p style={{ fontSize: 13, color: 'var(--red)', marginTop: 3 }}>{error}</p>}
    </div>
  )
}
