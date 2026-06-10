import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  const secret = process.env.ADMIN_SETUP_SECRET
  if (!secret || secret === 'change-me-in-local-env') {
    return NextResponse.json({ error: 'Setup disabled' }, { status: 403 })
  }

  const body = await req.json()
  if (body.secret !== secret) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 403 })
  }
  const email = (body.email || '').trim().toLowerCase()
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
