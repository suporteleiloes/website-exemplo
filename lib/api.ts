// Cliente HTTP server-side da API Website V2.
// - Sempre injeta o header multi-tenant Uloc-Mi.
// - Envelope: listas = { result, total, page, limit, pages }; item = objeto; erro = { error, status, message, code }.
// - Cache: usa o cache nativo do Next (revalidate por endpoint — ver GUIA-WEBSITE-V2 §10).

import { V2, TENANT, TENANT_HEADER } from './config';
import type {
  Paginated, Leilao, Lote, LancePublico, Filtros, SiteConfig, Banner, MenuGrupo, Comitente, Leiloeiro,
} from './types';

type Params = Record<string, string | number | boolean | undefined | null>;

export class ApiException extends Error {
  status: number;
  code?: string;
  extra?: Record<string, unknown>;
  constructor(message: string, status: number, code?: string, extra?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiException';
    this.status = status;
    this.code = code;
    this.extra = extra;
  }
}

export function buildQuery(params?: Params): string {
  if (!params) return '';
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    usp.set(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
}

interface FetchOpts {
  params?: Params;
  revalidate?: number; // segundos (ISR). 0 = sempre fresco.
  tenant?: string;
}

/** GET genérico na Website V2. Lança ApiException em erro HTTP. */
export async function apiGet<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const url = `${V2}${path}${buildQuery(opts.params)}`;
  const res = await fetch(url, {
    headers: { [TENANT_HEADER]: opts.tenant || TENANT, Accept: 'application/json' },
    next: { revalidate: opts.revalidate ?? 30 },
  });
  const text = await res.text();
  let body: unknown;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }

  if (!res.ok) {
    const e = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
    throw new ApiException(
      (e.message as string) || `Erro ${res.status} em ${path}`,
      res.status,
      e.code as string | undefined,
      e.extra as Record<string, unknown> | undefined,
    );
  }
  return body as T;
}

/** POST genérico (formulários públicos: contato, newsletter, comprar). */
export async function apiPost<T>(path: string, payload: unknown, tenant = TENANT): Promise<T> {
  const res = await fetch(`${V2}${path}`, {
    method: 'POST',
    headers: { [TENANT_HEADER]: tenant, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });
  const text = await res.text();
  let body: unknown;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) {
    const e = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;
    throw new ApiException((e.message as string) || `Erro ${res.status}`, res.status, e.code as string, e.extra as Record<string, unknown>);
  }
  return body as T;
}

// ── Camada tipada de conveniência ────────────────────────────────

export const getSiteConfig = () => apiGet<SiteConfig>('/site/config', { revalidate: 120 });
export const getLeiloeiro = () => apiGet<Leiloeiro>('/site/leiloeiro', { revalidate: 120 });
export const getMenus = () => apiGet<{ result: MenuGrupo[] }>('/site/menus', { revalidate: 120 });
export const getBanners = (secao = 'home') => apiGet<{ result: Banner[]; total: number }>('/site/banners', { params: { secao }, revalidate: 60 });
export const getFiltros = (params?: Params) => apiGet<Filtros>('/buscador/filtros', { params, revalidate: 60 });

export const getLeiloes = (params?: Params) => apiGet<Paginated<Leilao>>('/leiloes', { params, revalidate: 20 });
export const getLeilao = (idOrSlug: string | number) => apiGet<Leilao>(`/leiloes/${idOrSlug}`, { revalidate: 20 });
export const getLeilaoDocumentos = (id: number) => apiGet<{ result: unknown[]; total: number }>(`/leiloes/${id}/documentos`, { revalidate: 60 });

export const getLotes = (params?: Params) => apiGet<Paginated<Lote>>('/lotes', { params, revalidate: 15 });
export const getLote = (idOrSlug: string | number) => apiGet<Lote>(`/lotes/${idOrSlug}`, { revalidate: 10 });
export const getLancesPublicos = (id: number) => apiGet<{ result: LancePublico[]; total: number }>(`/lotes/${id}/lances-publicos`, { revalidate: 0 });

export interface VizinhoRef { id: number; slug: string | null; numero: number | null }
export const getLoteVizinhos = (id: number) => apiGet<{ anterior: VizinhoRef | null; proximo: VizinhoRef | null }>(`/lotes/${id}/vizinhos`, { revalidate: 15 });

export const getAgenda = (mes: number, ano: number) => apiGet<unknown>('/agenda', { params: { mes, ano }, revalidate: 30 });
export const getAgendaProximos = (limit = 5) => apiGet<{ result: Leilao[] }>('/agenda/proximos', { params: { limit }, revalidate: 30 });
export const getComitentes = (params?: Params) => apiGet<Paginated<Comitente>>('/comitentes', { params, revalidate: 120 });
