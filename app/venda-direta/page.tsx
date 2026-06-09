import Link from 'next/link';
import EventoCard from '@/components/vd/EventoCard';
import AnuncioCard from '@/components/vd/AnuncioCard';
import { Vazio, Erro } from '@/components/Estados';
import { getEventos, getAnuncios, type Evento, type Anuncio } from '@/lib/vd';

export const dynamic = 'force-dynamic';

type SP = Record<string, string | undefined>;

// Vitrine da VENDA DIRETA: eventos recebendo ofertas + anúncios em destaque.
export default async function VendaDiretaPage({ searchParams }: { searchParams: SP }) {
  const situacao = searchParams.situacao || 'recebendo';
  let eventos: Evento[] = [];
  let destaques: Anuncio[] = [];
  let erro: string | null = null;
  try {
    const [ev, an] = await Promise.all([
      getEventos({ situacao, limit: 12 }),
      getAnuncios({ destaque: true, limit: 8 }),
    ]);
    eventos = ev.result;
    destaques = an.result;
  } catch (e) { erro = (e as Error).message; }

  const filtroLink = (s: string, label: string) => (
    <Link href={`/venda-direta?situacao=${s}`}
      className={`badge ${situacao === s ? 'bg-marca text-white' : 'bg-gray-100 text-gray-600'}`}>{label}</Link>
  );

  return (
    <div className="container-page space-y-8">
      <section className="rounded-xl bg-gradient-to-r from-marca to-destaque p-6 text-white">
        <h1 className="text-2xl font-bold">Venda Direta</h1>
        <p className="mt-1 text-sm opacity-90">Compre direto, faça uma oferta ou envie sua proposta. Sem disputa de auditório.</p>
      </section>

      {erro ? <Erro mensagem={erro} /> : (
        <>
          {destaques.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-bold text-gray-800">Em destaque</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {destaques.map((a) => <AnuncioCard key={a.id} anuncio={a} />)}
              </div>
            </section>
          )}

          <section>
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-bold text-gray-800">Eventos</h2>
              <div className="ml-auto flex gap-2">
                {filtroLink('recebendo', 'Recebendo ofertas')}
                {filtroLink('em-breve', 'Em breve')}
                {filtroLink('encerrados', 'Encerrados')}
              </div>
            </div>
            {eventos.length === 0 ? (
              <Vazio titulo="Nenhum evento encontrado" descricao="Ajuste o filtro acima." />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {eventos.map((ev) => <EventoCard key={ev.id} evento={ev} />)}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
