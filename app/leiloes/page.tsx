import Link from 'next/link';
import FiltroBarLeilao from '@/components/FiltroBarLeilao';
import LeilaoCard from '@/components/LeilaoCard';
import Paginacao from '@/components/Paginacao';
import { Erro } from '@/components/Estados';
import { getLeiloes, getSiteConfig } from '@/lib/api';
import type { Leilao, SiteConfig } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Leilões', description: 'Todos os leilões judiciais e extrajudiciais de imóveis, veículos e máquinas.', alternates: { canonical: '/leiloes' } };

type SP = Record<string, string | undefined>;

// Mapeia os filtros amigáveis da UI pros params reais da API /leiloes.
function paramsFromSearch(sp: SP) {
  const p: Record<string, string | number | boolean | undefined> = {
    page: sp.page ? Number(sp.page) : 1,
    limit: 15,
    search: sp.search,
    ano: sp.ano,
    sortBy: sp.sortBy || 'dataProximoLeilao',
  };
  if (sp.situacao === 'andamento') p.status = '3,4';
  else if (sp.situacao === 'proximos') { p.status = '1,2'; p.order = 'asc'; }
  else if (sp.situacao === 'encerrados') p.status = '99';
  if (sp.natureza === 'judicial') p.judicial = true;
  else if (sp.natureza === 'extrajudicial') p.extrajudicial = true;
  else if (sp.natureza === 'vendaDireta') p.vendaDireta = true;
  return p;
}

export default async function LeiloesPage(props: { searchParams: Promise<SP> }) {
  const searchParams = await props.searchParams;
  const params = paramsFromSearch(searchParams);
  const safe = async <T,>(p: Promise<T>, fb: T) => { try { return await p; } catch { return fb; } };
  let data: { result: Leilao[]; total: number; page: number; pages: number } | null = null;
  let erro: string | null = null;
  try { data = await getLeiloes(params); } catch (e) { erro = (e as Error).message; }
  const config = await safe(getSiteConfig(), null as SiteConfig | null);
  const features = config?.features;

  const makeHref = (pg: number) => {
    const q = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => { if (v) q.set(k, String(v)); });
    q.set('page', String(pg));
    return `/leiloes?${q.toString()}`;
  };

  const total = data?.total ?? 0;

  return (
    <main>
      {/* Hero navy (mesmo shell da página do leilão) */}
      <section className="lei-page-hero">
        <div className="lei-page-hero__glow" />
        <div className="lei-page-hero__in">
          <div className="lei-page-hero__crumb"><Link href="/">Início</Link> › Leilões</div>
          <div className="lei-page-hero__row">
            <div>
              <h1 className="lei-page-hero__title">Leilões</h1>
              <p className="lei-page-hero__lead">Imóveis, veículos e máquinas em leilões judiciais e extrajudiciais.</p>
            </div>
            <div className="lei-page-hero__stats">
              <div>
                <div className="lei-page-hero__num" style={{ color: 'var(--brand-accent)' }}>{total}</div>
                <div className="lei-page-hero__cap">{total === 1 ? 'leilão disponível' : 'leilões disponíveis'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="lei-ev-body">
        <FiltroBarLeilao total={total} />

        {erro ? (
          <Erro mensagem={erro} />
        ) : !data || data.result.length === 0 ? (
          <div className="lei-empty">
            <div className="lei-empty__ico">
              <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="#A8874B" strokeWidth="1.7"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
            </div>
            <h3>Nenhum leilão encontrado</h3>
            <p>Ajuste os filtros e tente novamente.</p>
            <Link href="/leiloes" className="lei-btn lei-btn--primary" style={{ borderRadius: 999, padding: '14px 30px' }}>Limpar filtros</Link>
          </div>
        ) : (
          <>
            <div className="lei-grid-leiloes">
              {data.result.map((l) => <LeilaoCard key={l.id} leilao={l} features={features} />)}
            </div>
            <Paginacao page={data.page} pages={data.pages} makeHref={makeHref} />
          </>
        )}
      </section>
    </main>
  );
}
