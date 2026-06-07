import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createServiceClient } from '@/lib/supabase/service'
import { writeAuditLog } from '@/lib/audit'
import { sendStatusUpdateEmail } from '@/lib/email'

const VALID_STATUSES = new Set(['pending', 'paid', 'shipping', 'delivered', 'cancelled'])

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const { user, error } = await requireAdmin()
  if (error) return error

  if (!params.orderId || !/^GGB-[A-Z0-9]+$/.test(params.orderId)) {
    return NextResponse.json({ error: 'Invalid order ID' }, { status: 400 })
  }

  let body: Record<string, unknown> | null = null
  try { body = await req.json() } catch { /* invalid JSON */ }

  const patch: Record<string, unknown> = {}

  if (body && 'status' in body) {
    if (!VALID_STATUSES.has(body.status as string)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    patch.status = body.status
  }

  if (body && 'tracking_no' in body) {
    const tn = body.tracking_no
    patch.tracking_no = tn === null ? null : String(tn).trim() || null
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error: dbErr } = await supabase
    .from('orders')
    .update(patch)
    .eq('id', params.orderId)

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  // Fire status-update email (non-blocking — never fails the response)
  if (patch.status) {
    const { data: order } = await supabase
      .from('orders')
      .select('contact_email, recipient_name, tracking_no')
      .eq('id', params.orderId)
      .single()

    if (order?.contact_email) {
      sendStatusUpdateEmail(order.contact_email, {
        orderId:       params.orderId,
        recipientName: order.recipient_name ?? '',
        status:        patch.status as string,
        trackingNo:    (patch.tracking_no ?? order.tracking_no) as string | null,
      }).catch(() => {/* fire-and-forget */})
    }
  }

  await writeAuditLog({
    actor_user_id: user.id || null,
    actor_email: user.email,
    action: 'order.update',
    entity_type: 'order',
    entity_id: params.orderId,
    after_json: patch as Record<string, unknown>,
  })
  return NextResponse.json({ ok: true })
}
