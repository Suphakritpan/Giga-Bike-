import { createServiceClient } from '@/lib/supabase/service'

type Params = {
  userId: string | null
  action: string
  targetType?: string
  targetId?: string
  beforeData?: Record<string, unknown> | null
  afterData?: Record<string, unknown> | null
}

export async function logAdminAction(p: Params): Promise<void> {
  try {
    await createServiceClient().from('admin_audit_logs').insert({
      user_id:     p.userId,
      action:      p.action,
      target_type: p.targetType ?? null,
      target_id:   p.targetId ?? null,
      before_data: p.beforeData ?? null,
      after_data:  p.afterData ?? null,
    })
  } catch { /* best-effort — never let audit failure break the request */ }
}
