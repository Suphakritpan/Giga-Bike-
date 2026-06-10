import { NextRequest, NextResponse } from 'next/server'
import { requireOwner } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/service'

type Ctx = { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { error } = await requireOwner()
  if (error) return error

  const body = await req.json()
  const { role, admin_active } = body

  if (role !== undefined && !['customer', 'admin', 'owner'].includes(role as string)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if (role         !== undefined) update.role         = role
  if (admin_active !== undefined) update.admin_active = Boolean(admin_active)

  const db = createServiceClient()
  const { data, error: dbErr } = await db
    .from('users')
    .update(update)
    .eq('id', params.id)
    .select('id, email, role, admin_active')
    .single()

  if (dbErr || !data) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({ user: data })
}
