import type { Bem, Imagem, Leilao } from './types';

// Resolve a melhor URL de imagem disponível (CDN), com fallbacks.
// Aceita os dois shapes que a API usa: leilão/bem = {full: string|null}; banner = {full: {url}}.
export function urlImagem(img: Imagem | string | Record<string, unknown> | null | undefined, prefer: 'min' | 'thumb' | 'full' = 'min'): string | null {
  if (!img) return null;
  if (typeof img === 'string') return img || null;
  const pick = (v: unknown): string | null =>
    typeof v === 'string' ? (v || null) : (v && typeof v === 'object' && typeof (v as any).url === 'string' ? (v as any).url : null);
  const o = img as Record<string, unknown>;
  return pick(o[prefer]) || pick(o.full) || pick(o.min) || pick(o.thumb) || null;
}

export function fotoBem(bem: Bem | null | undefined): string | null {
  if (!bem) return null;
  const fromImage = urlImagem(bem.image, 'min');
  if (fromImage) return fromImage;
  const f = bem.fotos?.[0];
  return f ? (f.min || f.thumb || f.url) : null;
}

export function fotoLeilao(l: Leilao | null | undefined): string | null {
  return l ? urlImagem(l.image, 'min') : null;
}

export const PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="50%" fill="#9ca3af" font-family="sans-serif" font-size="16" text-anchor="middle" dominant-baseline="middle">sem imagem</text></svg>'
);
