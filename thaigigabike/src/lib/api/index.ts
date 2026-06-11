// Central API toolkit — import from '@/lib/api' in route handlers.
//
//   apiOk / apiError + ERR ........ standard response envelope + error codes
//   apiLog ........................ structured JSON logging
//   isRateLimited / recordAttempt . DB-backed rate limiting
//   hashIp ........................ privacy-safe client IP hash
//   readJson ...................... safe body parsing
//
// Conventions and the full endpoint reference live in docs/API.md.
export { apiOk, apiError, ERR, type ErrorCode } from './errors'
export { apiLog } from './logger'
export { isRateLimited, recordAttempt, hashIp } from './rate-limit'
export { readJson } from './json'
