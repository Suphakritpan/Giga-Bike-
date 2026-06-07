import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(req: NextRequest) {
  let form: FormData
  try { form = await req.formData() } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = form.get('image') as File | null
  if (!file) return NextResponse.json({ error: 'No image provided' }, { status: 400 })
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'JPG, PNG or WebP only' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'Max 5 MB per image' }, { status: 400 })
  }

  const ext  = file.type.split('/')[1].replace('jpeg', 'jpg')
  const path = `review-images/${randomUUID()}.${ext}`

  const db = createServiceClient()
  const { error } = await db.storage
    .from('review-images')
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false })

  if (error) {
    console.error('[review-upload]', error.message)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const { data: { publicUrl } } = db.storage.from('review-images').getPublicUrl(path)
  return NextResponse.json({ url: publicUrl })
}
