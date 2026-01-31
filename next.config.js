/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  serverExternalPackages: ['openai'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'meggkopiinwpefsqnqac.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/images/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/api/navidrome/cover**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3000',
        pathname: '/api/navidrome/cover**',
      },
      {
        protocol: 'https',
        hostname: 'i.scdn.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'image-cdn-ak.spotifycdn.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

module.exports = nextConfig;
