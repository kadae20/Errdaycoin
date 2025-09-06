import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://errdaycoin.com'
  
  const routes = [
    '',
    '/dashboard',
    '/play',
    '/watchlist', 
    '/portfolio',
    '/community',
    '/analysis',
    '/leaderboard',
    '/legal'
  ]

  const languages = ['en', 'ko', 'ja', 'zh', 'es', 'fr']

  const sitemap: MetadataRoute.Sitemap = []

  // Add main routes for each language
  routes.forEach(route => {
    languages.forEach(lang => {
      sitemap.push({
        url: `${baseUrl}${lang === 'en' ? '' : `/${lang}`}${route}`,
        lastModified: new Date(),
        changeFrequency: route === '' || route === '/dashboard' ? 'daily' : 'weekly',
        priority: route === '' ? 1.0 : route === '/play' ? 0.9 : 0.8,
      })
    })
  })

  return sitemap
}
