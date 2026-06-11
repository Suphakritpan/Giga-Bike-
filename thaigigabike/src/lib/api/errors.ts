import { NextResponse } from 'next/server'

/**
 * Standard API error codes — every error response carries one of these in
 * the `code` field so clients can branch on machine-readable values instead
 * of parsing localized messages.
 *
 * Response envelope (see docs/API.md):
 *   success: 2xx + route-specific payload
 *   failure: { error: "<human message (TH)>", code: "<ERROR_CODE>" }
 */
export const ERR = {
  BAD_REQUEST:   'BAD_REQUEST',    // 400 — malformed/missing input
  UNAUTHORIZED:  'UNAUTHORIZED',   // 401 — no/invalid session
  FORBIDDEN:     'FORBIDDEN',      // 403 — authenticated but not allowed
  NOT_FOUND:     'NOT_FOUND',      // 404 — resource missing or not owned
  CONFLICT:      'CONFLICT',       // 409 — duplicate (email taken ฯลฯ)
  RATE_LIMITED:  'RATE_LIMITED',   // 429 — too many requests
  INTERNAL:      'INTERNAL_ERROR', // 500 — unexpected server error
} as const

export type ErrorCode = (typeof ERR)[keyof typeof ERR]

const STATUS: Record<ErrorCode, number> = {
  BAD_REQUEST:    400,
  UNAUTHORIZED:   401,
  FORBIDDEN:      403,
  NOT_FOUND:      404,
  CONFLICT:       409,
  RATE_LIMITED:   429,
  INTERNAL_ERROR: 500,
}

/** Failure response: { error, code } with the matching HTTP status. */
export function apiError(code: ErrorCode, message: string): NextResponse {
  return NextResponse.json({ error: message, code }, { status: STATUS[code] })
}

/** Success response — thin wrapper kept for symmetry with apiError. */
export function apiOk<T extends Record<string, unknown>>(
  data: T,
  init?: { status?: number; headers?: Record<string, string> },
): NextResponse {
  return NextResponse.json(data, init)
}
