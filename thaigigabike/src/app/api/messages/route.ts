import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

const MAX_LEN = { name: 100, email: 200, phone: 30, subject: 200, body: 2000, product_code: 30 }

function clamp(s: unknown, max: number): string {
  if (typeof s !== 'string') return ''
  return s.trim().slice(0, max)
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown> | null = null
  try { body = await req.json() } catch { /* ignore */ }

  const name         = clamp(body?.name, MAX_LEN.name)
  const email        = clamp(body?.email, MAX_LEN.email)
  const phone        = clamp(body?.phone, MAX_LEN.phone)
  const subject      = clamp(body?.subject, MAX_LEN.subject)
  const message      = clamp(body?.message, MAX_LEN.body)
  const product_code = clamp(body?.product_code, MAX_LEN.product_code)

  if (!name || !email || !message) {
    return NextResponse.json({ error: 'name, email and message are required' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 })
  }

  const db = createServiceClient()
  const { error } = await db.from('messages').insert({
    sender_name:  name,
    sender_email: email,
    sender_phone: phone || null,
    subject:      subject || null,
    body:         message,
    product_code: product_code || null,
  })

  if (error) {
    console.error('[messages] insert error:', error.message)
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
