import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireUser } from '@/lib/auth/require-user'

// Returns the user's orders: those linked by user_id PLUS any guest orders
// placed with the account's email (so pre-account purchases still show up).
export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error

  const cols = 'id, status, created_at, items, subtotal, cod_fee, total, shipping_method, shipping_fee, tracking_no'

  // user_id-linked orders (RLS allows own)
  const db = createClient()
  const { data: byUser } = await db.from('orders').select(cols).eq('user_id', user.id)

  // email-matched guest orders via service role (RLS would block these)
  let byEmail: Record<string, unknown>[] = []
  if (user.email) {
    const svc = createServiceClient()
    const { data } = await svc.from('orders').select(cols)
      .eq('contact_email', user.email).is('user_id', null)
    byEmail = data ?? []
  }

  // merge unique by id, sort newest first
  const map = new Map<string, Record<string, unknown>>()
  for (const o of [...(byUser ?? []), ...byEmail]) map.set(o.id as string, o)
  const orders = [...map.values()].sort((a, b) =>
    new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime())

  return NextResponse.json({ orders })
}
