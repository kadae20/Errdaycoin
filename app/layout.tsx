import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientProviders from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'ErrdayCoin - Free Crypto Futures Trading Simulator Game',
    template: '%s | ErrdayCoin - Crypto Trading Simulator'
  },
  description: 'Master crypto futures trading with our free interactive simulator! Practice with real Bitcoin & Ethereum charts, learn leverage trading up to 100x, and compete on leaderboards. No risk, real rewards - start trading today!',
  keywords: [
    'crypto futures trading simulator',
    'bitcoin trading game',
    'ethereum futures practice',
    'crypto chart analysis game',
    'leverage trading simulator',
    'crypto demo trading',
    'bitcoin chart quiz',
    'crypto trading practice',
    'futures trading game',
    'crypto trading simulator free',
    'bitcoin leverage trading',
    'crypto trading education',
    'trading simulator online',
    'crypto quiz game',
    'trading practice platform'
  ],
  authors: [{ name: 'ErrdayCoin Team' }],
  creator: 'ErrdayCoin',
  publisher: 'ErrdayCoin',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://errdaycoin.com'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en',
      'ko-KR': '/ko',
      'ja-JP': '/ja',
      'zh-CN': '/zh',
      'es-ES': '/es',
      'fr-FR': '/fr',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'ErrdayCoin',
    title: 'ErrdayCoin - Free Crypto Futures Trading Simulator',
    description: 'Master crypto futures trading with our free interactive simulator! Practice with real Bitcoin & Ethereum charts, learn leverage trading up to 100x, and compete on leaderboards.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ErrdayCoin - Crypto Futures Trading Simulator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@errdaycoin',
    creator: '@errdaycoin',
    title: 'ErrdayCoin - Free Crypto Futures Trading Simulator',
    description: 'Master crypto futures trading with our free interactive simulator! Practice with real Bitcoin & Ethereum charts, learn leverage trading up to 100x.',
    images: ['/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
    other: {
      'naver-site-verification': 'naver44c756841488cf6c7a14fe54c4eb56b8',
    },
  },
  category: 'Finance',
  classification: 'Educational Game',
  referrer: 'origin-when-cross-origin',
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
