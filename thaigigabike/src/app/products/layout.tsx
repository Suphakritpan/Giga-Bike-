import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'สินค้าทั้งหมด',
  description: 'อะไหล่แต่ง CNC มอเตอร์ไซค์ทุกหมวด ค้นหาตามรุ่นรถและหมวดหมู่',
  alternates: { canonical: '/products' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
