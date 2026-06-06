import type { Metadata } from 'next'
import { Barlow_Condensed, Barlow } from 'next/font/google'
import '../styles/globals.css'
import { CartProvider } from '@/lib/cart'

const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
})

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
})
import { LangProvider } from '@/lib/lang'
import { ThemeProvider } from '@/lib/theme'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PageLoader } from '@/components/PageLoader'
import { LineFloatButton } from '@/components/layout/LineFloatButton'

export const metadata: Metadata = {
  title: 'ThaiGigaBike — CNC Racing Parts',
  description: 'อะไหล่แต่ง CNC คุณภาพส่งออก ราคาคนไทย | CNC Custom Motorcycle Parts, Made in Thailand',
  keywords: 'CNC parts, motorcycle parts, Yamaha SR, racing parts, Thailand',
}

// Runs before React hydrates — prevents theme flash
const themeScript = `(function(){
  try {
    var t = localStorage.getItem('gigabike-theme');
    if (!t) t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', t);
  } catch(e) {}
})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" suppressHydrationWarning className={`${barlowCondensed.variable} ${barlow.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>
          <LangProvider>
            <CartProvider>
              <PageLoader />
              <Navbar />
              <main style={{ minHeight: '100vh' }}>
                {children}
              </main>
              <Footer />
              <LineFloatButton />
            </CartProvider>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
