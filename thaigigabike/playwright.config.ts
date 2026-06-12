import { defineConfig, devices } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'

// Load .env.local into the TEST process — Next.js loads it for the dev
// server, but Playwright specs run in a separate process, so configuration
// guards (e.g. NEXT_PUBLIC_SUPABASE_URL checks) would always skip without
// this. Existing env vars are never overwritten; values are never logged.
const envFile = path.join(__dirname, '.env.local')
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '')
    }
  }
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'th-TH',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    // In CI (fresh environment, full control over server lifecycle):
    //   use url: 'http://localhost:3000/api/health' for precise 2xx readiness check.
    // In local dev (a potentially broken dev server may already be on port 3000):
    //   use port: 3000 — TCP check detects any listener and reuses it regardless of
    //   HTTP response, avoiding the spawn-a-new-server→port-conflict→timeout cycle.
    command: 'npx next dev',
    port: 3000,
    reuseExistingServer: true,
    timeout: 120000,
  },
})
