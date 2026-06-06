# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: orders-api.spec.ts >> POST /api/order-lookup/request-otp — generic responses >> any order ID → same generic 200 response (no order existence revealed)
- Location: tests\orders-api.spec.ts:118:7

# Error details

```
SyntaxError: Unexpected end of JSON input
```

# Test source

```ts
  27  |   })
  28  | 
  29  |   test('invalid email format → 400', async ({ request }) => {
  30  |     const res = await request.post('/api/orders', {
  31  |       multipart: { ...baseValid, email: 'not-an-email' },
  32  |     })
  33  |     expect(res.status()).toBe(400)
  34  |   })
  35  | 
  36  |   test('invalid shipping method → 400', async ({ request }) => {
  37  |     const res = await request.post('/api/orders', {
  38  |       multipart: { ...baseValid, shippingMethod: 'dhl_invalid' },
  39  |     })
  40  |     expect(res.status()).toBe(400)
  41  |   })
  42  | 
  43  |   test('invalid payment method → 400', async ({ request }) => {
  44  |     const res = await request.post('/api/orders', {
  45  |       multipart: { ...baseValid, paymentMethod: 'crypto' },
  46  |     })
  47  |     expect(res.status()).toBe(400)
  48  |   })
  49  | 
  50  |   test('item quantity 0 → 400', async ({ request }) => {
  51  |     const res = await request.post('/api/orders', {
  52  |       multipart: {
  53  |         ...baseValid,
  54  |         items: JSON.stringify([{ productId: 'cb1', quantity: 0, color: 'black' }]),
  55  |       },
  56  |     })
  57  |     expect(res.status()).toBe(400)
  58  |   })
  59  | 
  60  |   test('item quantity 100 (> max 99) → 400', async ({ request }) => {
  61  |     const res = await request.post('/api/orders', {
  62  |       multipart: {
  63  |         ...baseValid,
  64  |         items: JSON.stringify([{ productId: 'cb1', quantity: 100, color: 'black' }]),
  65  |       },
  66  |     })
  67  |     expect(res.status()).toBe(400)
  68  |   })
  69  | 
  70  |   test('empty items array → 400', async ({ request }) => {
  71  |     const res = await request.post('/api/orders', {
  72  |       multipart: { ...baseValid, items: JSON.stringify([]) },
  73  |     })
  74  |     expect(res.status()).toBe(400)
  75  |   })
  76  | 
  77  |   test('transfer without slip → 400', async ({ request }) => {
  78  |     const res = await request.post('/api/orders', {
  79  |       multipart: { ...baseValid, paymentMethod: 'transfer' }
  80  |       // No slip field
  81  |     })
  82  |     expect(res.status()).toBe(400)
  83  |     const body = await res.json().catch(() => ({ error: '' }))
  84  |     expect(body.error).toMatch(/slip/)
  85  |   })
  86  | 
  87  |   test('response never exposes price or stock data in error', async ({ request }) => {
  88  |     const res = await request.post('/api/orders', {
  89  |       multipart: { ...baseValid, email: 'bad-email' },
  90  |     })
  91  |     const body = await res.json().catch(() => ({}))
  92  |     expect(JSON.stringify(body)).not.toMatch(/stock_count|in_stock|service_role|SUPABASE/)
  93  |   })
  94  | 
  95  |   test('order response shape — orderId field on success path (idempotency key)', async ({ request }) => {
  96  |     // Send the same idempotency key twice — second call must return the same orderId.
  97  |     // With no real DB in dev this will return 500 (service key missing), but
  98  |     // the important assertion is that the API contract doesn't change shape.
  99  |     const key = `test-idem-${Date.now()}`
  100 |     const res1 = await request.post('/api/orders', {
  101 |       multipart: { ...baseValid, idempotencyKey: key },
  102 |     })
  103 |     const res2 = await request.post('/api/orders', {
  104 |       multipart: { ...baseValid, idempotencyKey: key },
  105 |     })
  106 |     // Both should return the same status code (not one 200 + one 400)
  107 |     expect(res1.status()).toBe(res2.status())
  108 |     // If both 200: same orderId
  109 |     if (res1.status() === 200 && res2.status() === 200) {
  110 |       const b1 = await res1.json()
  111 |       const b2 = await res2.json()
  112 |       expect(b1.orderId).toBe(b2.orderId)
  113 |     }
  114 |   })
  115 | })
  116 | 
  117 | test.describe('POST /api/order-lookup/request-otp — generic responses', () => {
  118 |   test('any order ID → same generic 200 response (no order existence revealed)', async ({ request }) => {
  119 |     const res = await request.post('/api/order-lookup/request-otp', {
  120 |       data: { orderId: 'GGB-DOESNOTEXIST999' },
  121 |     })
  122 |     // The route always returns 200 with a generic message regardless of whether the order
  123 |     // exists — this is intentional to prevent order enumeration.
  124 |     // OR 500 in dev without service key — either is acceptable.
  125 |     expect([200, 500]).toContain(res.status())
  126 |     if (res.status() === 200) {
> 127 |       const body = await res.json()
      |                    ^ SyntaxError: Unexpected end of JSON input
  128 |       // Must NOT definitively confirm or deny order existence
  129 |       // ("If this order exists" is the correct generic phrasing — does NOT reveal existence)
  130 |       expect(JSON.stringify(body)).not.toMatch(/order not found|ออเดอร์นี้ไม่มี|invalid order/)
  131 |     }
  132 |   })
  133 | 
  134 |   test('missing orderId → generic 200 (route never reveals field structure)', async ({ request }) => {
  135 |     // The route returns 200 with generic message even with missing/empty orderId.
  136 |     // Returning 400 would reveal that orderId is an expected field — information disclosure.
  137 |     const res = await request.post('/api/order-lookup/request-otp', {
  138 |       data: {},
  139 |     })
  140 |     // 200 (correct: always generic) or 500 (dev: service key missing)
  141 |     expect([200, 500]).toContain(res.status())
  142 |   })
  143 | 
  144 |   test('response body never exposes OTP or contact email', async ({ request }) => {
  145 |     const res = await request.post('/api/order-lookup/request-otp', {
  146 |       data: { orderId: 'GGB-TEST123456' },
  147 |     })
  148 |     const text = await res.text()
  149 |     // Must never expose the OTP digits or contact email in the response body
  150 |     expect(text).not.toMatch(/\b\d{6}\b/)          // 6-digit OTP
  151 |     expect(text).not.toMatch(/@[a-z]+\.[a-z]+/)    // email address
  152 |   })
  153 | })
  154 | 
  155 | test.describe('POST /api/order-lookup/verify — OTP verification', () => {
  156 |   test('wrong OTP → 400 or 404 (not 200 with order data)', async ({ request }) => {
  157 |     const res = await request.post('/api/order-lookup/verify', {
  158 |       data: { orderId: 'GGB-FAKE123', otp: '000000' },
  159 |     })
  160 |     // Must not return 200 with order data on wrong OTP
  161 |     if (res.status() === 200) {
  162 |       // If somehow 200, body must not contain PII
  163 |       const body = await res.json().catch(() => ({}))
  164 |       expect(body).not.toHaveProperty('recipient_name')
  165 |       expect(body).not.toHaveProperty('contact_email')
  166 |       expect(body).not.toHaveProperty('recipient_phone')
  167 |     } else {
  168 |       expect([400, 401, 404, 500]).toContain(res.status())
  169 |     }
  170 |   })
  171 | 
  172 |   test('missing fields → 400', async ({ request }) => {
  173 |     const res = await request.post('/api/order-lookup/verify', {
  174 |       data: { orderId: 'GGB-TEST' },  // missing otp
  175 |     })
  176 |     expect([400, 500]).toContain(res.status())
  177 |   })
  178 | 
  179 |   test('order lookup response never exposes contact_email or phone', async ({ request }) => {
  180 |     const res = await request.post('/api/order-lookup/verify', {
  181 |       data: { orderId: 'GGB-ANYFAKE', otp: '123456' },
  182 |     })
  183 |     const text = await res.text()
  184 |     // PII fields that must never appear in responses
  185 |     expect(text).not.toContain('contact_email')
  186 |     expect(text).not.toContain('recipient_phone')
  187 |   })
  188 | })
  189 | 
  190 | test.describe('GET /api/orders/[orderId] — deprecated endpoint', () => {
  191 |   test('returns 410 Gone with redirect hint', async ({ request }) => {
  192 |     const res = await request.get('/api/orders/GGB-ANYTHING')
  193 |     expect(res.status()).toBe(410)
  194 |     const body = await res.json()
  195 |     // Must point to OTP flow — not silently expose data
  196 |     expect(JSON.stringify(body)).toMatch(/order-lookup|verify/)
  197 |   })
  198 | })
  199 | 
```