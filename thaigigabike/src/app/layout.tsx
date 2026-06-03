import type { Metadata } from 'next'
import '../styles/globals.css'
import { CartProvider } from '@/lib/cart'
import { LangProvider } from '@/lib/lang'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: 'ThaiGigaBike — CNC Racing Parts',
  description: 'อะไหล่แต่ง CNC คุณภาพส่งออก ราคาคนไทย | CNC Custom Motorcycle Parts, Made in Thailand',
  keywords: 'CNC parts, motorcycle parts, Yamaha SR, racing parts, Thailand',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body>
        <LangProvider>
          <CartProvider>
            <Navbar />
            <main style={{ minHeight: '100vh' }}>
              {children}
            </main>
            <Footer />
          </CartProvider>
        </LangProvider>
      </body>
    </html>
  )
}
