import type { Metadata } from 'next';
import { SITE_URL } from './config';

export interface PageMetaInput {
  title: string;
  description?: string;
  path: string;         // caminho relativo, ex.: "/leilao/123-slug"
  image?: string | null;
  noindex?: boolean;
}

// Monta o bloco de metadata (canonical + Open Graph + Twitter) de uma página.
export function pageMeta({ title, description, path, image, noindex }: PageMetaInput): Metadata {
  const url = `${SITE_URL}${path}`;
  const images = image ? [{ url: image }] : undefined;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      images,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: description ?? undefined,
      images: image ? [image] : undefined,
    },
  };
}

// Renderiza um bloco JSON-LD (structured data) para o Google.
export function jsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
