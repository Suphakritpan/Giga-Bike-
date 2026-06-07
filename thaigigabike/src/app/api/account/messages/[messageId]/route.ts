import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireUser } from '@/lib/auth/require-user'

// GET: message + reply thread (owner = matching sender_email)
export async function GET(_req: NextRequest, { params }: { params: { messageId: string } }) {
  const { user, error } = await requireUser()
  if (error) return error
  const svc = createServiceClient()

  const { data: msg } = await svc.from('messages').select('*').eq('id', params.messageId).single()
  if (!msg || msg.sender_email !== user.email) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: replies } = await svc.from('message_replies')
    .select('*').eq('message_id', params.messageId).order('created_at', { ascending: true })

  return NextResponse.json({ message: msg, replies: replies ?? [] })
}

// POST: customer reply (+ optional images)
export async function POST(req: NextRequest, { params }: { params: { messageId: string } }) {
  const { user, error } = await requireUser()
  if (error) return error
  const svc = createServiceClient()

  const { data: msg } = await svc.from('messages').select('id, sender_email').eq('id', params.messageId).single()
  if (!msg || msg.sender_email !== user.email) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* ignore */ }
  const text   = String(body.body ?? '').trim().slice(0, 2000)
  const images = Array.isArray(body.images) ? body.images.slice(0, 5) : []
  if (!text) return NextResponse.json({ error: 'body required' }, { status: 400 })

  const { error: dbErr } = await svc.from('message_replies')
    .insert({ message_id: params.messageId, author: 'customer', body: text, images })
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  // Re-open the thread so the shop sees a new customer reply
  await svc.from('messages').update({ status: 'new' }).eq('id', params.messageId)
  return NextResponse.json({ ok: true })
}
