import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireUser } from '@/lib/auth/require-user'

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* ignore */ }

  const order_id = String(body.order_id ?? '').trim()
  const tax_id   = String(body.tax_id ?? '').trim().slice(0, 20)
  const company  = String(body.company ?? '').trim().slice(0, 200)
  const address  = String(body.address ?? '').trim().slice(0, 500)

  if (!order_id || !tax_id || !company || !address) {
    return NextResponse.json({ error: 'All fields required' }, { status: 400 })
  }

  const svc = createServiceClient()
  const { error: dbErr } = await svc.from('tax_invoice_requests')
    .insert({ user_id: user.id, order_id, tax_id, company, address })
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
