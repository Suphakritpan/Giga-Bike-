import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createServiceClient } from '@/lib/supabase/service'

export async function GET() {
  const { error } = await requireAdmin()
  if (error) return error

  const supabase = createServiceClient()
  const { data, error: dbErr } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (dbErr) return NextResponse.json({ error: 'Failed to load orders' }, { status: 500 })
  return NextResponse.json({ orders: data })
}
