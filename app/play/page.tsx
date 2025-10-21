import { Metadata } from 'next'
import PlayPageClient from './PlayPageClient'

export const metadata: Metadata = {
  title: 'Play Crypto Trading Game - Free Bitcoin Futures Simulator',
  description: 'Play our free crypto trading simulator! Practice Bitcoin and Ethereum futures trading with real charts, leverage up to 100x, and compete on leaderboards. Start trading now!',
  keywords: [
    'crypto trading game',
    'bitcoin trading simulator',
    'ethereum futures game',
    'crypto chart quiz',
    'leverage trading practice',
    'crypto trading simulator free',
    'bitcoin futures game',
    'crypto demo trading',
    'trading practice game',
    'crypto quiz online'
  ],
  openGraph: {
    title: 'Play Crypto Trading Game - Free Bitcoin Futures Simulator',
    description: 'Play our free crypto trading simulator! Practice Bitcoin and Ethereum futures trading with real charts, leverage up to 100x, and compete on leaderboards.',
    type: 'website',
    url: '/play',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Play Crypto Trading Game - Free Bitcoin Futures Simulator',
    description: 'Play our free crypto trading simulator! Practice Bitcoin and Ethereum futures trading with real charts, leverage up to 100x.',
  },
  alternates: {
    canonical: '/play',
  },
}

import { Suspense } from 'react'

export default function PlayPage() {
  return (
    <Suspense fallback={null}>
      <PlayPageClient />
    </Suspense>
  )
}