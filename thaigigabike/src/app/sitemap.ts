import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'
import { products } from '@/data/products' // published-only export

// Public storefront routes worth indexing. Account/admin/api/checkout/cart
// are intentionally excluded (see robots.ts).
const STATIC_ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
  { path: '/',             changeFrequency: 'daily',   priority: 1.0 },
  { path: '/products',     changeFrequency: 'daily',   priority: 0.9 },
  { path: '/categories',   changeFrequency: 'weekly',  priority: 0.8 },
  { path: '/racing',       changeFrequency: 'weekly',  priority: 0.7 },
  { path: '/reviews',      changeFrequency: 'weekly',  priority: 0.6 },
  { path: '/gallery',      changeFrequency: 'weekly',  priority: 0.5 },
  { path: '/dealer',       changeFrequency: 'monthly', priority: 0.5 },
  { path: '/support',      changeFrequency: 'monthly', priority: 0.5 },
  { path: '/payment',      changeFrequency: 'monthly', priority: 0.4 },
  { path: '/contact',      changeFrequency: 'monthly', priority: 0.4 },
  { path: '/messages',     changeFrequency: 'monthly', priority: 0.3 },
  { path: '/search',       changeFrequency: 'monthly', priority: 0.3 },
  { path: '/order',        changeFrequency: 'monthly', priority: 0.3 },
  { path: '/orders',       changeFrequency: 'monthly', priority: 0.3 },
  { path: '/notifications', changeFrequency: 'monthly', priority: 0.2 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map(r => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))

  // Only published products (the `products` export is already filtered).
  const productEntries: MetadataRoute.Sitemap = products.map(p => ({
    url: `${SITE_URL}/products/${p.id}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...staticEntries, ...productEntries]
}
