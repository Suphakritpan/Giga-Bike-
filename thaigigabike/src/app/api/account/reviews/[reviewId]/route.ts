import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireUser } from '@/lib/auth/require-user'
import { getOwnedRow } from '@/lib/api'

// Edit own review — resets to unpublished for re-approval.
export async function PATCH(req: NextRequest, { params }: { params: { reviewId: string } }) {
  const { user, error } = await requireUser()
  if (error) return error

  let body: Record<string, unknown> = {}
  try { body = await req.json() } catch { /* ignore */ }

  const patch: Record<string, unknown> = { published: false }
  if (typeof body.rating === 'number' && body.rating >= 1 && body.rating <= 5) patch.rating = body.rating
  if (typeof body.comment === 'string') patch.comment = body.comment.trim().slice(0, 2000)

  const owned = await getOwnedRow('reviews', params.reviewId, user.id, { select: 'id' })
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const svc = createServiceClient()
  const { error: dbErr } = await svc.from('reviews').update(patch).eq('id', params.reviewId)
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: { params: { reviewId: string } }) {
  const { user, error } = await requireUser()
  if (error) return error

  const owned = await getOwnedRow('reviews', params.reviewId, user.id, { select: 'id' })
  if (!owned) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const svc = createServiceClient()
  const { error: dbErr } = await svc.from('reviews').delete().eq('id', params.reviewId)
  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
