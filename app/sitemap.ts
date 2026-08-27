import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';
import { getLeiloes } from '@/lib/api';
import type { Leilao } from '@/lib/types';

export const revalidate = 3600; // 1h

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const estaticas: MetadataRoute.Sitemap = ['', '/leiloes', '/agenda', '/venda-direta', '/mapa', '/contato', '/cadastro', '/ajuda', '/quero-vender']
    .map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: 'daily', priority: p === '' ? 1 : 0.7 }));

  let leiloes: Leilao[] = [];
  try { leiloes = (await getLeiloes({ limit: 500, sortBy: 'dataProximoLeilao', order: 'desc' })).result; } catch { /* segue com estáticas */ }
  const dinamicas: MetadataRoute.Sitemap = leiloes.map((l) => ({
    url: `${SITE_URL}/leilao/${l.slug || l.id}`,
    changeFrequency: 'hourly',
    priority: 0.8,
  }));

  return [...estaticas, ...dinamicas];
}
