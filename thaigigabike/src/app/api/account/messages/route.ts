import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireUser } from '@/lib/auth/require-user'

// Customer inbox — messages sent with the account's email.
export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error
  if (!user.email) return NextResponse.json({ messages: [] })

  const svc = createServiceClient()
  const { data } = await svc.from('messages')
    .select('id, subject, body, product_code, status, created_at')
    .eq('sender_email', user.email)
    .order('created_at', { ascending: false })
  return NextResponse.json({ messages: data ?? [] })
}
