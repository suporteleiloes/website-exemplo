import Link from 'next/link';
import { moeda } from '@/lib/format';
import { fotoBem, PLACEHOLDER } from '@/lib/img';
import { corStatusAnuncio, type Anuncio } from '@/lib/vd';

// Card de ANÚNCIO de venda direta. Mostra o preço pretendido e as modalidades aceitas.
export default function AnuncioCard({ anuncio }: { anuncio: Anuncio }) {
  const bem = anuncio.bem;
  const titulo = anuncio.titulo || bem?.siteTitulo || 'Anúncio';
  const local = bem?.localizacao ? [bem.localizacao.cidade, bem.localizacao.uf].filter(Boolean).join('/') : null;
  const m = anuncio.modos;

  return (
    <Link href={`/venda-direta/anuncio/${anuncio.slug || anuncio.id}`} className="card flex flex-col">
      <div className="relative h-44 w-full bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={fotoBem(bem) || PLACEHOLDER} alt={titulo} className="h-full w-full object-cover" loading="lazy" />
        <span className={`badge absolute left-2 top-2 ${corStatusAnuncio(anuncio.status)}`}>{anuncio.statusLabel}</span>
        {m.compraDireta && <span className="badge absolute right-2 top-2 bg-destaque text-white">Compre Já</span>}
      </div>
      <div className="flex flex-1 flex-col p-3">
        {local && <p className="text-xs text-gray-500">{local}</p>}
        <p className="mt-1 line-clamp-2 text-sm font-semibold text-gray-800">{titulo}</p>
        <div className="mt-auto pt-2">
          <p className="text-xs text-gray-500">Preço pretendido</p>
          <p className="text-lg font-bold text-marca">{moeda(anuncio.precoMinimo)}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {m.oferta && <span className="badge bg-green-50 text-green-700">Aceita oferta</span>}
            {m.proposta && <span className="badge bg-blue-50 text-blue-700">Aceita proposta</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}
