import type { Metadata } from 'next'
import { getProductById } from '@/data/products'

// Per-product SEO without touching the existing client page component.
// A segment layout receives `params`, so generateMetadata works here.
export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const product = getProductById(params.id)

  // Unpublished / missing → the page itself returns notFound(); keep it out of search.
  if (!product || !product.published) {
    return { title: 'ไม่พบสินค้า', robots: { index: false, follow: false } }
  }

  const title = (product.nameTh || product.name || 'สินค้า').slice(0, 70)
  const rawDesc = product.descriptionTh || product.description || ''
  const description = (rawDesc || `${title} — อะไหล่แต่ง CNC จาก ThaiGigaBike`).slice(0, 160)
  const image = product.images?.[0]
  const canonical = `/products/${product.id}`

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: 'website',
      title,
      description,
      url: canonical,
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}

export default function ProductDetailLayout({ children }: { children: React.ReactNode }) {
  return children
}
