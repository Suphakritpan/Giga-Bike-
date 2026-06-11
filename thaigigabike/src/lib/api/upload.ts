/**
 * File-upload validation — checks magic bytes, not just the browser-supplied
 * MIME type (which is attacker-controlled). A "image/png" upload that is
 * actually an HTML/SVG/script file is rejected here.
 */
export type SniffedType = 'jpg' | 'png' | 'webp' | 'pdf'

export async function sniffFile(file: File): Promise<{ kind: SniffedType; buffer: ArrayBuffer } | null> {
  const buffer = await file.arrayBuffer()
  const b = new Uint8Array(buffer.slice(0, 16))
  if (b.length < 12) return null

  // JPEG: FF D8 FF
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { kind: 'jpg', buffer }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { kind: 'png', buffer }
  // WebP: "RIFF" .... "WEBP"
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
      b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return { kind: 'webp', buffer }
  // PDF: "%PDF"
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return { kind: 'pdf', buffer }

  return null
}

export const IMAGE_KINDS: SniffedType[] = ['jpg', 'png', 'webp']

export const KIND_MIME: Record<SniffedType, string> = {
  jpg:  'image/jpeg',
  png:  'image/png',
  webp: 'image/webp',
  pdf:  'application/pdf',
}
