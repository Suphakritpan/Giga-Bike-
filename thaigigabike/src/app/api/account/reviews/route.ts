import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireUser } from '@/lib/auth/require-user'

// Own reviews incl. pending/rejected (service role; filtered by user_id)
export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error
  const db = createServiceClient()
  const { data } = await db.from('reviews')
    .select('id, product_id, rating, comment, images, published, helpful_count, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  return NextResponse.json({ reviews: data ?? [] })
}
