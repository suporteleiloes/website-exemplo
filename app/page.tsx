import Link from 'next/link';
import Banner from '@/components/Banner';
import Popup from '@/components/Popup';
import Categorias from '@/components/Categorias';
import LeilaoCard from '@/components/LeilaoCard';
import LoteCard from '@/components/LoteCard';
import { Vazio } from '@/components/Estados';
import { getBanners, getFiltros, getLeiloes, getLotes } from '@/lib/api';
import type { Banner as TBanner, Filtros, Leilao, Lote } from '@/lib/types';

export const dynamic = 'force-dynamic'; // catálogo sempre ao vivo (sem prerender no build)

async function safe<T>(p: Promise<T>, fb: T): Promise<T> { try { return await p; } catch { return fb; } }

function Secao({ titulo, href, children }: { titulo: string; href?: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">{titulo}</h2>
        {href && <Link href={href} className="text-sm font-medium text-marca hover:underline">Ver todos →</Link>}
      </div>
      {children}
    </section>
  );
}

export default async function Home() {
  const emptyP = { result: [], total: 0, page: 1, limit: 0, pages: 0 };
  const [bannersHome, bannersPopup, filtros, andamento, proximos, lotesDestaque] = await Promise.all([
    safe(getBanners('home').then((d) => d.result), [] as TBanner[]),
    safe(getBanners('popup').then((d) => d.result), [] as TBanner[]),
    safe(getFiltros(), { categorias: [], subcategorias: [], ufs: [], cidades: [], bairros: [], comitentes: [] } as Filtros),
    safe(getLeiloes({ status: '3,4', limit: 8 }), emptyP as any),
    safe(getLeiloes({ status: '1,2', limit: 8, sortBy: 'dataProximoLeilao', order: 'asc' }), emptyP as any),
    safe(getLotes({ destaque: true, somenteAtivos: true, limit: 8 }), emptyP as any),
  ]);

  const leiloesAndamento: Leilao[] = andamento.result;
  const leiloesProximos: Leilao[] = proximos.result;
  const destaques: Lote[] = lotesDestaque.result;

  return (
    <div className="container-page">
      <Popup banners={bannersPopup} />
      <Banner banners={bannersHome} />

      {filtros.categorias.length > 0 && (
        <Secao titulo="Categorias">
          <Categorias categorias={filtros.categorias} />
        </Secao>
      )}

      <Secao titulo="Leilões em andamento" href="/leiloes?situacao=andamento">
        {leiloesAndamento.length === 0 ? (
          <Vazio titulo="Nenhum leilão em andamento" descricao="Confira os próximos leilões abaixo." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {leiloesAndamento.map((l) => <LeilaoCard key={l.id} leilao={l} />)}
          </div>
        )}
      </Secao>

      <Secao titulo="Próximos leilões" href="/leiloes?situacao=proximos">
        {leiloesProximos.length === 0 ? (
          <Vazio titulo="Sem leilões agendados" />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {leiloesProximos.map((l) => <LeilaoCard key={l.id} leilao={l} />)}
          </div>
        )}
      </Secao>

      <Secao titulo="Lotes em destaque" href="/leiloes">
        {destaques.length === 0 ? (
          <Vazio titulo="Nenhum lote em destaque no momento" />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {destaques.map((lt) => <LoteCard key={lt.id} lote={lt} />)}
          </div>
        )}
      </Secao>

      {/* Chamadas institucionais */}
      <section className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { t: 'Como participar', d: 'Cadastre-se, habilite-se no leilão e dê seu lance online.', h: '/leiloes' },
          { t: 'Leilões judiciais', d: 'Oportunidades de bens em processos judiciais.', h: '/leiloes?natureza=judicial' },
          { t: 'Venda direta', d: 'Compre direto pelo valor anunciado.', h: '/leiloes?natureza=vendaDireta' },
        ].map((c) => (
          <Link key={c.t} href={c.h} className="card p-5">
            <p className="font-semibold text-gray-800">{c.t}</p>
            <p className="mt-1 text-sm text-gray-500">{c.d}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
