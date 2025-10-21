import type { NextConfig } from 'next'
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare'

const devOptions = {
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'https://api.matekasse.de/:path*', // External API
      },
    ]
  },
  async redirects() {
    return [
      {
        statusCode: 301,
        source: '/_error',
        destination: '/',
      },
    ]
  },
}

if (process.env.NODE_ENV === 'development') {
  initOpenNextCloudflareForDev().catch(e => console.error(e));
}

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  ...(process.env.NODE_ENV === 'development' ? devOptions : {}),
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'nx49890.your-storageshare.de' },
      { protocol: 'https', hostname: 'cdn.gero.dev' },
      { protocol: 'https', hostname: 'cloud.librico.org' },
      { protocol: 'https', hostname: 'msrd0.de' },
    ],
  },
}

export default nextConfig
