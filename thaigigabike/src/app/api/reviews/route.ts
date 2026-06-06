import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

const PAGE_SIZE = 20

// GET /api/reviews?productId=xxx&rating=5&page=1
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const productId = searchParams.get('productId') || null
  const rating    = parseInt(searchParams.get('rating') || '0', 10)
  const page      = Math.max(1, parseInt(searchParams.get('page') || '1', 10))

  const db = createClient()
  let q = db.from('reviews').select('*', { count: 'exact' })
    .eq('published', true)
    .order('created_at', { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  if (productId) q = q.eq('product_id', productId)
  if (rating >= 1 && rating <= 5) q = q.eq('rating', rating)

  const { data, error, count } = await q
  if (error) {
    // Table may not exist yet — return empty gracefully
    return NextResponse.json({ reviews: [], total: 0, pages: 0 })
  }
  return NextResponse.json({
    reviews: data ?? [],
    total:   count ?? 0,
    pages:   Math.ceil((count ?? 0) / PAGE_SIZE),
  })
}

// POST /api/reviews
export async function POST(req: NextRequest) {
  let body: Record<string, unknown> | null = null
  try { body = await req.json() } catch { /* ignore */ }

  const reviewer_name = (typeof body?.reviewer_name === 'string' ? body.reviewer_name : '').trim().slice(0, 100)
  const product_id    = (typeof body?.product_id    === 'string' ? body.product_id    : '').trim().slice(0, 100)
  const order_id      = (typeof body?.order_id      === 'string' ? body.order_id      : '').trim().slice(0, 30)
  const comment       = (typeof body?.comment       === 'string' ? body.comment       : '').trim().slice(0, 2000)
  const rating        = typeof body?.rating === 'number' ? body.rating : parseInt(String(body?.rating), 10)

  if (!reviewer_name || !rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'reviewer_name and rating (1-5) are required' }, { status: 400 })
  }

  const db = createServiceClient()
  const { error } = await db.from('reviews').insert({
    reviewer_name,
    product_id:  product_id || null,
    order_id:    order_id   || null,
    rating,
    comment:     comment    || null,
    images:      [],
    published:   false,
  })

  if (error) {
    console.error('[reviews] insert error:', error.message)
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
