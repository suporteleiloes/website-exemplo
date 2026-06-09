import FiltrosLeiloes from '@/components/FiltrosLeiloes';
import LeilaoCard from '@/components/LeilaoCard';
import Paginacao from '@/components/Paginacao';
import { Vazio, Erro } from '@/components/Estados';
import { getLeiloes } from '@/lib/api';
import type { Leilao } from '@/lib/types';

export const dynamic = 'force-dynamic';

type SP = Record<string, string | undefined>;

// Mapeia os filtros amigáveis da UI pros params reais da API /leiloes.
function paramsFromSearch(sp: SP) {
  const p: Record<string, string | number | boolean | undefined> = {
    page: sp.page ? Number(sp.page) : 1,
    limit: 16,
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

export default async function LeiloesPage({ searchParams }: { searchParams: SP }) {
  const params = paramsFromSearch(searchParams);
  let data: { result: Leilao[]; total: number; page: number; pages: number } | null = null;
  let erro: string | null = null;
  try { data = await getLeiloes(params); } catch (e) { erro = (e as Error).message; }

  const makeHref = (pg: number) => {
    const q = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => { if (v) q.set(k, String(v)); });
    q.set('page', String(pg));
    return `/leiloes?${q.toString()}`;
  };

  return (
    <div className="container-page">
      <h1 className="mb-4 text-2xl font-bold text-gray-800">Leilões</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <aside><FiltrosLeiloes /></aside>
        <div>
          {erro ? (
            <Erro mensagem={erro} />
          ) : !data || data.result.length === 0 ? (
            <Vazio titulo="Nenhum leilão encontrado" descricao="Ajuste os filtros e tente novamente." />
          ) : (
            <>
              <p className="mb-3 text-sm text-gray-500">{data.total} leilão(ões) encontrados</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {data.result.map((l) => <LeilaoCard key={l.id} leilao={l} />)}
              </div>
              <Paginacao page={data.page} pages={data.pages} makeHref={makeHref} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
