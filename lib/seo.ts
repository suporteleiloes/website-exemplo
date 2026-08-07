/**
 * SEO — montagem SEGURA de URL absoluta a partir de dado da API.
 * ────────────────────────────────────────────────────────────────────────────
 * ⛔ REGRA FIRME (2026-08-07): `generateMetadata` NUNCA pode lançar.
 *
 * No App Router o `generateMetadata` roda no MESMO render da página. Uma exceção
 * lá dentro não degrada só a metadata — ela derruba a ROTA INTEIRA e o visitante
 * cai no `error.tsx`. Metadata é enfeite; página fora do ar é P0.
 *
 * INCIDENTE REAL (site da Taba, 2026-08-07). A API devolvia
 *   GET /site/config → { siteUrl: "https://www.127.0.0.1" }
 * (config de tenant errada, herdada da migração), e a página fazia
 *   new URL(hrefLeilao(leilao), cfg.siteUrl)
 * `https://www.127.0.0.1` NÃO é URL válida — o parser WHATWG tenta ler
 * `www.127.0.0.1` como IPv4 (o último rótulo é numérico), acha 5 componentes e
 * falha. Resultado: `TypeError: Invalid URL` dentro do `generateMetadata` →
 * **todas** as páginas de leilão e de lote caíam no error boundary. O site
 * estava "no ar" (HTTP 200) e mesmo assim nenhum leilão abria.
 *
 * `siteUrl` é DADO EXTERNO, configurado por humano no ERP de cada leiloeiro:
 * pode vir `null`, vazio, só com espaço, sem esquema (`www.site.com.br`), com
 * lixo, ou apontando pra loopback. Trate como entrada não-confiável — valide
 * antes de usar, e degrade em vez de lançar.
 *
 * ── Como usar (canonical de uma página de detalhe) ───────────────────────────
 *   import { canonicalDe } from '@/lib/seo';
 *
 *   export async function generateMetadata({ params }): Promise<Metadata> {
 *     const [leilao, cfg] = await Promise.all([buscaLeilao(...), safe(getSiteConfig(), null)]);
 *     return {
 *       title: leilao?.titulo || 'Leilão',
 *       ...(leilao ? canonicalDe(hrefLeilao(leilao), cfg?.siteUrl) : {}),
 *     };
 *   }
 *
 * O mesmo vale pra `metadataBase`, `openGraph.url`, `sitemap.ts` e `robots.ts`:
 * passe por `baseSite()`/`urlAbsoluta()` em vez de confiar no valor cru.
 */

/**
 * Hosts que até parseiam, mas nunca são o domínio público de um site de
 * leiloeiro. Um canonical apontando pra loopback é pior que canonical nenhum:
 * o buscador indexaria `http://localhost/leilao/1`.
 */
const HOSTS_PROIBIDOS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '::1']);

/**
 * Normaliza e valida o `siteUrl` vindo da API. Devolve a origem absoluta
 * (`https://site.com.br`) ou `null` quando o valor não serve.
 *
 * Recupera o caso benigno de "veio sem esquema" (`www.site.com.br` →
 * `https://www.site.com.br`); rejeita todo o resto sem lançar.
 */
export function baseSite(siteUrl: string | null | undefined): string | null {
  const cru = (siteUrl || '').trim();
  if (!cru) return null;

  // Sem esquema o `new URL()` lança. Assume https — é o único esquema que um
  // site nosso serve hoje.
  const candidato = /^[a-z][a-z0-9+.-]*:\/\//i.test(cru) ? cru : `https://${cru}`;

  let u: URL;
  try {
    u = new URL(candidato);
  } catch {
    return null; // lixo: `https://www.127.0.0.1`, `http://`, etc.
  }

  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;

  const host = u.hostname.toLowerCase();
  if (!host || HOSTS_PROIBIDOS.has(host)) return null;
  // Domínio público sempre tem ponto. Corta `http://intranet`, `https://api`…
  if (!host.includes('.')) return null;

  return u.origin;
}

/**
 * URL absoluta e canônica de um caminho interno (`/leilao/352-...`).
 * Devolve `undefined` quando o `siteUrl` do tenant não é utilizável.
 *
 * ⚠️ Degrada OMITINDO, não emitindo canonical relativo: sem `metadataBase` no
 * layout, o Next resolve caminho relativo contra `http://localhost:3000` e o
 * canonical sairia apontando pra localhost — pior pro SEO que não ter canonical.
 */
export function urlAbsoluta(caminho: string, siteUrl: string | null | undefined): string | undefined {
  const base = baseSite(siteUrl);
  if (!base) return undefined;
  try {
    return new URL(caminho, base).toString();
  } catch {
    return undefined; // caminho torto não pode derrubar a página
  }
}

/**
 * Fragmento pronto pro objeto `Metadata`: `{ alternates: { canonical } }` quando
 * dá pra montar a URL absoluta, `{}` quando não dá. Espalhe com `...`.
 *
 *   return { title, ...canonicalDe(hrefLeilao(leilao), cfg?.siteUrl) };
 */
export function canonicalDe(
  caminho: string,
  siteUrl: string | null | undefined,
): { alternates?: { canonical: string } } {
  const canonical = urlAbsoluta(caminho, siteUrl);
  return canonical ? { alternates: { canonical } } : {};
}
