import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3'],
  // Live data lives outside the build and is symlinked in by deploy.sh. Never
  // trace it into .next/standalone: that copied the databases and uploads into
  // the build and broke the symlinks on deploy.
  outputFileTracingExcludes: {
    '/*': ['./data/**/*', './public/uploads/**/*', './docs/**/*', './design-src/**/*'],
  },
  // No redirects needed — nginx handles SwatchBoost case-insensitively
};

export default nextConfig;
