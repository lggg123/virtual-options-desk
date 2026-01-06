import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      '*.py': {
        loaders: ['raw-loader'],
      },
    },
  },
  // Enable standalone output for better deployment
  output: 'standalone',

  // Allow CoinGecko images
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
      },
      {
        protocol: 'https',
        hostname: 'coin-images.coingecko.com',
      },
    ],
  },

  // Python service integration
  async rewrites() {
    return [
      {
        source: '/api/python/:path*',
        destination: 'http://localhost:8000/api/:path*', // Python service URL
      },
    ];
  },
}

export default nextConfig