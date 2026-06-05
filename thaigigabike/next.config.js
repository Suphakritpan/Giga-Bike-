/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { unoptimized: true },
  poweredByHeader: false, // hide X-Powered-By: Next.js (fingerprinting)
  async headers() {
    // Uncontroversial hardening headers — these do NOT break inline styles
    // or the theme <script>. A strict nonce-based CSP is a separate batch.
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' }, // clickjacking
          { key: 'X-Content-Type-Options', value: 'nosniff' }, // MIME sniffing
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ]
  },
}
module.exports = nextConfig
