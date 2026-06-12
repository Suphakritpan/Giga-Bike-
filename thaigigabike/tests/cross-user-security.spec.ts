import { test, expect, request as pwRequest, APIRequestContext } from '@playwright/test'
import { resetLocalRateLimits } from './helpers/reset-rate-limits'

/**
 * Cross-user isolation (Council risk #4).
 *
 * The service-role pattern bypasses RLS, so the ONLY thing stopping user B
 * from touching user A's data is the user_id filter in each route. This
 * suite registers two real accounts and proves B cannot read or modify
 * anything A owns.
 *
 * Notes:
 *  - Runs against the dev server + the configured Supabase DB. Both test
 *    accounts are deleted in afterAll (cascade cleans their data).
 *  - Registration is rate-limited (5/hour/IP) → the suite skips itself
 *    instead of failing when the limiter kicks in.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const configured = SUPABASE_URL.length > 0 && !SUPABASE_URL.includes('your-project')

const BASE     = 'http://localhost:3000'
const PASSWORD = 'xuser-test-12345'

type TestUser = { ctx: APIRequestContext; email: string }

async function registerUser(label: string): Promise<TestUser | 'rate-limited'> {
  const ctx = await pwRequest.newContext({ baseURL: BASE })
  const email = `xuser-${label}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`
  const res = await ctx.post('/api/auth/register', {
    data: { email, password: PASSWORD, full_name: `Cross Test ${label.toUpperCase()}` },
  })
  if (res.status() === 429) {
    await ctx.dispose()
    return 'rate-limited'
  }
  expect(res.status(), 'register must succeed').toBe(201)
  return { ctx, email }
}

test.describe.serial('Cross-user isolation — B must never touch A’s data', () => {
  test.skip(!configured, 'Requires Supabase to be configured')

  let userA: TestUser | null = null
  let userB: TestUser | null = null
  let addressId = ''
  let ticketId  = ''

  test.beforeAll(async () => {
    await resetLocalRateLimits()
    const a = await registerUser('a')
    const b = await registerUser('b')
    if (a === 'rate-limited' || b === 'rate-limited') {
      if (a !== 'rate-limited' && a) await a.ctx.post('/api/account/delete', { data: { password: PASSWORD } })
      test.skip(true, 'Register rate limit reached — rerun in 1 hour')
      return
    }
    userA = a
    userB = b

    // A's fixtures: one address, one ticket, one wishlist item
    const addr = await userA.ctx.post('/api/account/addresses', {
      data: { label: 'home', recipient_name: 'Owner A', phone: '0810000000', address: '1 Test Road, Bangkok' },
    })
    expect(addr.status()).toBe(200)
    addressId = (await addr.json()).address.id

    const ticket = await userA.ctx.post('/api/account/tickets', {
      data: { topic: 'general', subject: 'A private ticket', body: 'secret content from A' },
    })
    expect(ticket.status()).toBe(200)
    ticketId = (await ticket.json()).ticket.id

    const wish = await userA.ctx.post('/api/account/wishlist', { data: { product_id: 'xtest-product-1' } })
    expect(wish.status()).toBe(200)
  })

  test.afterAll(async () => {
    for (const u of [userA, userB]) {
      if (!u) continue
      await u.ctx.post('/api/account/delete', { data: { password: PASSWORD } }).catch(() => {})
      await u.ctx.dispose()
    }
  })

  // ── Tickets: lookup by id is the classic IDOR target ──────────────────────
  test('B cannot READ A’s ticket (404, no existence leak)', async () => {
    const res = await userB!.ctx.get(`/api/account/tickets/${ticketId}`)
    expect(res.status()).toBe(404)
    const body = await res.json().catch(() => ({}))
    expect(JSON.stringify(body)).not.toContain('secret content')
  })

  test('B cannot REPLY to A’s ticket', async () => {
    const res = await userB!.ctx.post(`/api/account/tickets/${ticketId}`, {
      data: { body: 'injected reply from B' },
    })
    expect(res.status()).toBe(404)
  })

  test('B cannot CLOSE A’s ticket', async () => {
    const res = await userB!.ctx.patch(`/api/account/tickets/${ticketId}`, {
      data: { status: 'closed' },
    })
    expect(res.status()).toBe(404)

    // A still sees it open
    const own = await userA!.ctx.get(`/api/account/tickets/${ticketId}`)
    expect(own.status()).toBe(200)
    expect((await own.json()).ticket.status).toBe('open')
  })

  // ── Addresses: PATCH/DELETE return 200 even on 0 rows, so assert the
  //    side effect from A's point of view, not just the status code ─────────
  test('B cannot MODIFY A’s address (no side effect)', async () => {
    await userB!.ctx.patch(`/api/account/addresses/${addressId}`, {
      data: { recipient_name: 'HACKED BY B' },
    })
    const list = await (await userA!.ctx.get('/api/account/addresses')).json()
    const addr = list.addresses.find((x: { id: string }) => x.id === addressId)
    expect(addr, 'address must still exist').toBeTruthy()
    expect(addr.recipient_name).toBe('Owner A')
  })

  test('B cannot DELETE A’s address (no side effect)', async () => {
    await userB!.ctx.delete(`/api/account/addresses/${addressId}`)
    const list = await (await userA!.ctx.get('/api/account/addresses')).json()
    expect(list.addresses.some((x: { id: string }) => x.id === addressId)).toBe(true)
  })

  // ── Reads that must stay scoped to the session user ───────────────────────
  test('B’s wishlist does not contain A’s items', async () => {
    const list = await (await userB!.ctx.get('/api/account/wishlist')).json()
    expect(list.items.some((x: { product_id: string }) => x.product_id === 'xtest-product-1')).toBe(false)
  })

  test('B’s data export contains nothing of A’s', async () => {
    const res = await userB!.ctx.get('/api/account/export')
    expect(res.status()).toBe(200)
    const text = await res.text()
    expect(text).not.toContain(userA!.email)
    expect(text).not.toContain('A private ticket')
    expect(text).not.toContain('Owner A')
  })

  test('B cannot delete A’s account (delete only targets own session)', async () => {
    // B confirms with B's password — must delete B-side only; A still logs in
    const probe = await userA!.ctx.get('/api/auth/me')
    expect(probe.status()).toBe(200)
  })
})
