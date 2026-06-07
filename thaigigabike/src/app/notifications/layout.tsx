import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'การแจ้งเตือน',
  description: 'ประกาศและการแจ้งเตือนจาก ThaiGigaBike',
  alternates: { canonical: '/notifications' },
}

export default function SegmentLayout({ children }: { children: React.ReactNode }) {
  return children
}
