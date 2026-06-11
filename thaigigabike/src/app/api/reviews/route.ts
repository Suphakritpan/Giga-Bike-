import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'
import { isRateLimited, recordAttempt, hashIp } from '@/lib/api'

const PAGE_SIZE = 20
const MAX_REVIEWS_PER_HOUR = 5

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
  // CDN cache: 60s fresh, serve stale for 5 min while revalidating
  return NextResponse.json({
    reviews: data ?? [],
    total:   count ?? 0,
    pages:   Math.ceil((count ?? 0) / PAGE_SIZE),
  }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } })
}

// POST /api/reviews
export async function POST(req: NextRequest) {
  // Anti-spam: public write endpoint (reviews queue for approval)
  const ipHash = hashIp(req)
  if (await isRateLimited({ kind: 'review', ipHash, max: MAX_REVIEWS_PER_HOUR, windowMs: 3_600_000 })) {
    return NextResponse.json({ error: 'ส่งรีวิวบ่อยเกินไป กรุณาลองใหม่ภายหลัง' }, { status: 429 })
  }
  await recordAttempt({ kind: 'review', email: '', ipHash, success: true })

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
