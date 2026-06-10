import type { Metadata } from 'next'
import { Barlow_Condensed, Barlow } from 'next/font/google'
import '../styles/globals.css'
import { CartProvider } from '@/lib/cart'
import { SITE_URL, SITE_NAME } from '@/lib/site'

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
import { AuthProvider } from '@/lib/auth/AuthContext'
import { WishlistProvider } from '@/lib/wishlist'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { PageLoader } from '@/components/layout/PageLoader'
import { LineFloatButton } from '@/components/layout/LineFloatButton'

const SITE_DESCRIPTION =
  'อะไหล่แต่ง CNC คุณภาพส่งออก ราคาคนไทย | CNC Custom Motorcycle Parts, Made in Thailand'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ThaiGigaBike — CNC Racing Parts อะไหล่แต่งมอเตอร์ไซค์',
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: 'CNC parts, motorcycle parts, Yamaha SR, racing parts, Thailand, อะไหล่แต่ง',
  applicationName: SITE_NAME,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: 'ThaiGigaBike — CNC Racing Parts อะไหล่แต่งมอเตอร์ไซค์',
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: 'th_TH',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ThaiGigaBike — CNC Racing Parts',
    description: SITE_DESCRIPTION,
  },
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
            <AuthProvider>
              <WishlistProvider>
                <CartProvider>
                  <PageLoader />
                  <Navbar />
                  <main style={{ minHeight: '100vh' }}>
                    {children}
                  </main>
                  <Footer />
                  <LineFloatButton />
                </CartProvider>
              </WishlistProvider>
            </AuthProvider>
          </LangProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
