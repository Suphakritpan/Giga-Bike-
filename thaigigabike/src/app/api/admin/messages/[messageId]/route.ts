import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createServiceClient } from '@/lib/supabase/service'
import { writeAuditLog } from '@/lib/audit'

// GET: message + full reply thread (admin)
export async function GET(
  _req: NextRequest,
  { params }: { params: { messageId: string } },
) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const db = createServiceClient()
  const { data: message } = await db.from('messages').select('*').eq('id', params.messageId).single()
  if (!message) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: replies } = await db.from('message_replies')
    .select('*').eq('message_id', params.messageId).order('created_at', { ascending: true })

  return NextResponse.json({ message, replies: replies ?? [] })
}

// POST: admin reply (+ optional images) — marks the thread replied
export async function POST(
  req: NextRequest,
  { params }: { params: { messageId: string } },
) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const db = createServiceClient()
  const { data: msg } = await db.from('messages').select('id').eq('id', params.messageId).single()
  if (!msg) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* ignore */ }
  const text   = String(body.body ?? '').trim().slice(0, 4000)
  const images = Array.isArray(body.images) ? body.images.slice(0, 5) : []
  if (!text) return NextResponse.json({ error: 'body required' }, { status: 400 })

  const { error: dbErr } = await db.from('message_replies')
    .insert({ message_id: params.messageId, author: 'shop', body: text, images })
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })

  await db.from('messages').update({ status: 'replied' }).eq('id', params.messageId)

  await writeAuditLog({
    actor_user_id: auth.user.id || null,
    actor_email: auth.user.email,
    action: 'message.reply',
    entity_type: 'message',
    entity_id: params.messageId,
  })
  return NextResponse.json({ ok: true })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { messageId: string } },
) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* ignore */ }

  const allowed = ['status']
  const patch: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) patch[key] = body[key]
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const db = createServiceClient()
  const { error } = await db
    .from('messages')
    .update(patch)
    .eq('id', params.messageId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
