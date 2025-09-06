import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.lemonde.fr' },
      { protocol: 'https', hostname: 'img.lemde.fr' },
      { protocol: 'https', hostname: '**.lefigaro.fr' },
      { protocol: 'https', hostname: 'i.f1g.fr' },
      { protocol: 'https', hostname: '**.liberation.fr' },
      { protocol: 'https', hostname: '**.france24.com' },
      { protocol: 'https', hostname: '**.francetvinfo.fr' },
      { protocol: 'https', hostname: '**.franceinfo.fr' },
      { protocol: 'https', hostname: '**.bfmtv.com' },
      { protocol: 'https', hostname: '**.lexpress.fr' },
      { protocol: 'https', hostname: '**.marianne.net' },
      { protocol: 'https', hostname: '**.nouvelobs.com' },
      { protocol: 'https', hostname: '**.lesechos.fr' },
      { protocol: 'https', hostname: '**.latribune.fr' },
      { protocol: 'https', hostname: '**.challenges.fr' },
      { protocol: 'https', hostname: '**.capital.fr' },
      { protocol: 'https', hostname: '**.futura-sciences.com' },
      { protocol: 'https', hostname: '**.sciencesetavenir.fr' },
      { protocol: 'https', hostname: '**.01net.com' },
      { protocol: 'https', hostname: '**.clubic.com' },
      { protocol: 'https', hostname: '**.lequipe.fr' },
      { protocol: 'https', hostname: 'rmcsport.bfmtv.com' },
      { protocol: 'https', hostname: '**.telerama.fr' },
      { protocol: 'https', hostname: '**.lesinrocks.com' },
      { protocol: 'https', hostname: '**.ouest-france.fr' },
      { protocol: 'https', hostname: '**.20minutes.fr' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['framer-motion', 'lucide-react'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=60, stale-while-revalidate=300'
          }
        ]
      }
    ];
  },
};

export default nextConfig;
