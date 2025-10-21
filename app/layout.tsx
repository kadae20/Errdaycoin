import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientProviders from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: "ErrdayCoin | Crypto Futures Trading Game & Bitcoin Quiz",
  description: "Play a free crypto futures simulator. Long/short up to 100x, with next-day PnL and liquidation like real trading.",
  alternates: {
    canonical: "https://www.errdaycoin.com/",
    languages: {
      "en": "https://www.errdaycoin.com/",
      // 한국어 페이지(/kr) 오픈 시 아래 주석 해제
      // "ko": "https://www.errdaycoin.com/kr",
      "x-default": "https://www.errdaycoin.com/"
    }
  },
  openGraph: {
    title: "ErrdayCoin – Crypto Futures Trading Simulator",
    description: "Go long/short with up to 100x and see PnL & liq price.",
    url: "https://www.errdaycoin.com/",
    siteName: "ErrdayCoin",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "ErrdayCoin – Crypto Futures Trading Simulator",
    description: "Practice long/short up to 100x with next-day PnL."
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Analytics - Only load if measurement ID is available */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}', {
                    page_title: document.title,
                    page_location: window.location.href,
                  });
                `,
              }}
            />
          </>
        )}
        
        {/* Additional SEO Meta Tags */}
        <meta name="theme-color" content="#f59e0b" />
        <meta name="msapplication-TileColor" content="#f59e0b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="ErrdayCoin" />
        <meta name="application-name" content="ErrdayCoin" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.google-analytics.com" />
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        
        {/* DNS Prefetch */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
      </head>
      <body className={inter.className}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
