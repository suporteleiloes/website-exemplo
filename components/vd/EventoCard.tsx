import Link from 'next/link';
import { urlImagem } from '@/lib/img';
import { data } from '@/lib/format';
import { corStatusEvento, type Evento } from '@/lib/vd';

// Card de EVENTO de venda direta (sem vocabulário de leilão).
export default function EventoCard({ evento }: { evento: Evento }) {
  const img = urlImagem(evento.image, 'min');
  return (
    <Link href={`/venda-direta/evento/${evento.slug || evento.id}`} className="card flex flex-col">
      <div className="relative h-40 w-full bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {img && <img src={img} alt={evento.titulo || ''} className="h-full w-full object-cover" loading="lazy" />}
        <span className={`badge absolute left-2 top-2 ${corStatusEvento(evento.status)}`}>{evento.statusLabel}</span>
        {evento.privado && <span className="badge absolute right-2 top-2 bg-purple-100 text-purple-800">Privado</span>}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="text-xs text-gray-500">{evento.codigo ? `Evento ${evento.codigo}` : 'Venda direta'}</p>
        <p className="mt-1 line-clamp-2 text-sm font-semibold text-gray-800">{evento.titulo}</p>
        <div className="mt-auto pt-2 text-xs text-gray-500">
          <p>{evento.totalAnuncios ?? 0} anúncio(s)</p>
          {evento.dataLimitePropostas && <p>Aceita até {data(evento.dataLimitePropostas)}</p>}
        </div>
      </div>
    </Link>
  );
}
