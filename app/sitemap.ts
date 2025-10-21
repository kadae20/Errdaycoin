import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.errdaycoin.com';

  const routes: { path: string; priority?: number }[] = [
    { path: '/', priority: 1.0 },
    { path: '/play', priority: 0.8 },
    { path: '/login', priority: 0.6 },
    { path: '/referral', priority: 0.6 }, // 있으면 유지, 없으면 제거
  ];

  const now = new Date();

  // 다국어 alternates는 페이지 오픈 후 활성화 (주석 참고)
  return routes.map(({ path, priority }) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority,
    // alternates: {
    //   languages: {
    //     'en': `${base}${path}`,
    //     'ko': `${base}/kr${path === '/' ? '' : path}`
    //   }
    // }
  }));
}
