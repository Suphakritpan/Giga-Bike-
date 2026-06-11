import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireUser } from '@/lib/auth'

const MIME_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png':  'png',
  'image/webp': 'webp',
}
const MAX_SIZE = 2 * 1024 * 1024 // 2 MB (matches bucket limit)

// Upload avatar via service role — storage path is always derived from the
// session user id, never from client input.
export async function POST(req: NextRequest) {
  const { user, error } = await requireUser()
  if (error) return error

  const form = await req.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file required' }, { status: 400 })
  }
  const ext = MIME_EXT[file.type]
  if (!ext) {
    return NextResponse.json({ error: 'รองรับเฉพาะไฟล์ JPG, PNG, WebP' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'ไฟล์ใหญ่เกิน 2 MB' }, { status: 400 })
  }

  const svc  = createServiceClient()
  const path = `${user.id}/avatar.${ext}`
  const { error: upErr } = await svc.storage.from('avatars')
    .upload(path, file, { upsert: true, contentType: file.type })
  if (upErr) {
    return NextResponse.json({ error: 'อัปโหลดไม่สำเร็จ กรุณาลองใหม่' }, { status: 500 })
  }

  const { data: { publicUrl } } = svc.storage.from('avatars').getPublicUrl(path)
  const avatar_url = `${publicUrl}?v=${Date.now()}`

  await svc.from('profiles').upsert({ id: user.id, avatar_url }, { onConflict: 'id' })
  return NextResponse.json({ avatar_url })
}
