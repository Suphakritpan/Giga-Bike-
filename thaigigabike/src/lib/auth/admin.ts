// Server-only. Never import from client components or NEXT_PUBLIC_ paths.
// Safe to import in Edge middleware — uses only process.env, no next/headers.

// Module-level cache: env vars are constant per process, parse once.
let _emailCache: string[] | null = null

export function parseAdminEmails(): string[] {
  if (_emailCache) return _emailCache
  _emailCache = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  return _emailCache
}

// Returns false (fail closed) when ADMIN_EMAILS is empty or unset.
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return parseAdminEmails().includes(email.trim().toLowerCase())
}
