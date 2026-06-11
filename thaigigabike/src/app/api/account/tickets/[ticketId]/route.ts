import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireUser } from '@/lib/auth/require-user'
import { getOwnedRow } from '@/lib/api'

// GET: ticket + reply thread (owner only)
export async function GET(_req: NextRequest, { params }: { params: { ticketId: string } }) {
  const { user, error } = await requireUser()
  if (error) return error

  const ticket = await getOwnedRow('support_tickets', params.ticketId, user.id)
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const svc = createServiceClient()
  const { data: replies } = await svc.from('ticket_replies')
    .select('*').eq('ticket_id', params.ticketId).order('created_at', { ascending: true })

  return NextResponse.json({ ticket, replies: replies ?? [] })
}

// POST: customer reply
export async function POST(req: NextRequest, { params }: { params: { ticketId: string } }) {
  const { user, error } = await requireUser()
  if (error) return error

  const ticket = await getOwnedRow('support_tickets', params.ticketId, user.id, { select: 'id, status' })
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* ignore */ }
  const text   = String(body.body ?? '').trim().slice(0, 4000)
  const images = Array.isArray(body.images) ? body.images.slice(0, 5) : []
  if (!text) return NextResponse.json({ error: 'body required' }, { status: 400 })

  const svc = createServiceClient()
  const { error: dbErr } = await svc.from('ticket_replies')
    .insert({ ticket_id: params.ticketId, author: 'customer', body: text, images })
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  await svc.from('support_tickets').update({ status: 'open' }).eq('id', params.ticketId)
  return NextResponse.json({ ok: true })
}

// PATCH: close ticket / rate support
export async function PATCH(req: NextRequest, { params }: { params: { ticketId: string } }) {
  const { user, error } = await requireUser()
  if (error) return error

  const ticket = await getOwnedRow('support_tickets', params.ticketId, user.id, { select: 'id' })
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* ignore */ }
  const patch: Record<string, unknown> = {}
  if (body.status === 'closed') patch.status = 'closed'
  if (typeof body.rating === 'number' && body.rating >= 1 && body.rating <= 5) patch.rating = body.rating
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const svc = createServiceClient()
  const { error: dbErr } = await svc.from('support_tickets').update(patch).eq('id', params.ticketId)
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
