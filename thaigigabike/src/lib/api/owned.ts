import { createServiceClient } from '@/lib/supabase/service'

/**
 * Ownership-checked single-row fetch for service-role queries.
 *
 * Service role bypasses RLS, so EVERY per-user lookup must prove ownership.
 * This helper makes that check uniform and hard to forget:
 *
 *   const ticket = await getOwnedRow('support_tickets', params.ticketId, user.id)
 *   if (!ticket) return apiError(ERR.NOT_FOUND, 'ไม่พบข้อมูล')
 *
 * Returns null both when the row is missing AND when it belongs to someone
 * else — callers cannot tell the difference (no existence leak).
 */
export async function getOwnedRow<T = Record<string, unknown>>(
  table: string,
  id: string,
  userId: string,
  opts?: { select?: string; idColumn?: string; ownerColumn?: string },
): Promise<T | null> {
  const db = createServiceClient()
  const { data } = await db
    .from(table)
    .select(opts?.select ?? '*')
    .eq(opts?.idColumn ?? 'id', id)
    .eq(opts?.ownerColumn ?? 'user_id', userId)
    .single()
  return (data as T) ?? null
}
