// Cliente do Messenger CopilotSL — consome os endpoints públicos do widget via BFF proxy.
// (bootstrap, central de ajuda, conversa). Todas as chamadas client-side passam pelo
// /api/proxy (anexa Uloc-Mi + Bearer quando logado).

export interface WidgetBootstrap {
  slug: string;
  nome: string;
  tema: 'claro' | 'escuro' | 'auto';
  corPrimaria: string;
  corSecundaria: string;
  avatarUrl: string | null;
  logoUrl: string | null;
  agente: string;
  saudacao: string;
  boasVindas: string;
  posicao: 'direita' | 'esquerda';
  idioma: string;
  botAtivo: boolean;
  abas: { inicio: boolean; mensagens: boolean; ajuda: boolean; novidades: boolean };
  botoesRapidos: { label: string; acao: string }[];
  horario: { aberto: boolean; foraMsg: string };
  novidades: { titulo: string; resumo: string; url?: string; data?: string }[];
}

export interface AjudaArtigoRef { id: number; categoria: string; titulo: string; resumo: string }
export interface AjudaColecao { categoria: string; total: number }
export interface AjudaArtigo { id: number; categoria: string; titulo: string; corpo: string }

const P = '/api/proxy/public/widget';

export async function getBootstrap(slug: string): Promise<WidgetBootstrap | null> {
  try {
    const r = await fetch(`${P}/${slug}/bootstrap`, { cache: 'no-store' });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

export async function getAjuda(slug: string, busca = ''): Promise<{ colecoes: AjudaColecao[]; artigos: AjudaArtigoRef[] }> {
  try {
    const qs = busca ? `?busca=${encodeURIComponent(busca)}` : '';
    const r = await fetch(`${P}/${slug}/ajuda${qs}`, { cache: 'no-store' });
    if (!r.ok) return { colecoes: [], artigos: [] };
    const d = await r.json();
    return { colecoes: d.colecoes || [], artigos: d.artigos || [] };
  } catch { return { colecoes: [], artigos: [] }; }
}

export async function getArtigo(slug: string, id: number): Promise<AjudaArtigo | null> {
  try {
    const r = await fetch(`${P}/${slug}/ajuda/${id}`, { cache: 'no-store' });
    if (!r.ok) return null;
    const d = await r.json();
    return d.artigo || null;
  } catch { return null; }
}

// ── Mensagens proativas / outbound (estilo Intercom Messages) ──
export interface ProativaRegra { evento: 'tempo' | 'pagina' | 'segmento'; valor: number | string }
export interface Proativa { id: number; titulo: string; corpo: string; regra: ProativaRegra }

export async function getProativas(slug: string): Promise<Proativa[]> {
  try {
    const r = await fetch(`${P}/${slug}/proativas`, { cache: 'no-store' });
    if (!r.ok) return [];
    const d = await r.json();
    return Array.isArray(d?.proativas) ? d.proativas : [];
  } catch { return []; }
}

export interface ConversaMsg { id?: number; role: 'user' | 'support'; text: string }

export async function getHistorico(slug: string, sessionId: string): Promise<{ status: string | null; messages: ConversaMsg[] }> {
  try {
    const r = await fetch(`/api/proxy/public/widget/${slug}/historico?session_id=${encodeURIComponent(sessionId)}`, { cache: 'no-store' });
    if (!r.ok) return { status: null, messages: [] };
    const d = await r.json();
    return { status: d.status ?? null, messages: (d.messages || []).map((m: any) => ({ id: m.id, role: m.role === 'user' ? 'user' : 'support', text: m.text })) };
  } catch { return { status: null, messages: [] }; }
}

export async function enviarMensagem(slug: string, sessionId: string, text: string): Promise<{ ok: boolean; replied?: boolean; reply_text?: string; status?: string; motivo?: string }> {
  try {
    const r = await fetch('/api/proxy/public/inbound/webchat', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, session_id: sessionId, text }),
    });
    return await r.json();
  } catch { return { ok: false, motivo: 'erro_rede' }; }
}

// ── Variantes SSR (server component) — fetcham direto da API com header tenant,
// já que o proxy usa URL relativa que não resolve fora do browser. ──
import { API_BASE, TENANT, TENANT_HEADER } from './config';

export async function getAjudaServer(slug: string, busca = ''): Promise<{ colecoes: AjudaColecao[]; artigos: AjudaArtigoRef[] }> {
  try {
    const qs = busca ? `?busca=${encodeURIComponent(busca)}` : '';
    const r = await fetch(`${API_BASE}/api/public/widget/${slug}/ajuda${qs}`, {
      headers: { [TENANT_HEADER]: TENANT, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!r.ok) return { colecoes: [], artigos: [] };
    const d = await r.json();
    return { colecoes: d.colecoes || [], artigos: d.artigos || [] };
  } catch { return { colecoes: [], artigos: [] }; }
}

export async function getArtigoServer(slug: string, id: number): Promise<AjudaArtigo | null> {
  try {
    const r = await fetch(`${API_BASE}/api/public/widget/${slug}/ajuda/${id}`, {
      headers: { [TENANT_HEADER]: TENANT, Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!r.ok) return null;
    const d = await r.json();
    return d.artigo || null;
  } catch { return null; }
}
