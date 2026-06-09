import Link from 'next/link';
import type { Leilao } from '@/lib/types';
import { dataHora, TIPO_LEILAO } from '@/lib/format';
import { BadgeLeilao } from './Badge';
import { fotoLeilao, PLACEHOLDER } from '@/lib/img';

export default function LeilaoCard({ leilao }: { leilao: Leilao }) {
  const tipo = leilao.tipo ? TIPO_LEILAO[leilao.tipo] : leilao.tipoLabel;
  return (
    <Link href={`/leilao/${leilao.slug || leilao.id}`} className="card flex flex-col">
      <div className="relative h-40 w-full bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={fotoLeilao(leilao) || PLACEHOLDER} alt={leilao.titulo || ''} className="h-full w-full object-cover" loading="lazy" />
        <span className="absolute left-2 top-2"><BadgeLeilao status={leilao.status} label={leilao.statusLabel} /></span>
        {leilao.judicial && <span className="badge absolute right-2 top-2 bg-marca-2 text-white">Judicial</span>}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-2 text-sm font-semibold text-gray-800">{leilao.titulo}</p>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500">
          {tipo && <span>{tipo}</span>}
          {leilao.totalLotes != null && <span>{leilao.totalLotes} lotes</span>}
        </div>
        <p className="mt-auto pt-2 text-xs text-gray-600">
          {leilao.dataProximoLeilao ? `Próx.: ${dataHora(leilao.dataProximoLeilao)}` : ''}
        </p>
      </div>
    </Link>
  );
}
