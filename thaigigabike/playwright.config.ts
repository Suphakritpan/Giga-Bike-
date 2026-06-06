import { defineConfig, devices } from '@playwright/test'

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
