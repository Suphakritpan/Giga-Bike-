import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  const db = createServiceClient()
  const { data, error } = await db
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages: data ?? [] })
}
