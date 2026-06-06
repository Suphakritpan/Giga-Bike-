import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createServiceClient } from '@/lib/supabase/service'
import { writeAuditLog } from '@/lib/audit'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { productId: string } }
) {
  const { user, error } = await requireAdmin()
  if (error) return error

  const supabase = createServiceClient()

  // Fetch before state for audit trail.
  const { data: before } = await supabase
    .from('products')
    .select('id, code, name, name_th, price, stock_count')
    .eq('id', params.productId)
    .maybeSingle()

  const { error: dbErr } = await supabase
    .from('products')
    .delete()
    .eq('id', params.productId)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  await writeAuditLog({
    actor_user_id: user.id || null,
    actor_email: user.email,
    action: 'product.delete',
    entity_type: 'product',
    entity_id: params.productId,
    before_json: before as Record<string, unknown> | null,
  })
  return NextResponse.json({ ok: true })
}
