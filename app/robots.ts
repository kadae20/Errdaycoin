import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://errdaycoin.com'
  
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/test-db',
        '/_next/',
        '/admin/',
        '/private/'
      ]
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl
  }
}
