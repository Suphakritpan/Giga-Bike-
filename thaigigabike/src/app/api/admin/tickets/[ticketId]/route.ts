import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createServiceClient } from '@/lib/supabase/service'
import { writeAuditLog } from '@/lib/audit'

// GET: ticket + full reply thread (admin)
export async function GET(
  _req: NextRequest,
  { params }: { params: { ticketId: string } },
) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const db = createServiceClient()
  const { data: ticket } = await db.from('support_tickets').select('*').eq('id', params.ticketId).single()
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: replies } = await db.from('ticket_replies')
    .select('*').eq('ticket_id', params.ticketId).order('created_at', { ascending: true })

  return NextResponse.json({ ticket, replies: replies ?? [] })
}

// POST: admin reply (+ optional images) — marks the ticket answered
export async function POST(
  req: NextRequest,
  { params }: { params: { ticketId: string } },
) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const db = createServiceClient()
  const { data: ticket } = await db.from('support_tickets').select('id').eq('id', params.ticketId).single()
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* ignore */ }
  const text   = String(body.body ?? '').trim().slice(0, 4000)
  const images = Array.isArray(body.images) ? body.images.slice(0, 5) : []
  if (!text) return NextResponse.json({ error: 'body required' }, { status: 400 })

  const { error: dbErr } = await db.from('ticket_replies')
    .insert({ ticket_id: params.ticketId, author: 'shop', body: text, images })
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  await db.from('support_tickets').update({ status: 'answered' }).eq('id', params.ticketId)

  await writeAuditLog({
    actor_user_id: auth.user.id || null,
    actor_email: auth.user.email,
    action: 'ticket.reply',
    entity_type: 'support_ticket',
    entity_id: params.ticketId,
  })
  return NextResponse.json({ ok: true })
}

// PATCH: change ticket status (open / answered / closed)
const VALID_STATUSES = new Set(['open', 'answered', 'closed'])

export async function PATCH(
  req: NextRequest,
  { params }: { params: { ticketId: string } },
) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* ignore */ }

  if (!VALID_STATUSES.has(body.status as string)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const db = createServiceClient()
  const { error } = await db.from('support_tickets').update({ status: body.status }).eq('id', params.ticketId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await writeAuditLog({
    actor_user_id: auth.user.id || null,
    actor_email: auth.user.email,
    action: 'ticket.status',
    entity_type: 'support_ticket',
    entity_id: params.ticketId,
    after_json: { status: body.status },
  })
  return NextResponse.json({ ok: true })
}
