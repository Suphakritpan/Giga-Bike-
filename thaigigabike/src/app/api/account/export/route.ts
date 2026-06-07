import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireUser } from '@/lib/auth/require-user'

// PDPA / GDPR-style data export — returns all account data as JSON.
export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error

  const db = createClient()
  const svc = createServiceClient()

  const [profile, addresses, wishlist, reviews, tickets] = await Promise.all([
    db.from('profiles').select('*').eq('id', user.id).single().then(r => r.data),
    db.from('addresses').select('*').eq('user_id', user.id).then(r => r.data),
    db.from('wishlists').select('*').eq('user_id', user.id).then(r => r.data),
    db.from('reviews').select('*').eq('user_id', user.id).then(r => r.data),
    db.from('support_tickets').select('*').eq('user_id', user.id).then(r => r.data),
  ])

  // orders by user_id + email (service role for guest orders)
  const ordersByUser = (await db.from('orders').select('*').eq('user_id', user.id)).data ?? []
  const ordersByEmail = user.email
    ? (await svc.from('orders').select('*').eq('contact_email', user.email).is('user_id', null)).data ?? []
    : []
  const messages = user.email
    ? (await svc.from('messages').select('*').eq('sender_email', user.email)).data ?? []
    : []

  const payload = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email, created_at: user.created_at },
    profile, addresses, wishlist, reviews, tickets, messages,
    orders: [...ordersByUser, ...ordersByEmail],
  }

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="gigabike-account-${user.id.slice(0, 8)}.json"`,
    },
  })
}
