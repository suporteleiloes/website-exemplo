// Camada tipada da VENDA DIRETA (Website V2 — /venda-direta/*).
// Vocabulário próprio: Evento (não leilão), Anúncio (não lote), Oferta (não lance),
// Proposta (negociação separada), Compre Já (compra direta). Reaproveita apiGet/Bem.

import { apiGet, type Params } from './api';
import type { Bem, Comitente } from './types';

export interface Modos {
  compraDireta: boolean; // COMPRE JÁ pelo preço cheio
  oferta: boolean;       // oferta vinculante (disputa)
  proposta: boolean;     // negociação separada
}

export interface Evento {
  id: number;
  codigo: string | null;
  slug: string | null;
  titulo: string | null;
  descricao: string | null;
  regras: string | null;
  status: number;
  statusLabel: string;
  dataPublicacao: string | null;
  dataLimitePropostas: string | null;
  encerrado: boolean;
  privado: boolean;
  image: { full: string | null; thumb: string | null; min: string | null } | null;
  totalAnuncios: number | null;
  local: string | null;
  infoVisitacao: string | null;
  infoPagamento: string | null;
  infoRetirada: string | null;
  comitentes: Comitente[];
  modos: Modos;
  _urls: { regras: string | null };
}

export interface EventoMin {
  id: number;
  slug: string | null;
  titulo: string | null;
  status: number;
  statusLabel: string;
}

export interface Anuncio {
  id: number;
  slug: string | null;
  titulo: string | null;
  descricao: string | null;
  observacao: string | null;
  status: number;
  statusLabel: string;
  precoMinimo: number | null;
  precoAvaliacao: number | null;
  incremento: number | null;
  ofertaAtual: number | null;
  totalOfertas: number;
  destaque: boolean;
  videos: string[];
  modos: Modos;
  bem: Bem | null;
  evento: EventoMin | null;
}

export interface OfertaPublica {
  apelido: string | null;
  valor: number | null;
  data: string | null;
}

export interface VdFiltros {
  categorias: { id?: number | string; nome?: string; total?: number }[];
  subcategorias: { id?: number | string; nome?: string; total?: number }[];
  ufs: { id?: string; nome?: string; total?: number }[];
  cidades: { id?: string; nome?: string; total?: number }[];
  comitentes: { id?: number; nome?: string; total?: number }[];
}

type Pag<T> = { result: T[]; total: number; page: number; limit: number; pages: number };

export const getEventos = (params?: Params) =>
  apiGet<Pag<Evento>>('/venda-direta/eventos', { params, revalidate: 20 });
export const getEvento = (idOrSlug: string | number) =>
  apiGet<Evento>(`/venda-direta/eventos/${idOrSlug}`, { revalidate: 20 });

export const getAnuncios = (params?: Params) =>
  apiGet<Pag<Anuncio>>('/venda-direta/anuncios', { params, revalidate: 15 });
export const getAnuncio = (idOrSlug: string | number) =>
  apiGet<Anuncio>(`/venda-direta/anuncios/${idOrSlug}`, { revalidate: 10 });
export const getOfertasPublicas = (id: number) =>
  apiGet<{ result: OfertaPublica[]; total: number }>(`/venda-direta/anuncios/${id}/ofertas-publicas`, { revalidate: 0 });

export const getVdFiltros = (params?: Params) =>
  apiGet<VdFiltros>('/venda-direta/buscador/filtros', { params, revalidate: 60 });

// Status do anúncio com cor (Tailwind).
export function corStatusAnuncio(status: number): string {
  if (status === 100) return 'bg-green-600 text-white';
  if (status === 1 || status === 2) return 'bg-green-100 text-green-800';
  if (status === 8 || status === 9) return 'bg-amber-100 text-amber-800';
  if ([10, 11, 12, 13].includes(status)) return 'bg-gray-200 text-gray-600';
  return 'bg-gray-100 text-gray-700';
}

export function corStatusEvento(status: number): string {
  if (status === 3 || status === 4) return 'bg-green-100 text-green-800';
  if (status === 1 || status === 2) return 'bg-blue-100 text-blue-800';
  if (status === 99) return 'bg-gray-200 text-gray-700';
  return 'bg-amber-100 text-amber-800';
}
