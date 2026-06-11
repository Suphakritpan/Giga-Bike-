import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { sniffFile, IMAGE_KINDS, KIND_MIME, isRateLimited, recordAttempt, hashIp, apiLog } from '@/lib/api'

const MAX_SIZE     = 5 * 1024 * 1024 // 5 MB
const MAX_PER_HOUR = 15

export async function POST(req: NextRequest) {
  // Anti-abuse: public bucket — rate limit per IP
  const ipHash = hashIp(req)
  if (await isRateLimited({ kind: 'review_image', ipHash, max: MAX_PER_HOUR, windowMs: 3_600_000 })) {
    return NextResponse.json({ error: 'อัปโหลดบ่อยเกินไป กรุณาลองใหม่ภายหลัง' }, { status: 429 })
  }
  await recordAttempt({ kind: 'review_image', email: '', ipHash, success: true })

  let form: FormData
  try { form = await req.formData() } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = form.get('image') as File | null
  if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 })
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Max 5 MB per image' }, { status: 400 })
  }

  // Magic-bytes check — browser MIME is attacker-controlled; a public
  // bucket must never store anything that is not a real image.
  const sniffed = await sniffFile(file)
  if (!sniffed || !IMAGE_KINDS.includes(sniffed.kind)) {
    return NextResponse.json({ error: 'JPG, PNG or WebP only' }, { status: 400 })
  }

  // Server-generated random name — client never controls the path.
  const path = `review-images/${randomUUID()}.${sniffed.kind}`

  const db = createServiceClient()
  const { error } = await db.storage
    .from('review-images')
    .upload(path, sniffed.buffer, { contentType: KIND_MIME[sniffed.kind], upsert: false })

  if (error) {
    apiLog.error('POST /api/reviews/upload-image', error.message)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const { data: { publicUrl } } = db.storage.from('review-images').getPublicUrl(path)
  return NextResponse.json({ url: publicUrl })
}
