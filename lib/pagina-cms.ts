/**
 * Páginas institucionais vindas do CMS do leiloeiro (`GET /pages/{slug}`).
 *
 * ── A estratégia: CMS primeiro, texto MODELO como rede ───────────────────────
 * O leiloeiro pode ter (e normalmente tem, quando migra de um site antigo) a
 * política de privacidade, o aviso de cookies e os termos cadastrados no ERP.
 * Quando existem, mandam — é o texto que o jurídico dele aprovou. Quando não
 * existem, a página cai num texto MODELO genérico (definido em cada
 * `app/<pagina>/page.tsx`), para o site nunca nascer sem página legal.
 *
 * ── Nunca renderizamos HTML cru do CMS ───────────────────────────────────────
 * O conteúdo legado traz classes, scripts e imagens de outro site; jogar isso
 * num `dangerouslySetInnerHTML` quebra o layout e abre porta para HTML
 * arbitrário vindo do banco. Extraímos só os blocos de texto (h1–h4 e p) e
 * renderizamos com os estilos deste site.
 *
 * Slugs variam de tenant para tenant (`politica-privacidade` ×
 * `politica-de-privacidade`), por isso cada página passa uma LISTA de
 * candidatos e fica com o primeiro que existir.
 */

import { apiGet } from './api';

export interface PaginaCms {
  id: number;
  slug: string | null;
  titulo: string | null;
  conteudo: string | null;
  metaTitle?: string | null;
  metaDesc?: string | null;
}

export interface Bloco {
  tag: 'h1' | 'h2' | 'h3' | 'h4' | 'p';
  texto: string;
}

const ENTIDADES: Record<string, string> = {
  '&nbsp;': ' ', '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
  '&#39;': "'", '&apos;': "'", '&ldquo;': '“', '&rdquo;': '”', '&ordm;': 'º', '&ordf;': 'ª',
};

/** Tira todo o markup e resolve as entidades HTML mais comuns num texto plano. */
export function textoPlano(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&[a-z]+;|&#39;/gi, (e) => ENTIDADES[e.toLowerCase()] ?? ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extrai os blocos de texto do HTML do CMS, na ordem, descartando markup e imagens. */
export function extrairBlocos(html: string | null | undefined): Bloco[] {
  if (!html) return [];
  const out: Bloco[] = [];
  const re = /<(h1|h2|h3|h4|p)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const t = textoPlano(m[2]);
    if (t) out.push({ tag: m[1].toLowerCase() as Bloco['tag'], texto: t });
  }
  return out;
}

export interface ResultadoCms {
  pagina: PaginaCms | null;
  blocos: Bloco[];
}

/**
 * Busca a página no CMS tentando cada slug em ordem; devolve a primeira que existir.
 * 404 (ou API fora do ar) em todos os slugs → `{ pagina: null, blocos: [] }` e a
 * tela usa o texto MODELO.
 */
export async function carregarPaginaCms(slugs: string[]): Promise<ResultadoCms> {
  for (const slug of slugs) {
    const pagina = await apiGet<PaginaCms>(`/pages/${slug}`, { revalidate: 300 }).catch(() => null);
    if (pagina && (pagina.conteudo || pagina.titulo)) {
      return { pagina, blocos: extrairBlocos(pagina.conteudo) };
    }
  }
  return { pagina: null, blocos: [] };
}
