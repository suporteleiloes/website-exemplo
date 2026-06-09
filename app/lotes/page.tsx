import FiltrosLotes from '@/components/FiltrosLotes';
import LoteCard from '@/components/LoteCard';
import Paginacao from '@/components/Paginacao';
import { Vazio, Erro } from '@/components/Estados';
import { getLotes, getFiltros } from '@/lib/api';
import type { Filtros, Lote } from '@/lib/types';

export const dynamic = 'force-dynamic';

type SP = Record<string, string | undefined>;

// Busca GLOBAL de lotes (todos os leilões) — usa os filtros ricos de /lotes.
export default async function LotesPage({ searchParams }: { searchParams: SP }) {
  const params: Record<string, string | number | undefined> = {
    limit: 16, page: searchParams.page ? Number(searchParams.page) : 1, somenteAtivos: 'true' as any,
    search: searchParams.search, categoria: searchParams.categoria, subcategoria: searchParams.subcategoria,
    uf: searchParams.uf, cidade: searchParams.cidade, comitente: searchParams.comitente,
    valorMinimo: searchParams.valorMinimo, valorMaximo: searchParams.valorMaximo, sortBy: searchParams.sortBy || 'maisVistos',
  };

  const safe = async <T,>(p: Promise<T>, fb: T) => { try { return await p; } catch { return fb; } };
  const [data, filtros] = await Promise.all([
    safe(getLotes(params).then((d) => ({ ...d, erro: null as string | null })), null as any),
    safe(getFiltros(), { categorias: [], subcategorias: [], ufs: [], cidades: [], bairros: [], comitentes: [] } as Filtros),
  ]);

  const makeHref = (pg: number) => {
    const q = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => { if (v) q.set(k, String(v)); });
    q.set('page', String(pg));
    return `/lotes?${q.toString()}`;
  };

  const lista: Lote[] = data?.result || [];

  return (
    <div className="container-page">
      <h1 className="mb-4 text-2xl font-bold text-gray-800">Buscar lotes</h1>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <aside><FiltrosLotes filtros={filtros} /></aside>
        <div>
          {!data ? (
            <Erro mensagem="Não foi possível carregar os lotes." />
          ) : lista.length === 0 ? (
            <Vazio titulo="Nenhum lote encontrado" descricao="Ajuste os filtros e tente novamente." />
          ) : (
            <>
              <p className="mb-3 text-sm text-gray-500">{data.total} lote(s) encontrados</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {lista.map((lt) => <LoteCard key={lt.id} lote={lt} />)}
              </div>
              <Paginacao page={data.page} pages={data.pages} makeHref={makeHref} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
