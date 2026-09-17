import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3'],
  // No redirects needed — nginx handles SwatchBoost case-insensitively
};

export default nextConfig;
