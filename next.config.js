/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['logo.clearbit.com'],
    formats: ['image/webp', 'image/avif'],
  },
  // 프로덕션 빌드 시 타입 체크와 ESLint 활성화
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    // App Router 최적화
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  // 번들 분석을 위한 설정
  webpack: (config, { dev, isServer }) => {
    // 개발 환경에서 번들 크기 최적화
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks.cacheGroups,
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10,
          },
          supabase: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: 'supabase',
            chunks: 'all',
            priority: 20,
          },
        },
      };
    }
    return config;
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=60',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
