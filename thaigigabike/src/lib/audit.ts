// Server-only audit helper. Never import from client components.
// writeAuditLog awaits the insert but never throws — audit failure never
// breaks the calling operation.
import { createHash } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export type AuditEntry = {
  actor_user_id?: string | null
  actor_email?: string | null
  action: string
  entity_type: string
  entity_id?: string | null
  before_json?: Record<string, unknown> | null
  after_json?: Record<string, unknown> | null
  ip_hash?: string | null
  user_agent?: string | null
}

export function getIpHash(req: NextRequest): string | null {
  const raw =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    null
  if (!raw) return null
  return createHash('sha256').update(raw).digest('hex').slice(0, 16)
}

export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return
    await createServiceClient().from('audit_logs').insert(entry)
  } catch (err) {
    console.error('[audit] write failed:', err instanceof Error ? err.message : err)
  }
}
