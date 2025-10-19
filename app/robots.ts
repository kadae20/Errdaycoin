import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://errdaycoin.com'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/play',
          '/leaderboard',
          '/community',
          '/analysis',
          '/legal'
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/private/',
          '/test-db/',
          '/auth/',
          '/result/',
          '/dashboard/',
          '/portfolio/',
          '/watchlist/',
          '/_next/',
          '/_vercel/',
          '/node_modules/'
        ],
        crawlDelay: 1
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/play',
          '/leaderboard',
          '/community',
          '/analysis',
          '/legal'
        ],
        disallow: [
          '/api/',
          '/admin/',
          '/private/',
          '/test-db/',
          '/auth/',
          '/result/',
          '/dashboard/',
          '/portfolio/',
          '/watchlist/',
          '/_next/',
          '/_vercel/',
          '/node_modules/'
        ],
        crawlDelay: 0
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  }
}
