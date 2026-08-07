/**
 * LINKS PARA O PAINEL DO ARREMATANTE (app-cliente) — PONTO ÚNICO.
 * ────────────────────────────────────────────────────────────────────────────
 * ⛔ REGRA FIRME DO TEMPLATE (2026-08-07): NENHUM link para o painel é escrito à
 * mão. Todo link passa por `hrefPainel()`. Escrever `${PAINEL_URL}/rota` direto
 * no JSX é o bug — foi assim que o botão "Auditório Virtual" mandava o visitante
 * LOGADO no site para um painel DESLOGADO: o painel vive em OUTRO domínio
 * (`app.<tenant>`) e cookie não atravessa domínio.
 *
 * Por que um helper e não "lembrar de usar o handoff": ninguém lembra. Com o
 * helper, quem escreve um link novo (neste template ou no site derivado dele)
 * não precisa saber que existe SSO — usa a função e o comportamento certo vem
 * junto.
 *
 * ── Como a sessão chega no painel (duas camadas que se cobrem) ───────────────
 * 1. NO LOGIN (proativo): ao entrar no site, `LoginForm`/`CadastroForm` mandam o
 *    navegador pelo handoff com `?voltar=<url do site>` — o painel resgata o
 *    código de troca de uso único, grava a sessão dele e devolve o visitante pra
 *    onde estava. A partir daí o painel já está logado e qualquer link abre
 *    logado.
 * 2. NO LINK (auto-curativo): mesmo assim os links passam pelo handoff, porque a
 *    sessão do painel expira/é limpa em momento DIFERENTE da do site (TTLs e
 *    storages independentes, outro navegador, cache limpo). Sem esta camada, o
 *    dia em que a sessão do painel cair sozinha o visitante volta a chegar lá
 *    deslogado, e nada se corrige.
 *
 * O custo da camada 2 é um redirect (~centenas de ms) e um código de troca de
 * uso único — barato. O custo de errar é o arrematante não conseguir dar lance.
 *
 * Mecânica do handoff: `POST /api/sso/exchange` (site, autenticado) gera o código
 * → `POST /api/auth/sso/redeem` (painel) troca por sessão. O BFF que orquestra é
 * `app/api/sso/handoff/route.ts`.
 */

import { PAINEL_URL } from './config';

export interface OpcoesPainel {
  /**
   * Destino é PÚBLICO no painel (hoje: o auditório). Visitante sem sessão no
   * site é levado direto pro painel em vez de mandado pro /login.
   * Só use em rota que o app-cliente declara `meta: { public: true }`.
   */
  publico?: boolean;
}

/**
 * URL para uma rota interna do painel, sempre via handoff SSO.
 * Devolve `''` quando não há painel configurado (o chamador esconde o link).
 *
 * @param rota rota interna do app-cliente, começando com "/" (ex.: `/auditorio/352`)
 */
export function hrefPainel(rota: string, opts: OpcoesPainel = {}): string {
  if (!PAINEL_URL) return '';
  const destino = rota.startsWith('/') && !rota.startsWith('//') ? rota : '/';
  const qs = new URLSearchParams({ redirect: destino });
  if (opts.publico) qs.set('anon', '1');
  return `/api/sso/handoff?${qs.toString()}`;
}

/** Atalhos nomeados — evitam repetir o formato da rota do painel pelo site afora. */
export const rotaAuditorio = (leilaoId: number | string) => `/auditorio/${leilaoId}`;
export const rotaLotePainel = (loteId: number | string) => `/lotes/${loteId}`;
