import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireUser } from '@/lib/auth/require-user'

const TOPICS = ['general', 'order', 'shipping', 'product', 'refund', 'claim', 'payment']

export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error
  const db = createClient()
  const { data } = await db.from('support_tickets')
    .select('*').eq('user_id', user.id)
    .order('created_at', { ascending: false })
  return NextResponse.json({ tickets: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* ignore */ }

  const topic    = TOPICS.includes(String(body.topic)) ? String(body.topic) : 'general'
  const subject  = String(body.subject ?? '').trim().slice(0, 200)
  const bodyText = String(body.body ?? '').trim().slice(0, 4000)
  const order_id = String(body.order_id ?? '').trim().slice(0, 30) || null
  const images   = Array.isArray(body.images) ? body.images.slice(0, 5) : []

  if (!subject || !bodyText) return NextResponse.json({ error: 'subject and body required' }, { status: 400 })

  const svc = createServiceClient()
  const { data, error: dbErr } = await svc.from('support_tickets').insert({
    user_id: user.id, email: user.email, topic, subject, body: bodyText, order_id, images,
  }).select().single()
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ticket: data })
}
