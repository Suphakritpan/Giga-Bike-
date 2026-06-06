import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createServiceClient } from '@/lib/supabase/service'
import { writeAuditLog } from '@/lib/audit'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  const { user, error } = await requireAdmin()
  if (error) return error

  let body: Record<string, unknown> | null = null
  try { body = await req.json() } catch { /* invalid JSON */ }

  const stockCount = body?.stock_count
  const inStock = body?.in_stock
  if (typeof stockCount !== 'number' || typeof inStock !== 'boolean') {
    return NextResponse.json(
      { error: 'stock_count (number) and in_stock (boolean) are required' },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()
  const { error: dbErr } = await supabase
    .from('products')
    .update({ stock_count: stockCount, in_stock: inStock })
    .eq('id', params.productId)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  await writeAuditLog({
    actor_user_id: user.id || null,
    actor_email: user.email,
    action: 'product.stock_update',
    entity_type: 'product',
    entity_id: params.productId,
    after_json: { stock_count: stockCount, in_stock: inStock },
  })
  return NextResponse.json({ ok: true })
}
