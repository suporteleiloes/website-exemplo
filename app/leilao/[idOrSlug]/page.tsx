import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import FiltroBarLote from '@/components/FiltroBarLote';
import LoteCard from '@/components/LoteCard';
import Paginacao from '@/components/Paginacao';
import { getLeilao, getLotes, getFiltros, getLeilaoDocumentos, ApiException } from '@/lib/api';
import { getSessionUser } from '@/lib/auth';
import { TIPO_LEILAO, textoLocal } from '@/lib/format';
import { urlImagem, fotoLeilao } from '@/lib/img';
import { pageMeta } from '@/lib/seo';
import type { Metadata } from 'next';
import type { Filtros, Leilao, Lote, Imagem } from '@/lib/types';

// SEO por leilão: título = título do leilão; descrição com nº de lotes e modalidade.
export async function generateMetadata(props: { params: Promise<{ idOrSlug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const leilao = await getLeilao(params.idOrSlug).catch(() => null);
  if (!leilao) return { title: 'Leilão' };
  const cod = leilao.codigo || (leilao.numero ? `${leilao.numero}${leilao.ano ? '/' + leilao.ano : ''}` : '');
  const titulo = leilao.titulo || `Leilão ${cod}`;
  const nat = leilao.vendaDireta ? 'Venda direta' : leilao.judicial ? 'Leilão judicial' : 'Leilão extrajudicial';
  const desc = `${nat}${cod ? ` nº ${cod}` : ''}${leilao.totalLotes ? ` · ${leilao.totalLotes} lotes` : ''}. ${leilao.descricao || 'Participe online.'}`.trim();
  return pageMeta({ title: titulo, description: desc.slice(0, 300), path: `/leilao/${leilao.slug || leilao.id}`, image: fotoLeilao(leilao) });
}

type Aba = 'lotes' | 'documentos' | 'comitentes';
interface DocItem { nome?: string | null; tipo?: { nome?: string | null } | string | null; url?: string | null; info?: string | null }

// Iniciais do comitente pro "avatar" (ex.: "Banco do Brasil" → "BB").
function siglaDe(nome: string): string {
  const p = nome.trim().split(/\s+/).filter((w) => w.length > 2);
  return (p.slice(0, 2).map((w) => w[0]).join('') || nome.slice(0, 2)).toUpperCase();
}

export const dynamic = 'force-dynamic';

type SP = Record<string, string | undefined>;

// "12/09 · 14h00"
function dataCurta(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const dm = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  const hm = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
  return `${dm} · ${hm}`;
}

export default async function LeilaoPage(
  props: { params: Promise<{ idOrSlug: string }>; searchParams: Promise<SP> }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  let leilao: Leilao;
  try { leilao = await getLeilao(params.idOrSlug); }
  catch (e) { if (e instanceof ApiException && e.status === 404) notFound(); throw e; }

  const loteParams: Record<string, string | number | undefined> = {
    leilao: leilao.id, limit: 24, page: searchParams.page ? Number(searchParams.page) : 1,
    search: searchParams.search, categoria: searchParams.categoria, subcategoria: searchParams.subcategoria,
    uf: searchParams.uf, cidade: searchParams.cidade, comitente: searchParams.comitente, status: searchParams.status,
    valorMinimo: searchParams.valorMinimo, valorMaximo: searchParams.valorMaximo, sortBy: searchParams.sortBy || 'numero', order: 'asc',
  };

  const safe = async <T,>(p: Promise<T>, fb: T) => { try { return await p; } catch { return fb; } };
  const empty = { result: [], total: 0, page: 1, limit: 24, pages: 0 };
  const emptyFiltros = { categorias: [], subcategorias: [], ufs: [], cidades: [], bairros: [], comitentes: [] } as Filtros;

  const aba: Aba = searchParams.aba === 'documentos' ? 'documentos' : searchParams.aba === 'comitentes' ? 'comitentes' : 'lotes';
  // Só busca lotes/filtros na aba Lotes — nas abas Documentos/Comitentes é fetch desperdiçado
  // (era isso que deixava a troca de aba lenta em leilões com muitos lotes).
  const precisaLotes = aba === 'lotes';
  const [lotes, filtros, user] = await Promise.all([
    precisaLotes ? safe(getLotes(loteParams), empty as any) : Promise.resolve(empty as any),
    precisaLotes ? safe(getFiltros({ leilao: leilao.id }), emptyFiltros) : Promise.resolve(emptyFiltros),
    getSessionUser().catch(() => null),
  ]);
  const lista: Lote[] = lotes.result;

  // Leilão com um ÚNICO lote (e sem filtros/aba) abre direto a página do lote (regra do kleiloes).
  const semFiltro = !searchParams.aba && !searchParams.page && !searchParams.search && !searchParams.categoria
    && !searchParams.status && !searchParams.uf && !searchParams.cidade && !searchParams.comitente
    && !searchParams.valorMinimo && !searchParams.valorMaximo;
  if (precisaLotes && lotes.total === 1 && lista[0] && semFiltro) {
    redirect(`/lote/${lista[0].slug || lista[0].id}`);
  }

  // Comitentes vêm agregados dos lotes e repetem (mesmo nome, ids diferentes) — deduplica por
  // documento/nome (o que identifica o comitente de fato), não por id.
  const comitentesVistos = new Set<string>();
  const comitentes = (leilao.comitentes || []).filter((c) => {
    const co = c as { id?: number | string; documento?: string; nome?: string };
    const chave = String(co.documento || co.nome || co.id || Math.random()).trim().toLowerCase();
    if (comitentesVistos.has(chave)) return false;
    comitentesVistos.add(chave);
    return true;
  });
  const totalLotesLeilao = leilao.totalLotes ?? lotes.total ?? 0;
  const edital = leilao._urls?.edital || null;
  // Documentos só são buscados quando a aba está aberta (evita fetch extra na aba Lotes).
  const docs: DocItem[] = aba === 'documentos'
    ? ((await safe(getLeilaoDocumentos(leilao.id), { result: [], total: 0 })).result as DocItem[])
    : [];

  const makeHref = (pg: number) => {
    const q = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => { if (v) q.set(k, String(v)); });
    q.set('page', String(pg));
    return `/leilao/${params.idOrSlug}?${q.toString()}`;
  };

  const tipo = leilao.tipo ? TIPO_LEILAO[leilao.tipo] : leilao.tipoLabel;
  const datas = [leilao.data1, leilao.data2, leilao.data3].filter(Boolean) as string[];
  const codigo = leilao.codigo || (leilao.numero ? `${leilao.numero}${leilao.ano ? '/' + leilao.ano : ''}` : String(leilao.id));
  const pracaLabel = leilao.praca ? `${leilao.praca}º Leilão` : null;
  const auditorio = leilao._urls?.auditorio;
  const temImovel = lista.some((l) => l.bem?.isImovel);
  // Sem endereço preenchido não mostra nada (nem "100% Online" nem o ícone) — o bloco é gated por `local`.
  const local = textoLocal(leilao.local);

  return (
    <main>
      {/* Hero navy */}
      <section className="lei-ev-hero">
        <div className="lei-ev-hero__in">
          <div className="lei-ev-hero__crumb">
            <Link href="/">Início</Link> › <Link href="/leiloes">Leilões</Link> › Leilão {codigo}
          </div>
          <div className="lei-ev-hero__row">
            <div className="lei-ev-hero__main">
              <div className="lei-ev-hero__badges">
                {pracaLabel && <span className="lei-ev-hero__praca">{pracaLabel}</span>}
                {leilao.judicial && <span className="lei-ev-hero__tag">Judicial</span>}
                {leilao.vendaDireta && <span className="lei-ev-hero__tag">Venda Direta</span>}
                {tipo && <span className="lei-ev-hero__tag">{tipo}</span>}
              </div>
              <h1 className="lei-ev-hero__title">{leilao.titulo || `Leilão ${codigo}`}</h1>
              <div className="lei-ev-hero__meta">
                <span>Leilão nº {codigo} · {totalLotesLeilao} {totalLotesLeilao === 1 ? 'lote' : 'lotes'}</span>
                {datas.map((d, i) => (
                  <span key={i}><b>{i + 1}º leilão</b> {dataCurta(d)}</span>
                ))}
                {local && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent)" strokeWidth="2" style={{ flex: 'none' }}><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>
                    {local}
                  </span>
                )}
              </div>
            </div>
            <div className="lei-ev-hero__acts">
              {!user && (
                <Link href="/login" className="lei-ev-hero__cta">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                  Faça login para se habilitar
                </Link>
              )}
              {auditorio && (
                <a href={auditorio} target="_blank" rel="noopener" className="lei-ev-hero__aud">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent)" strokeWidth="1.9" strokeLinecap="round"><path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" /></svg>
                  Acesse o Auditório Virtual
                </a>
              )}
            </div>
          </div>

          {/* abas */}
          <div className="lei-ev-tabs">
            <Link href={`/leilao/${params.idOrSlug}`} className={`lei-ev-tab${aba === 'lotes' ? ' is-active' : ''}`}>Lotes</Link>
            <Link href={`/leilao/${params.idOrSlug}?aba=documentos`} className={`lei-ev-tab${aba === 'documentos' ? ' is-active' : ''}`}>Documentos</Link>
            <Link href={`/leilao/${params.idOrSlug}?aba=comitentes`} className={`lei-ev-tab${aba === 'comitentes' ? ' is-active' : ''}`}>Comitentes</Link>
          </div>
        </div>
      </section>

      {/* Corpo — muda conforme a aba (Lotes / Documentos / Comitentes) */}
      <section className="lei-ev-body">
        {aba === 'documentos' ? (
          <div className="lei-ev-panel">
            <h2 className="lei-ev-panel__h2">Documentos do leilão</h2>
            {(edital || docs.length > 0) ? (
              <div className="lei-ev-docs">
                {edital && (
                  <a href={edital} target="_blank" rel="noopener noreferrer" className="lei-ev-doc">
                    <span className="lei-ev-doc__ico"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#a8874b" strokeWidth="1.9"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg></span>
                    <span className="lei-ev-doc__txt"><b>Edital do leilão</b><small>PDF · abrir</small></span>
                  </a>
                )}
                {docs.map((d, i) => {
                  const nome = d.nome || (typeof d.tipo === 'string' ? d.tipo : d.tipo?.nome) || 'Documento';
                  return d.url ? (
                    <a key={i} href={d.url} target="_blank" rel="noopener noreferrer" className="lei-ev-doc">
                      <span className="lei-ev-doc__ico"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#a8874b" strokeWidth="1.9"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /></svg></span>
                      <span className="lei-ev-doc__txt"><b style={{ textTransform: 'capitalize' }}>{nome}</b>{d.info && <small>{d.info}</small>}</span>
                    </a>
                  ) : null;
                })}
              </div>
            ) : (
              <p className="lei-ev-panel__vazio">Nenhum documento disponível para este leilão.</p>
            )}
          </div>
        ) : aba === 'comitentes' ? (
          comitentes.length > 0 ? (
            <div className="lei-ev-comits">
              {comitentes.map((c) => {
                const logo = urlImagem(c.image as Imagem | string | null, 'full') || urlImagem(c.image as Imagem | string | null, 'thumb');
                return (
                  <div key={c.id ?? c.nome} className="lei-ev-comit-card">
                    <div className={`lei-ev-comit-card__ava${logo ? ' has-logo' : ''}`}>
                      {logo
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={logo} alt={c.nome || 'Comitente'} />
                        : siglaDe(c.nome || 'Comitente')}
                    </div>
                    <div className="lei-ev-comit-card__nome">{c.nome}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="lei-ev-panel"><p className="lei-ev-panel__vazio">Nenhum comitente informado para este leilão.</p></div>
          )
        ) : (
          <>
            <FiltroBarLote filtros={filtros} total={lotes.total} totalGeral={leilao.totalLotes ?? lotes.total} />

            {lista.length === 0 ? (
              <div className="lei-empty">
                <div className="lei-empty__ico">
                  <svg width="27" height="27" viewBox="0 0 24 24" fill="none" stroke="#A8874B" strokeWidth="1.7"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
                </div>
                <h3>Nenhum lote com esses filtros</h3>
                <p>Remova a situação ou o tipo de bem selecionado para ver mais resultados deste leilão.</p>
                <Link href={`/leilao/${params.idOrSlug}`} className="lei-btn lei-btn--primary" style={{ borderRadius: 999, padding: '14px 30px' }}>Limpar filtros</Link>
              </div>
            ) : (
              <>
                <div id="loteGrid" className="lei-ev-cards">
                  {lista.map((lt) => <LoteCard key={lt.id} lote={lt} />)}
                </div>
                <Paginacao page={lotes.page} pages={lotes.pages} makeHref={makeHref} />
              </>
            )}
          </>
        )}
      </section>
    </main>
  );
}
