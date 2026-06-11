import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireUser } from '@/lib/auth/require-user'

// PDPA / GDPR-style data export — returns all account data as JSON.
// Service role: account tables are service-only; every query filters by user.
export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error

  const svc = createServiceClient()

  const [profile, addresses, wishlist, reviews, tickets] = await Promise.all([
    svc.from('profiles').select('*').eq('id', user.id).single().then(r => r.data),
    svc.from('addresses').select('*').eq('user_id', user.id).then(r => r.data),
    svc.from('wishlists').select('*').eq('user_id', user.id).then(r => r.data),
    svc.from('reviews').select('*').eq('user_id', user.id).then(r => r.data),
    svc.from('support_tickets').select('*').eq('user_id', user.id).then(r => r.data),
  ])

  // Email-matched data requires a VERIFIED email (see /api/account/orders)
  const emailVerified = !!user.email_verified_at
  const ordersByUser = (await svc.from('orders').select('*').eq('user_id', user.id)).data ?? []
  const ordersByEmail = user.email && emailVerified
    ? (await svc.from('orders').select('*').eq('contact_email', user.email).is('user_id', null)).data ?? []
    : []
  const messages = user.email && emailVerified
    ? (await svc.from('messages').select('*').eq('sender_email', user.email)).data ?? []
    : []

  const payload = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, email: user.email },
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
