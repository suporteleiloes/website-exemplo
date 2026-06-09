import Link from 'next/link';
import { notFound } from 'next/navigation';
import Galeria from '@/components/Galeria';
import ParticipacaoBox from '@/components/vd/ParticipacaoBox';
import { getSessionUser } from '@/lib/auth';
import { getAnuncio, corStatusAnuncio } from '@/lib/vd';
import { ApiException } from '@/lib/api';
import { moeda } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AnuncioPage({ params }: { params: { idOrSlug: string } }) {
  let anuncio;
  try { anuncio = await getAnuncio(params.idOrSlug); }
  catch (e) { if (e instanceof ApiException && e.status === 404) notFound(); throw e; }

  const user = await getSessionUser().catch(() => null);
  const bem = anuncio.bem;
  const evento: any = anuncio.evento;
  const titulo = anuncio.titulo || bem?.siteTitulo || 'Anúncio';
  const loc = bem?.localizacao;
  const veic = bem?.veiculo;

  // Evento recebendo (status 3/4) e não vendido → pode participar.
  const eventoAtivo = evento ? (evento.status === 3 || evento.status === 4) : true;
  const podeParticipar = eventoAtivo && anuncio.status !== 100;

  const specs: { k: string; v: string }[] = [
    { k: 'Preço pretendido', v: moeda(anuncio.precoMinimo) },
    { k: 'Avaliação', v: moeda(anuncio.precoAvaliacao) },
    { k: 'Situação', v: anuncio.statusLabel },
  ];
  if (loc) specs.push({ k: 'Localização', v: [loc.cidade, loc.uf].filter(Boolean).join('/') || '—' });
  if (veic?.placa) specs.push({ k: 'Placa', v: veic.placa });
  if (veic?.anoModelo || veic?.anoFabricacao) specs.push({ k: 'Ano', v: [veic.anoFabricacao, veic.anoModelo].filter(Boolean).join('/') });

  return (
    <div className="container-page">
      <nav className="mb-3 text-sm text-gray-500">
        <Link href="/venda-direta" className="hover:text-marca">Venda Direta</Link>
        {evento?.slug && <> › <Link href={`/venda-direta/evento/${evento.slug || evento.id}`} className="hover:text-marca">{evento.titulo}</Link></>}
      </nav>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div><Galeria fotos={bem?.fotos || []} alt={titulo} /></div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <span className={`badge ${corStatusAnuncio(anuncio.status)}`}>{anuncio.statusLabel}</span>
              {anuncio.modos.compraDireta && <span className="badge bg-destaque text-white">Compre Já</span>}
            </div>
            <h1 className="mt-2 text-2xl font-bold text-gray-800">{titulo}</h1>
            {bem?.siteSubtitulo && <p className="text-gray-600">{bem.siteSubtitulo}</p>}
          </div>

          <ParticipacaoBox
            anuncioId={anuncio.id}
            precoMinimo={anuncio.precoMinimo}
            ofertaAtual={anuncio.ofertaAtual}
            totalOfertas={anuncio.totalOfertas}
            incremento={anuncio.incremento}
            modos={anuncio.modos}
            podeParticipar={podeParticipar}
            vendido={anuncio.status === 100}
            logado={!!user}
          />

          <dl className="grid grid-cols-2 gap-3 rounded-lg border border-gray-200 bg-white p-4 text-sm">
            {specs.map((s) => (
              <div key={s.k}><dt className="text-gray-400">{s.k}</dt><dd className="font-semibold text-gray-800">{s.v}</dd></div>
            ))}
          </dl>
        </div>
      </div>

      {(bem?.siteDescricao || anuncio.descricao) && (
        <section className="mt-6 rounded-lg border border-gray-200 bg-white p-5">
          <h2 className="mb-2 text-lg font-bold text-gray-800">Descrição</h2>
          <p className="whitespace-pre-line text-sm text-gray-600">{bem?.siteDescricao || anuncio.descricao}</p>
        </section>
      )}
    </div>
  );
}
