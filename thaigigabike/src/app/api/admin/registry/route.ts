import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createServiceClient } from '@/lib/supabase/service'

// Slug for the PK — keeps Thai letters, collapses the rest. Same input -> same
// id, so re-adding the same value is idempotent (no duplicate variants).
const slug = (s: string) =>
  s.trim().toLowerCase().replace(/[^a-z0-9ก-๙]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 60)

// POST /api/admin/registry — add a bike model or colour ({ kind: 'bike'|'color' })
export async function POST(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* ignore */ }

  const db = createServiceClient()

  if (body.kind === 'bike') {
    const brand = typeof body.brand === 'string' ? body.brand.trim() : ''
    const model = typeof body.model === 'string' ? body.model.trim() : ''
    if (!brand || !model) return NextResponse.json({ error: 'ต้องมียี่ห้อและรุ่น' }, { status: 400 })
    const item = { id: slug(`${brand}-${model}`), brand, model }
    const { error } = await db.from('bike_models').upsert(item, { onConflict: 'id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, item })
  }

  if (body.kind === 'color') {
    const label_th = typeof body.label_th === 'string' ? body.label_th.trim() : ''
    if (!label_th) return NextResponse.json({ error: 'ต้องมีชื่อสี' }, { status: 400 })
    const hex = typeof body.hex === 'string' && /^#[0-9a-f]{3,8}$/i.test(body.hex.trim()) ? body.hex.trim() : null
    const item = { id: slug(label_th), label_th, hex }
    const { error } = await db.from('colors').upsert(item, { onConflict: 'id' })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, item })
  }

  return NextResponse.json({ error: "kind ต้องเป็น 'bike' หรือ 'color'" }, { status: 400 })
}

// DELETE /api/admin/registry?kind=bike|color&id=...
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const { searchParams } = new URL(req.url)
  const kind = searchParams.get('kind')
  const id = searchParams.get('id')
  if (!id || (kind !== 'bike' && kind !== 'color')) {
    return NextResponse.json({ error: 'kind + id required' }, { status: 400 })
  }
  const db = createServiceClient()
  const { error } = await db.from(kind === 'bike' ? 'bike_models' : 'colors').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
