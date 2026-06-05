// Server-only. Never import from client components.
import { createClient } from '@supabase/supabase-js'

export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw new Error(
      '[service] SUPABASE_SERVICE_ROLE_KEY is required for server-side Supabase operations'
    )
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    { auth: { persistSession: false } }
  )
}
