import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createServiceClient } from '@/lib/supabase/service'
import { writeAuditLog } from '@/lib/audit'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const supabase = createServiceClient()
  const { data, error: dbErr } = await supabase
    .from('products')
    .select('*')
    .order('created_at')

  if (dbErr) return NextResponse.json({ error: 'Failed to load products' }, { status: 500 })
  return NextResponse.json({ products: data })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error) return error

  let body: Record<string, unknown> | null = null
  try { body = await req.json() } catch { /* invalid JSON */ }

  if (!body?.code || !body?.name) {
    return NextResponse.json({ error: 'code and name are required' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error: dbErr } = await supabase.from('products').upsert(body)
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  await writeAuditLog({
    actor_user_id: user.id || null,
    actor_email: user.email,
    action: body.id ? 'product.update' : 'product.create',
    entity_type: 'product',
    entity_id: String(body.id ?? ''),
    after_json: { id: body.id, code: body.code, name: body.name, price: body.price, published: body.published },
  })
  return NextResponse.json({ ok: true })
}
