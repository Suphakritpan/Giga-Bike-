import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { requireUser } from '@/lib/auth/require-user'

function ipHash(req: NextRequest): string | null {
  const raw = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip')
  return raw ? createHash('sha256').update(raw).digest('hex').slice(0, 16) : null
}

// List own login history
export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error
  const db = createServiceClient()
  const { data } = await db.from('login_events')
    .select('id, ip_hash, user_agent, created_at')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
  return NextResponse.json({ events: data ?? [] })
}

// Record a login event for the current user (called after successful login)
export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error
  const svc = createServiceClient()
  await svc.from('login_events').insert({
    user_id: user.id,
    ip_hash: ipHash(req),
    user_agent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
  })
  return NextResponse.json({ ok: true })
}
