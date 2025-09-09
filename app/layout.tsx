import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ClientProviders from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Crypto Futures Trading Simulator – Play Chart Quiz & Practice Leverage Trading | Errdaycoin',
  description: 'Join the ultimate crypto quiz game. Guess Bitcoin & Ethereum charts, simulate futures trading with leverage, and climb the leaderboard. Free crypto demo trading game.',
  keywords: 'crypto futures trading simulator, bitcoin futures chart quiz, play crypto trading game online, crypto chart guessing game, crypto leverage trading quiz, crypto demo trading game free, bitcoin trading simulator, ethereum futures practice, crypto chart analysis game, leverage trading practice',
  authors: [{ name: 'Errdaycoin' }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Errdaycoin - Crypto Futures Trading Simulator',
    description: 'Master crypto futures trading with our interactive chart quiz game. Practice with real Bitcoin & altcoin data.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Errdaycoin',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Errdaycoin - Crypto Futures Trading Simulator',
    description: 'Master crypto futures trading with our interactive chart quiz game. Practice with real Bitcoin & altcoin data.',
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
