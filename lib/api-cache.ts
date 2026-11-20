// Cache dos dados da API Website V2 no CACHE LOCAL da Cloudflare (Cache API, por data center).
//
// Por que não o cache de dados do Next (incremental cache no R2)?
// Em produção o R2 passou a recusar gravações ("Failed to set to cache" 10043 / 10058 —
// erro interno e gravação concorrente no mesmo objeto). Quando a gravação falha, o Next
// continua servindo a versão ANTIGA indefinidamente: foto/ordem de lote desatualizadas
// por horas (20/11/2026; o mesmo erro aparecia em vários sites).
//
// Regras (seguro, sem falha silenciosa, sem sobrecarregar a API):
//  - fresco por `ttl` segundos por data center (poucos data centers atendem o Brasil →
//    no máximo algumas chamadas por URL a cada `ttl`);
//  - API fora / 5xx / timeout → serve a última cópia por até STALE_MAX (10 min) em vez de erro;
//  - qualquer falha do próprio cache → busca direto na API (nunca quebra a página);
//  - gravação no cache não bloqueia a resposta (waitUntil).

import { getCloudflareContext } from '@opennextjs/cloudflare';

const STALE_MAX = 600; // segundos que uma cópia pode ser usada se a API falhar
const TIMEOUT_MS = 8000;
const HDR_EM = 'x-sl-cache-em';

type CachesComDefault = CacheStorage & { default?: Cache };

function cacheLocal(): Cache | null {
  try {
    const c = (globalThis as unknown as { caches?: CachesComDefault }).caches;
    return c?.default ?? null; // só existe no runtime de Workers (em dev/node: null → sem cache)
  } catch {
    return null;
  }
}

function emSegundo(fn: Promise<unknown>) {
  try {
    // Fora do Worker (build/dev) o contexto não existe e isto lança: cai no fallback.
    const ctx = getCloudflareContext()?.ctx;
    if (ctx?.waitUntil) { ctx.waitUntil(fn.catch(() => {})); return; }
  } catch { /* sem contexto */ }
  fn.catch(() => {});
}

export interface Resposta { status: number; text: string }

/** Busca com cache local + cópia de reserva. `ttl` 0 = sempre direto na API. */
export async function buscarComCache(url: string, headers: Record<string, string>, ttl: number): Promise<Resposta> {
  const buscar = async (): Promise<Resposta> => {
    const res = await fetch(url, { headers, cache: 'no-store', signal: AbortSignal.timeout(TIMEOUT_MS) });
    return { status: res.status, text: await res.text() };
  };
  const cache = ttl > 0 ? cacheLocal() : null;
  if (!cache) return buscar();

  // A chave inclui o tenant (o mesmo Worker pode atender mais de um host).
  const chave = new Request(`${url}${url.includes('?') ? '&' : '?'}__t=${encodeURIComponent(headers['Uloc-Mi'] || '')}`);
  let copia: { em: number; text: string } | null = null;
  try {
    const hit = await cache.match(chave);
    if (hit) copia = { em: Number(hit.headers.get(HDR_EM) || 0), text: await hit.text() };
  } catch { copia = null; }

  const idade = copia ? (Date.now() - copia.em) / 1000 : Infinity;
  if (copia && idade < ttl) return { status: 200, text: copia.text };

  try {
    const r = await buscar();
    if (r.status >= 500 && copia && idade < STALE_MAX) return { status: 200, text: copia.text };
    if (r.status === 200) {
      emSegundo(cache.put(chave, new Response(r.text, {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': `public, max-age=${STALE_MAX}`, [HDR_EM]: String(Date.now()) },
      })));
    }
    return r;
  } catch (e) {
    if (copia && idade < STALE_MAX) return { status: 200, text: copia.text };
    throw e;
  }
}
