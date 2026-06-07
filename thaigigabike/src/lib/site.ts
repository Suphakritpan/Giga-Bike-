// Canonical public site origin — used by metadataBase, sitemap, robots, and
// per-page Open Graph. Set NEXT_PUBLIC_SITE_URL in production (no trailing slash).
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
).replace(/\/$/, '')

export const SITE_NAME = 'ThaiGigaBike'
