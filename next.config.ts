import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Dev only — placeholder images from seed-sample.ts
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
    // Performance: balance quality vs file size for marketplace thumbnails
    qualities: [70],
  },
};

export default nextConfig;
