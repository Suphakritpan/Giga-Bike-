import type { NextRequest } from 'next/server'

/** Parse the JSON body; malformed/empty bodies become {} instead of throwing. */
export async function readJson(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    const body = await req.json()
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  } catch {
    return {}
  }
}
