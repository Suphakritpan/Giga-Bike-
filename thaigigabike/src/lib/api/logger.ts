/**
 * Structured API logging — one JSON line per event so Netlify/Vercel log
 * search can filter by route or level.
 *
 * NEVER pass secrets (passwords, tokens, service keys, full emails in
 * production paths) into `context`.
 */
type Level = 'info' | 'warn' | 'error'

function emit(level: Level, route: string, message: string, context?: Record<string, unknown>) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    route,
    message,
    ...context,
  })
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.log(line)
}

export const apiLog = {
  info:  (route: string, message: string, context?: Record<string, unknown>) => emit('info',  route, message, context),
  warn:  (route: string, message: string, context?: Record<string, unknown>) => emit('warn',  route, message, context),
  error: (route: string, err: unknown, context?: Record<string, unknown>) => {
    const message = err instanceof Error ? err.message : String(err)
    emit('error', route, message, context)
  },
}
