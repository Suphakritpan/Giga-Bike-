import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/require-user'

export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error
  const db = createClient()
  const { data } = await db.from('wishlists')
    .select('product_id, created_at, notify_price_drop, notify_restock').eq('user_id', user.id)
    .order('created_at', { ascending: false })
  return NextResponse.json({ items: data ?? [] })
}

// Toggle alert preferences for a wishlist item.
export async function PATCH(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error
  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* ignore */ }
  const product_id = String(body.product_id ?? '').trim()
  if (!product_id) return NextResponse.json({ error: 'product_id required' }, { status: 400 })

  const patch: Record<string, unknown> = {}
  if ('notify_price_drop' in body) patch.notify_price_drop = body.notify_price_drop === true
  if ('notify_restock'    in body) patch.notify_restock    = body.notify_restock === true
  if (Object.keys(patch).length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })

  const db = createClient()
  const { error: dbErr } = await db.from('wishlists').update(patch)
    .eq('user_id', user.id).eq('product_id', product_id)
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error
  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* ignore */ }
  const product_id = String(body.product_id ?? '').trim()
  if (!product_id) return NextResponse.json({ error: 'product_id required' }, { status: 400 })

  const db = createClient()
  const { error: dbErr } = await db.from('wishlists')
    .upsert({ user_id: user.id, product_id }, { onConflict: 'user_id,product_id' })
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error
  const { searchParams } = new URL(req.url)
  const product_id = searchParams.get('product_id')
  if (!product_id) return NextResponse.json({ error: 'product_id required' }, { status: 400 })

  const db = createClient()
  const { error: dbErr } = await db.from('wishlists').delete()
    .eq('user_id', user.id).eq('product_id', product_id)
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
