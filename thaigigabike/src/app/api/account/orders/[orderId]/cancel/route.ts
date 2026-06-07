import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireUser } from '@/lib/auth/require-user'

// Cancel own order — only allowed while pending or paid (not yet shipped).
export async function POST(_req: NextRequest, { params }: { params: { orderId: string } }) {
  const { user, error } = await requireUser()
  if (error) return error

  const svc = createServiceClient()
  const { data: order } = await svc.from('orders')
    .select('id, status, user_id, contact_email')
    .eq('id', params.orderId).single()

  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  // Ownership: by user_id or matching email
  const owns = order.user_id === user.id || (!!user.email && order.contact_email === user.email)
  if (!owns) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!['pending', 'paid'].includes(order.status)) {
    return NextResponse.json({ error: 'Order can no longer be cancelled' }, { status: 400 })
  }

  const { error: dbErr } = await svc.from('orders').update({ status: 'cancelled' }).eq('id', params.orderId)
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
