// Helpers de formatação e rótulos de status (ver GUIA-WEBSITE-V2 §6.4).

export function moeda(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Máscara de moeda BR "enquanto digita": os dígitos entram como CENTAVOS.
// "" quando vazio; senão "R$ 1.234,56". Limita a 13 dígitos (até casa dos trilhões).
export function mascaraMoedaBR(raw: string): string {
  const dig = String(raw).replace(/\D/g, '').slice(0, 13);
  if (!dig) return '';
  return (Number(dig) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Texto mascarado (ou dígitos) → número em REAIS (string) para enviar à API. "" se vazio.
export function moedaParaNumero(masked: string): string {
  const dig = String(masked).replace(/\D/g, '');
  if (!dig) return '';
  return String(Number(dig) / 100);
}

// Número em REAIS (ex.: vindo da URL "1000.5") → texto mascarado "R$ 1.000,50".
export function reaisParaMascara(v: string | number | null | undefined): string {
  if (v === null || v === undefined || v === '') return '';
  const n = Number(v);
  if (!isFinite(n)) return '';
  return mascaraMoedaBR(String(Math.round(n * 100)));
}

// Só dígitos, com limite de tamanho — para campos numéricos (ano, nº) e como barreira de
// entrada contra lixo/injeção no cliente (a proteção real é a query parametrizada no backend).
export function soDigitos(raw: string, max = 20): string {
  return String(raw).replace(/\D/g, '').slice(0, max);
}

export function dataHora(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function data(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Códigos de status do leilão (GUIA §6.4).
export const STATUS_LEILAO: Record<number, string> = {
  0: 'Rascunho', 1: 'Em breve', 2: 'Em loteamento', 3: 'Aberto para lances',
  4: 'Em leilão (ao vivo)', 13: 'Suspenso', 96: 'Cancelado', 97: 'Adiado', 98: 'Suspenso', 99: 'Encerrado',
};

// Códigos de status do lote.
export const STATUS_LOTE: Record<number, string> = {
  0: 'Rascunho', 1: 'Aberto', 2: 'Em leilão', 5: 'Homologando', 7: 'Condicional',
  8: 'Sem licitantes', 9: 'Baixa oferta', 10: 'Retirado', 11: 'Cancelado', 12: 'Prejudicado',
  13: 'Suspenso', 31: 'Repasse', 100: 'Vendido',
};

export const TIPO_LEILAO: Record<number, string> = { 1: 'Online', 2: 'Presencial', 3: 'Simultâneo' };

// Cor do badge por status (Tailwind classes).
export function corStatusLeilao(status: number): string {
  if (status === 3 || status === 4) return 'bg-green-100 text-green-800';
  if (status === 1 || status === 2) return 'bg-blue-100 text-blue-800';
  if (status === 99) return 'bg-gray-200 text-gray-700';
  return 'bg-amber-100 text-amber-800';
}

export function corStatusLote(status: number): string {
  if (status === 100) return 'bg-green-600 text-white';
  if (status === 1 || status === 2) return 'bg-green-100 text-green-800';
  if (status === 8 || status === 9) return 'bg-amber-100 text-amber-800';
  if ([10, 11, 12, 13].includes(status)) return 'bg-gray-200 text-gray-600';
  return 'bg-gray-100 text-gray-700';
}

// Leilão aceita lance? (status 3=aberto ou 4=em leilão)
export const leilaoPermiteLance = (status: number) => status === 3 || status === 4;

const TZ = 'America/Sao_Paulo';

export function hora(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' });
}

export function horaSeg(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('pt-BR', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export function mascararApelido(apelido: string | null | undefined): string {
  const s = (apelido || '').trim();
  if (!s) return 'Licitante';
  if (s.length <= 2) return s;
  return s.slice(0, 2) + '*'.repeat(s.length - 2);
}

export const leilaoEncerrado = (status: number) => status === 99;

export function dataNoPassado(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const ms = new Date(iso).getTime();
  return !isNaN(ms) && ms - Date.now() <= 0;
}

export type ModoPrazo = 'contador' | 'data' | 'sem_data';

// Decide contador vs data vs sem-data para o prazo do leilão (mesma regra do kleiloes-v2).
export function prazoLeilao(status: number, ate?: string | null): { modo: ModoPrazo; rotulo: string } {
  if (leilaoEncerrado(status)) {
    return ate ? { modo: 'data', rotulo: 'Realizado em' } : { modo: 'sem_data', rotulo: 'Leilão realizado' };
  }
  if (!ate) return { modo: 'sem_data', rotulo: 'Data a confirmar' };
  if (dataNoPassado(ate)) return { modo: 'data', rotulo: 'Data prevista' };
  return { modo: 'contador', rotulo: status === 1 || status === 2 ? 'Inicia em' : 'Encerra em' };
}

// `leilao.local` vem como STRING em alguns tenants e como OBJETO {cidade,uf,...} em outros.
export function textoLocal(loc: unknown): string {
  if (!loc) return '';
  if (typeof loc === 'string') return loc;
  const o = loc as Record<string, string | null>;
  return [o.cidade, o.uf].filter(Boolean).join(' - ');
}
