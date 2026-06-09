/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Imagens dos bens/leilões vêm do CDN estático da SL.
    remotePatterns: [
      { protocol: 'https', hostname: 'static.suporteleiloes.com.br' },
      { protocol: 'https', hostname: '**.suporteleiloes.com.br' },
    ],
  },
};

export default nextConfig;
