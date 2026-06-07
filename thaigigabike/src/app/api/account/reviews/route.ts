import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/require-user'

// Own reviews incl. pending/rejected (RLS: authenticated read own user_id)
export async function GET() {
  const { user, error } = await requireUser()
  if (error) return error
  const db = createClient()
  const { data } = await db.from('reviews')
    .select('id, product_id, rating, comment, images, published, helpful_count, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
  return NextResponse.json({ reviews: data ?? [] })
}
