import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createServiceClient } from '@/lib/supabase/service'
import { writeAuditLog } from '@/lib/audit'

// PATCH: mark a tax-invoice request as issued / requested.
const VALID_STATUSES = new Set(['requested', 'issued'])

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* ignore */ }

  if (!VALID_STATUSES.has(body.status as string)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const db = createServiceClient()
  const { error } = await db.from('tax_invoice_requests').update({ status: body.status }).eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await writeAuditLog({
    actor_user_id: auth.user.id || null,
    actor_email: auth.user.email,
    action: 'tax_invoice.status',
    entity_type: 'tax_invoice_request',
    entity_id: params.id,
    after_json: { status: body.status },
  })
  return NextResponse.json({ ok: true })
}
