import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createServiceClient } from '@/lib/supabase/service'
import { writeAuditLog } from '@/lib/audit'

// Only allow deletion of paths under this prefix.
const ALLOWED_PREFIX = 'products/'

function resolveStoragePath(body: Record<string, unknown>): string | null {
  if (typeof body.path === 'string') {
    return body.path
  }
  if (typeof body.url === 'string') {
    try {
      const parsed = new URL(body.url)
      const match = parsed.pathname.match(
        /\/storage\/v1\/object\/public\/product-images\/(.+)$/
      )
      return match ? decodeURIComponent(match[1]) : null
    } catch {
      return null
    }
  }
  return null
}

export async function DELETE(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error) return error

  let body: Record<string, unknown> | null = null
  try { body = await req.json() } catch { /* invalid JSON */ }

  const storagePath = body ? resolveStoragePath(body) : null

  if (!storagePath) {
    return NextResponse.json(
      { error: 'Provide path or a product-images storage url' },
      { status: 400 }
    )
  }

  // Reject path traversal and null bytes.
  if (storagePath.includes('..') || storagePath.includes('\0')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  // Restrict to expected prefix.
  if (!storagePath.startsWith(ALLOWED_PREFIX)) {
    return NextResponse.json({ error: 'Path outside allowed prefix' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { error: rmErr } = await supabase.storage
    .from('product-images')
    .remove([storagePath])

  if (rmErr) {
    console.error(`[admin/delete-image] storage error for ${user.email}:`, rmErr.message)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }

  await writeAuditLog({
    actor_user_id: user.id || null,
    actor_email: user.email,
    action: 'product_image.delete',
    entity_type: 'product_image',
    entity_id: storagePath,
    after_json: { path: storagePath },
  })
  return NextResponse.json({ ok: true })
}
