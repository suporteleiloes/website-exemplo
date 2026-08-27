/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ESLint 9 usa flat-config; não deixamos o lint travar o build de produção (o tsc já valida tipos).
  eslint: { ignoreDuringBuilds: true },
  images: {
    // Imagens dos bens/leilões vêm do CDN estático da SL.
    remotePatterns: [
      { protocol: 'https', hostname: 'static.suporteleiloes.com.br' },
      { protocol: 'https', hostname: '**.suporteleiloes.com.br' },
    ],
  },
};

export default nextConfig;
