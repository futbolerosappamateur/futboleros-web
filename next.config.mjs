/** @type {import('next').NextConfig} */
const nextConfig = {
  // Para el hosting propio (Node.js en Plesk): `next build` arma en .next/standalone un server.js con lo
  // justo para correr; al lado van .next/static y public
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  serverExternalPackages: ['sharp'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kacjlipwhmqhmjsdcxts.supabase.co',
      },
    ],
  },
}

export default nextConfig
