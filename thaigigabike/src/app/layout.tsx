import type { Metadata } from 'next'
import '../styles/globals.css'
import { CartProvider } from '@/lib/cart'
import { LangProvider } from '@/lib/lang'
import { ThemeProvider } from '@/lib/theme'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PageLoader } from '@/components/PageLoader'

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
    <html lang="th" suppressHydrationWarning>
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
            </CartProvider>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
