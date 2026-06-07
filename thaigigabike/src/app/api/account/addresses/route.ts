import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/require-user'

export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error
  const db = createClient()
  const { data } = await db.from('addresses')
    .select('*').eq('user_id', user.id)
    .order('is_default', { ascending: false }).order('created_at', { ascending: false })
  return NextResponse.json({ addresses: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* ignore */ }

  const label          = ['home', 'work', 'shop', 'other'].includes(String(body.label)) ? String(body.label) : 'home'
  const recipient_name = String(body.recipient_name ?? '').trim().slice(0, 100)
  const phone          = String(body.phone ?? '').trim().slice(0, 30)
  const address        = String(body.address ?? '').trim().slice(0, 500)
  const is_default     = body.is_default === true

  if (!recipient_name || !phone || !address) {
    return NextResponse.json({ error: 'recipient_name, phone, address required' }, { status: 400 })
  }

  const db = createClient()
  // If setting default, clear others first
  if (is_default) {
    await db.from('addresses').update({ is_default: false }).eq('user_id', user.id)
  }
  const { data, error: dbErr } = await db.from('addresses')
    .insert({ user_id: user.id, label, recipient_name, phone, address, is_default })
    .select().single()
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ address: data })
}
