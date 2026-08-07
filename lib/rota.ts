/**
 * ROTAS DE LEILÃO E LOTE — O ID É OBRIGATÓRIO NA URL.
 * ────────────────────────────────────────────────────────────────────────────
 * ⛔ REGRA FIRME (2026-08-07) — vale para TODO site construído sobre a Website V2.
 *
 * O slug do leilão/lote é DERIVADO DO TÍTULO e muda quando o leiloeiro edita o
 * título no ERP. Se a URL fosse só o slug, todo link já divulgado (e-mail
 * marketing, WhatsApp, portal parceiro, anúncio pago, indexação do Google)
 * apontaria pra 404 depois de uma correção boba de título. Aconteceu de verdade:
 *   /leilao/leilao-de-simulacao  →  /leilao/leilao-de-simulacao-para-testes
 *
 * Por isso TODA URL gerada por este site carrega o ID como prefixo:
 *   /leilao/352-leilao-de-simulacao
 *   /lote/12345-fiat-uno-2010
 * O ID é imutável; o slug fica só como enfeite legível/SEO. Trocar o título muda
 * o rabo da URL, mas o link antigo continua abrindo o mesmo registro.
 *
 * ── Compatibilidade (nada quebra) ────────────────────────────────────────────
 * `idDaRota()` resolve as três formas que podem chegar na rota dinâmica:
 *   "352-leilao-de-simulacao" → 352      (forma canônica nova)
 *   "352"                     → 352      (id puro)
 *   "leilao-de-simulacao"     → null     (slug puro — links antigos divulgados)
 * Quando devolve `null`, a página faz o lookup pelo parâmetro cru (a API resolve
 * por slug). E quando devolve um id, vale a pena manter o fallback pelo cru: um
 * slug que POR ACASO comece com número ("2-vara-civel-…") também casaria o regex.
 * Ver `resolverPorIdOuSlug()`.
 *
 * ⚠️ Ao copiar este arquivo pro site de um cliente, confira o NOME das rotas: aqui
 * o detalhe do leilão é `/leilao/[idOrSlug]` (singular) e a listagem é `/leiloes`.
 * Alguns sites usam `/leiloes/[idOrSlug]` — só estas duas funções precisam mudar.
 */

/** Qualquer registro do catálogo que vira URL: id obrigatório, slug opcional. */
export interface ComIdESlug {
  id: number;
  slug?: string | null;
}

/** `/leilao/{id}-{slug}` — o slug é opcional, o id nunca. */
export function hrefLeilao(l: ComIdESlug): string {
  return `/leilao/${caminho(l)}`;
}

/** `/lote/{id}-{slug}` */
export function hrefLote(l: ComIdESlug): string {
  return `/lote/${caminho(l)}`;
}

/** Segmento da URL: `{id}-{slug}` ou só `{id}` quando não há slug utilizável. */
export function caminho(l: ComIdESlug): string {
  const slug = (l.slug || '').trim();
  return slug ? `${l.id}-${slug}` : String(l.id);
}

/**
 * Extrai o ID numérico do segmento de rota. `null` quando o segmento é slug puro
 * (link antigo) — nesse caso a página resolve pela API usando o valor cru.
 */
export function idDaRota(idOrSlug: string): number | null {
  const m = /^(\d+)(?:-|$)/.exec(idOrSlug);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isSafeInteger(n) && n > 0 ? n : null;
}

/**
 * Busca por ID (forma canônica) e, se não achar, tenta o parâmetro cru (slug).
 * Cobre os links antigos e o slug que começa com número.
 *
 * O `buscar` recebido DEVE devolver `null` no 404 (e não lançar), pra que o
 * resolvedor possa tentar a próxima forma; erro de infra continua subindo.
 */
export async function resolverPorIdOuSlug<T>(
  idOrSlug: string,
  buscar: (chave: string | number) => Promise<T | null>,
): Promise<T | null> {
  const id = idDaRota(idOrSlug);
  if (id !== null) {
    const porId = await buscar(id);
    if (porId) return porId;
  }
  if (String(id) === idOrSlug) return null; // era id puro e não existe
  return buscar(idOrSlug);
}
