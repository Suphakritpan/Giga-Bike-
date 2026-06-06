import { randomUUID } from 'node:crypto'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/require-admin'
import { createServiceClient } from '@/lib/supabase/service'
import { writeAuditLog } from '@/lib/audit'

const MAX_BYTES = 5 * 1024 * 1024  // 5 MB

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
}

// productId must be filesystem-safe: letters, digits, dot, dash, underscore only.
const SAFE_ID = /^[A-Za-z0-9._\-]+$/

export async function POST(req: NextRequest) {
  const { user, error } = await requireAdmin()
  if (error) return error

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 })
  }

  const file = formData.get('file')
  const productId = formData.get('productId')

  if (typeof productId !== 'string' || !SAFE_ID.test(productId) || productId.length > 80) {
    return NextResponse.json({ error: 'Invalid productId' }, { status: 400 })
  }

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 })
  }

  const ext = MIME_TO_EXT[file.type]
  if (!ext) {
    return NextResponse.json(
      { error: 'Only image/jpeg, image/png, image/webp are allowed' },
      { status: 400 }
    )
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 400 })
  }

  // Server-controlled path — client never chooses the filename or directory.
  const path = `products/${productId}/${randomUUID()}.${ext}`

  const supabase = createServiceClient()
  const { error: uploadErr } = await supabase.storage
    .from('product-images')
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false })

  if (uploadErr) {
    console.error(`[admin/upload] storage error for ${user.email}:`, uploadErr.message)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  await writeAuditLog({
    actor_user_id: user.id || null,
    actor_email: user.email,
    action: 'product_image.upload',
    entity_type: 'product_image',
    entity_id: path,
    after_json: { productId, path, mime: file.type, size_bytes: file.size },
  })
  return NextResponse.json({ url: data.publicUrl, path })
}
