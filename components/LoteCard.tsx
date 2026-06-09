import Link from 'next/link';
import type { Lote } from '@/lib/types';
import { moeda } from '@/lib/format';
import { BadgeLote } from './Badge';
import { fotoBem, PLACEHOLDER } from '@/lib/img';

export default function LoteCard({ lote }: { lote: Lote }) {
  const bem = lote.bem;
  const titulo = bem?.siteTitulo || lote.descricao || `Lote ${lote.numeroString || lote.numero}`;
  const valor = lote.valorLanceAtual ?? lote.valorInicial;
  const local = bem?.localizacao ? [bem.localizacao.cidade, bem.localizacao.uf].filter(Boolean).join('/') : null;

  return (
    <Link href={`/lote/${lote.slug || lote.id}`} className="card flex flex-col">
      <div className="relative h-44 w-full bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={fotoBem(bem) || PLACEHOLDER} alt={titulo} className="h-full w-full object-cover" loading="lazy" />
        <span className="absolute left-2 top-2"><BadgeLote status={lote.status} label={lote.statusLabel} /></span>
        {lote.destaque && <span className="badge absolute right-2 top-2 bg-destaque text-white">Destaque</span>}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="text-xs text-gray-500">Lote {lote.numeroString || lote.numero}{local ? ` · ${local}` : ''}</p>
        <p className="mt-1 line-clamp-2 text-sm font-semibold text-gray-800">{titulo}</p>
        <div className="mt-auto pt-2">
          <p className="text-xs text-gray-500">{lote.valorLanceAtual ? 'Lance atual' : 'Lance inicial'}</p>
          <p className="text-lg font-bold text-marca">{moeda(valor)}</p>
          {(lote.totalLances ?? 0) > 0 && <p className="text-xs text-gray-500">{lote.totalLances} lance(s)</p>}
        </div>
      </div>
    </Link>
  );
}
