import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ErrdayCoin - Crypto Futures Trading Simulator',
    short_name: 'ErrdayCoin',
    description: 'Master crypto futures trading with our free interactive simulator! Practice with real Bitcoin & Ethereum charts, learn leverage trading up to 100x, and compete on leaderboards.',
    start_url: '/',
    display: 'standalone',
    background_color: '#1f2937',
    theme_color: '#f59e0b',
    orientation: 'portrait',
    categories: ['finance', 'education', 'games'],
    lang: 'en',
    icons: [],
    screenshots: [],
    shortcuts: [
      {
        name: 'Play Game',
        short_name: 'Play',
        description: 'Start playing the crypto trading simulator',
        url: '/play'
      },
      {
        name: 'Leaderboard',
        short_name: 'Leaderboard',
        description: 'View trading leaderboard',
        url: '/leaderboard'
      }
    ]
  }
}
