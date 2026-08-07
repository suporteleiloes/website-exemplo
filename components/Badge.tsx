import { corStatusLeilao, corStatusLote } from '@/lib/format';

/**
 * Badges de status de leilão e de lote.
 *
 * ⛔ O STATUS MANDA, A DATA NÃO. Estes badges refletem EXCLUSIVAMENTE o `status`
 * (e o `statusLabel`) que a API devolve. Não derive "Encerrado" comparando a data
 * do pregão com `Date.now()`: leilão aberto com data prevista vencida continua
 * ABERTO. A regra completa (e o bug que a originou) está em `lib/format.ts`.
 */

export function BadgeLeilao({ status, label }: { status: number; label?: string }) {
  return <span className={`badge ${corStatusLeilao(status)}`}>{label || status}</span>;
}

export function BadgeLote({ status, label }: { status: number; label?: string }) {
  return <span className={`badge ${corStatusLote(status)}`}>{label || status}</span>;
}
