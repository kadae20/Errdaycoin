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
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      }
    ],
    screenshots: [
      {
        src: '/screenshot-1.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Crypto Trading Game Interface'
      },
      {
        src: '/screenshot-2.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Mobile Trading Game'
      }
    ],
    shortcuts: [
      {
        name: 'Play Game',
        short_name: 'Play',
        description: 'Start playing the crypto trading simulator',
        url: '/play',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }]
      },
      {
        name: 'Leaderboard',
        short_name: 'Leaderboard',
        description: 'View trading leaderboard',
        url: '/leaderboard',
        icons: [{ src: '/icon-192.png', sizes: '192x192' }]
      }
    ]
  }
}
