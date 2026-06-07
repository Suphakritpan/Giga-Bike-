// Shared by client (login page) and server (auth callback).
// Prevents open-redirect: only same-origin, absolute *path* values are allowed.
// Anything that could escape the origin falls back to a safe default.

const DEFAULT_NEXT = '/account'

/**
 * Returns `next` only if it is a safe internal path, else the fallback.
 * Rejects: external URLs (https://evil.com), protocol-relative (//evil.com),
 * backslash tricks (/\evil.com), and control characters.
 */
export function sanitizeNextPath(
  next: string | null | undefined,
  fallback: string = DEFAULT_NEXT,
): string {
  if (!next || typeof next !== 'string') return fallback
  // Must be an absolute path on our own origin.
  if (!next.startsWith('/')) return fallback
  // Reject protocol-relative ("//host") and backslash-prefixed ("/\host").
  if (next.startsWith('//') || next.startsWith('/\\')) return fallback
  // Reject control chars and whitespace (0x00-0x20 and 0x7F) that enable parser tricks.
  if (/[\x00-\x20\x7f]/.test(next)) return fallback
  return next
}
