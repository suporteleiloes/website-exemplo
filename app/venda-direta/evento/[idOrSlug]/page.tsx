import { notFound } from 'next/navigation';
import AnuncioCard from '@/components/vd/AnuncioCard';
import { Vazio, Erro } from '@/components/Estados';
import { data } from '@/lib/format';
import { urlImagem } from '@/lib/img';
import { getEvento, getAnuncios, corStatusEvento, type Anuncio } from '@/lib/vd';
import { ApiException } from '@/lib/api';

export const dynamic = 'force-dynamic';

export default async function EventoPage({ params }: { params: { idOrSlug: string } }) {
  let evento;
  try {
    evento = await getEvento(params.idOrSlug);
  } catch (e) {
    if (e instanceof ApiException && e.status === 404) notFound();
    return <div className="container-page"><Erro mensagem={(e as Error).message} /></div>;
  }

  let anuncios: Anuncio[] = [];
  let total = 0;
  try {
    const r = await getAnuncios({ evento: evento.id, limit: 24 });
    anuncios = r.result;
    total = r.total;
  } catch { /* mostra evento mesmo sem anúncios */ }

  const img = urlImagem(evento.image, 'full');

  return (
    <div className="container-page space-y-6">
      <nav className="text-sm text-gray-500"><a href="/venda-direta" className="hover:text-marca">Venda Direta</a> › <span>{evento.titulo}</span></nav>

      <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={evento.titulo || ''} className="h-48 w-full object-cover" />
        )}
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`badge ${corStatusEvento(evento.status)}`}>{evento.statusLabel}</span>
            {evento.privado && <span className="badge bg-purple-100 text-purple-800">Evento privado</span>}
            {evento.codigo && <span className="text-xs text-gray-500">Evento {evento.codigo}</span>}
          </div>
          <h1 className="mt-2 text-2xl font-bold text-gray-800">{evento.titulo}</h1>
          {evento.descricao && <p className="mt-1 text-gray-600">{evento.descricao}</p>}

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div><dt className="text-gray-400">Anúncios</dt><dd className="font-semibold">{evento.totalAnuncios ?? total}</dd></div>
            {evento.dataLimitePropostas && <div><dt className="text-gray-400">Aceita até</dt><dd className="font-semibold">{data(evento.dataLimitePropostas)}</dd></div>}
            {evento.local && <div><dt className="text-gray-400">Local</dt><dd className="font-semibold">{evento.local}</dd></div>}
          </dl>

          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {evento.modos.compraDireta && <span className="badge bg-destaque/10 text-destaque">Compre Já</span>}
            {evento.modos.oferta && <span className="badge bg-green-50 text-green-700">Aceita ofertas</span>}
            {evento.modos.proposta && <span className="badge bg-blue-50 text-blue-700">Aceita propostas</span>}
          </div>

          {(evento.regras || evento._urls.regras) && (
            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
              {evento.regras && <p className="whitespace-pre-line">{evento.regras}</p>}
              {evento._urls.regras && <a href={evento._urls.regras} target="_blank" className="mt-2 inline-block font-medium text-marca">Ver regras de participação →</a>}
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-gray-800">Anúncios deste evento</h2>
        {anuncios.length === 0 ? (
          <Vazio titulo="Nenhum anúncio disponível" />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {anuncios.map((a) => <AnuncioCard key={a.id} anuncio={a} />)}
          </div>
        )}
      </section>
    </div>
  );
}
