// Helpers de formatação e rótulos de status (ver GUIA-WEBSITE-V2 §6.4).

export function moeda(v: number | null | undefined): string {
  if (v === null || v === undefined) return '—';
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
  0: 'Rascunho', 1: 'Aberto', 2: 'Em pregão', 5: 'Homologando', 7: 'Condicional',
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
