import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'ศูนย์ช่วยเหลือ',
  description: 'คำถามที่พบบ่อย การจัดส่ง การคืนสินค้า และการรับประกัน',
  alternates: { canonical: '/support' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
