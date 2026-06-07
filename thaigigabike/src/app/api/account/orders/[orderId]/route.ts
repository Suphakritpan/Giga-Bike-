import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireUser } from '@/lib/auth/require-user'

// Full order detail for the account owner (by user_id or matching email).
export async function GET(_req: NextRequest, { params }: { params: { orderId: string } }) {
  const { user, error } = await requireUser()
  if (error) return error

  const svc = createServiceClient()
  const { data: order } = await svc.from('orders').select('*').eq('id', params.orderId).single()
  if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const owns = order.user_id === user.id || (!!user.email && order.contact_email === user.email)
  if (!owns) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Never leak the private slip path
  delete (order as Record<string, unknown>).slip_path
  delete (order as Record<string, unknown>).slip_url
  return NextResponse.json({ order })
}
