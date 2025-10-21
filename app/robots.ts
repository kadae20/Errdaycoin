import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.errdaycoin.com';
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',        // API 엔드포인트는 인덱스 불필요
          '/admin/',      // 관리자 화면 노출 방지
          '/_next/',      // 빌드 산출물
          '/*.json$',
          '/*.txt$',
          '/*.xml$'
        ]
      }
    ],
    sitemap: [`${base}/sitemap.xml`],
    host: base
  };
}
