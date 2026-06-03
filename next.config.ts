import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3'],
  async redirects() {
    return [
      // Lowercase → canonical capitalised URL
      {
        source: '/apps/swatchboost',
        destination: '/apps/SwatchBoost',
        permanent: true,
      },
      {
        source: '/apps/swatchboost/docs',
        destination: '/apps/SwatchBoost/docs',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
