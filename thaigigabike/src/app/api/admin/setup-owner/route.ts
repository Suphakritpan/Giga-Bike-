import { NextRequest, NextResponse } from 'next/server'
import { createHash, timingSafeEqual } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'

function secretMatches(given: string, expected: string): boolean {
  // Hash both sides so lengths are equal — timingSafeEqual requires it
  const a = createHash('sha256').update(given).digest()
  const b = createHash('sha256').update(expected).digest()
  return timingSafeEqual(a, b)
}

export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_SETUP_SECRET
  if (!secret || secret === 'change-me-in-local-env') {
    return NextResponse.json({ error: 'Setup disabled' }, { status: 403 })
  }

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* invalid JSON */ }
  if (typeof body.secret !== 'string' || !secretMatches(body.secret, secret)) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 403 })
  }
  const email = String(body.email ?? '').trim().toLowerCase()
  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 })
  }

  const db = createServiceClient()
  const { data, error } = await db
    .from('users')
    .update({ role: 'owner', admin_active: true })
    .eq('email', email)
    .select('id, email, role')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, user: { id: data.id, email: data.email, role: data.role } })
}
