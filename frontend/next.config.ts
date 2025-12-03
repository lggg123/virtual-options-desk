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