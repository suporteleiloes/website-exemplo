import Link from 'next/link';
import { notFound } from 'next/navigation';
import FiltrosLotes from '@/components/FiltrosLotes';
import LoteCard from '@/components/LoteCard';
import Paginacao from '@/components/Paginacao';
import HabilitacaoBtn from '@/components/HabilitacaoBtn';
import { BadgeLeilao } from '@/components/Badge';
import { Vazio } from '@/components/Estados';
import { getLeilao, getLotes, getFiltros } from '@/lib/api';
import { ApiException } from '@/lib/api';
import { getSessionUser } from '@/lib/auth';
import { dataHora, TIPO_LEILAO, leilaoPermiteLance } from '@/lib/format';
import type { Filtros, Leilao, Lote } from '@/lib/types';

export const dynamic = 'force-dynamic';

type SP = Record<string, string | undefined>;

export default async function LeilaoPage({ params, searchParams }: { params: { idOrSlug: string }; searchParams: SP }) {
  let leilao: Leilao;
  try { leilao = await getLeilao(params.idOrSlug); }
  catch (e) { if (e instanceof ApiException && e.status === 404) notFound(); throw e; }

  const loteParams: Record<string, string | number | undefined> = {
    leilao: leilao.id, limit: 12, page: searchParams.page ? Number(searchParams.page) : 1,
    search: searchParams.search, categoria: searchParams.categoria, subcategoria: searchParams.subcategoria,
    uf: searchParams.uf, cidade: searchParams.cidade, comitente: searchParams.comitente,
    valorMinimo: searchParams.valorMinimo, valorMaximo: searchParams.valorMaximo, sortBy: searchParams.sortBy || 'numero',
  };

  const safe = async <T,>(p: Promise<T>, fb: T) => { try { return await p; } catch { return fb; } };
  const empty = { result: [], total: 0, page: 1, limit: 12, pages: 0 };
  const [lotes, filtros, user] = await Promise.all([
    safe(getLotes(loteParams), empty as any),
    safe(getFiltros({ leilao: leilao.id }), { categorias: [], subcategorias: [], ufs: [], cidades: [], bairros: [], comitentes: [] } as Filtros),
    getSessionUser().catch(() => null),
  ]);
  const lista: Lote[] = lotes.result;

  const makeHref = (pg: number) => {
    const q = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => { if (v) q.set(k, String(v)); });
    q.set('page', String(pg));
    return `/leilao/${params.idOrSlug}?${q.toString()}`;
  };

  const tipo = leilao.tipo ? TIPO_LEILAO[leilao.tipo] : leilao.tipoLabel;
  const datas = [leilao.data1, leilao.data2, leilao.data3].filter(Boolean) as string[];

  return (
    <div className="container-page">
      {/* Cabeçalho */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="flex flex-wrap items-center gap-2">
          <BadgeLeilao status={leilao.status} label={leilao.statusLabel} />
          {leilao.judicial && <span className="badge bg-marca-2 text-white">Judicial</span>}
          {leilao.vendaDireta && <span className="badge bg-destaque text-white">Venda direta</span>}
          {tipo && <span className="badge bg-gray-100 text-gray-700">{tipo}</span>}
        </div>
        <h1 className="mt-2 text-2xl font-bold text-gray-800">{leilao.titulo}</h1>
        {leilao.descricao && <p className="mt-2 whitespace-pre-line text-sm text-gray-600">{leilao.descricao}</p>}

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">Datas dos pregões</p>
            {datas.length ? datas.map((d, i) => <p key={i} className="text-sm text-gray-700">{i + 1}ª praça: {dataHora(d)}</p>) : <p className="text-sm text-gray-500">—</p>}
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">Local / modalidade</p>
            <p className="text-sm text-gray-700">{leilao.local || (tipo === 'Online' ? '100% Online' : tipo || '—')}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase text-gray-400">Leiloeiro</p>
            <p className="text-sm text-gray-700">{leilao.leiloeiro?.nome || '—'}</p>
            {leilao.leiloeiro?.matricula && <p className="text-xs text-gray-500">{leilao.leiloeiro.matricula}</p>}
          </div>
        </div>

        {(leilao.infoVisitacao || leilao.infoPagamento || leilao.infoRetirada) && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {leilao.infoVisitacao && <Info titulo="Visitação" texto={leilao.infoVisitacao} />}
            {leilao.infoPagamento && <Info titulo="Pagamento" texto={leilao.infoPagamento} />}
            {leilao.infoRetirada && <Info titulo="Retirada" texto={leilao.infoRetirada} />}
          </div>
        )}

        {leilao.comitentes && leilao.comitentes.length > 0 && (
          <p className="mt-4 text-sm text-gray-600"><span className="font-semibold">Comitente(s):</span> {leilao.comitentes.map((c) => c.nome).join(', ')}</p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          {leilao._urls?.edital && <a href={leilao._urls.edital} target="_blank" className="btn-outline">📄 Edital</a>}
          {leilao._urls?.auditorio && <a href={leilao._urls.auditorio} target="_blank" className="btn-outline">▶ Auditório ao vivo</a>}
        </div>

        {/* Habilitação */}
        <div className="mt-5 max-w-md rounded-lg bg-gray-50 p-4">
          <p className="mb-2 text-sm font-semibold text-gray-700">Participar deste leilão</p>
          <HabilitacaoBtn leilaoId={leilao.id} logado={!!user} />
        </div>
      </div>

      {/* Lotes */}
      <h2 className="mb-3 mt-8 text-xl font-bold text-gray-800">Lotes {leilao.totalLotes != null ? `(${leilao.totalLotes})` : ''}</h2>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <aside><FiltrosLotes filtros={filtros} /></aside>
        <div>
          {lista.length === 0 ? (
            <Vazio titulo="Nenhum lote encontrado" descricao="Ajuste os filtros." />
          ) : (
            <>
              <p className="mb-3 text-sm text-gray-500">{lotes.total} lote(s)</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {lista.map((lt) => <LoteCard key={lt.id} lote={lt} />)}
              </div>
              <Paginacao page={lotes.page} pages={lotes.pages} makeHref={makeHref} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Info({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded bg-gray-50 p-3">
      <p className="text-xs font-semibold uppercase text-gray-400">{titulo}</p>
      <p className="whitespace-pre-line text-sm text-gray-700">{texto}</p>
    </div>
  );
}
