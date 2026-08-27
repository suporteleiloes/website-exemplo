import type { MetadataRoute } from 'next';
import { SITE_URL, MODO_EXEMPLO } from '@/lib/config';
import { getSiteConfig } from '@/lib/api';

export default async function robots(): Promise<MetadataRoute.Robots> {
  const config = await getSiteConfig().catch(() => null);
  // seo.indexavel=false (homologação) → bloqueia tudo, pra não vazar pro Google.
  const indexavel = MODO_EXEMPLO ? true : (config?.seo?.indexavel !== false);
  if (!indexavel) {
    return { rules: { userAgent: '*', disallow: '/' } };
  }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/conta', '/api/', '/login'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
