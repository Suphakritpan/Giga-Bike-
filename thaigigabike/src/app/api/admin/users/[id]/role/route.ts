import { NextRequest, NextResponse } from 'next/server'
import { requireOwner } from '@/lib/auth'
import { createServiceClient } from '@/lib/supabase/service'
import { logAdminAction } from '@/lib/admin-audit'

type Ctx = { params: { id: string } }

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const { user: owner, error } = await requireOwner()
  if (error) return error

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* invalid JSON */ }
  const { role, admin_active } = body

  if (role !== undefined && !['customer', 'admin', 'owner'].includes(role as string)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  // An owner cannot demote or deactivate themselves — prevents locking
  // the shop out of the admin panel entirely.
  if (params.id === owner.id && (role !== undefined && role !== 'owner' || admin_active === false)) {
    return NextResponse.json({ error: 'Cannot demote your own owner account' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  if (role         !== undefined) update.role         = role
  if (admin_active !== undefined) update.admin_active = Boolean(admin_active)
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  const db = createServiceClient()
  const { data: before } = await db.from('users')
    .select('id, email, role, admin_active').eq('id', params.id).single()
  if (!before) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data, error: dbErr } = await db
    .from('users')
    .update(update)
    .eq('id', params.id)
    .select('id, email, role, admin_active')
    .single()

  if (dbErr || !data) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  await logAdminAction({
    userId:     owner.id,
    action:     'user.role_changed',
    targetType: 'user',
    targetId:   params.id,
    beforeData: { role: before.role, admin_active: before.admin_active },
    afterData:  { role: data.role, admin_active: data.admin_active },
  })

  return NextResponse.json({ user: data })
}
