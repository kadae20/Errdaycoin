import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientProviders from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Errdaycoin - Chart Game | Trading Simulator | Stock Market Game | Day Trading',
  description: 'Master trading with Errdaycoin! Ultimate chart game, stock trading simulator, crypto trading game, forex simulator. Learn day trading, practice trading stocks, virtual trading platform. Free trading quiz web for beginners to pros.',
  keywords: 'chart game, trading game, market timing game, day trading simulator, stock trading game, crypto trading game, futures trading simulator, forex trading simulator, investment game, trading quiz game, chart prediction game, stock market simulator, paper trading web, buy or sell game, trading challenge, virtual trading platform, learn day trading, practice trading stocks',
  authors: [{ name: 'Errdaycoin' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Errdaycoin - Chart Game & Trading Simulator',
    description: 'Master trading with Errdaycoin! Ultimate chart game, stock trading simulator, crypto trading game.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Errdaycoin',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Errdaycoin - Chart Game & Trading Simulator',
    description: 'Master trading with Errdaycoin! Ultimate chart game, stock trading simulator, crypto trading game.',
    creator: '@errdaycoin',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  viewport: 'width=device-width, initial-scale=1',
  alternates: {
    canonical: '/',
    languages: {
      'en': '/en',
      'ko': '/ko',
      'ja': '/ja',
      'zh': '/zh',
      'es': '/es',
      'fr': '/fr',
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  )
}
