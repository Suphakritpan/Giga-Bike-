import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createServiceClient } from '@/lib/supabase/service'

// List all tax-invoice requests (newest first). Enriched with order total/email.
export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const db = createServiceClient()
  const { data: requests, error } = await db
    .from('tax_invoice_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Attach order total + contact email for context (best-effort).
  const orderIds = [...new Set((requests ?? []).map(r => r.order_id).filter(Boolean))]
  let orderMap: Record<string, { total: number; contact_email: string | null }> = {}
  if (orderIds.length) {
    const { data: orders } = await db
      .from('orders')
      .select('id, total, contact_email')
      .in('id', orderIds)
    orderMap = Object.fromEntries(
      (orders ?? []).map(o => [o.id, { total: o.total, contact_email: o.contact_email }]),
    )
  }

  const enriched = (requests ?? []).map(r => ({
    ...r,
    order_total: orderMap[r.order_id]?.total ?? null,
    order_email: orderMap[r.order_id]?.contact_email ?? null,
  }))

  return NextResponse.json({ requests: enriched })
}
