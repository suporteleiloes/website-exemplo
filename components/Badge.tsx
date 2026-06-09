import { corStatusLeilao, corStatusLote } from '@/lib/format';

export function BadgeLeilao({ status, label }: { status: number; label?: string }) {
  return <span className={`badge ${corStatusLeilao(status)}`}>{label || status}</span>;
}

export function BadgeLote({ status, label }: { status: number; label?: string }) {
  return <span className={`badge ${corStatusLote(status)}`}>{label || status}</span>;
}
