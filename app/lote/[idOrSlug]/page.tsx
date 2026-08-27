import Link from 'next/link';
import { notFound } from 'next/navigation';
import GaleriaLote from '@/components/GaleriaLote';
import LanceBoxLote from '@/components/LanceBoxLote';
import HistoricoLances from '@/components/HistoricoLances';
import ProcessoNum from '@/components/ProcessoNum';
import LoteTools from '@/components/LoteTools';
import { getLote, getLoteVizinhos, getLeilao, getSiteConfig, ApiException } from '@/lib/api';
import { getSessionUser } from '@/lib/auth';
import { moeda, data as dataBR, hora, dataNoPassado } from '@/lib/format';
import { MODO_EXEMPLO } from '@/lib/config';
import { sanitizeHtml } from '@/lib/sanitize';
import { urlImagem } from '@/lib/img';
import { pageMeta, jsonLd } from '@/lib/seo';
import { SITE_URL } from '@/lib/config';
import type { Metadata } from 'next';
import type { Lote, Leilao, Ref, Imagem } from '@/lib/types';

export const dynamic = 'force-dynamic';

const nomeRef = (r: Ref | string | null | undefined): string => !r ? '' : typeof r === 'string' ? r : r.nome || '';

// SEO por lote: título = título do bem, descrição com localização e lance inicial, imagem = 1ª foto.
export async function generateMetadata({ params }: { params: { idOrSlug: string } }): Promise<Metadata> {
  const lote = await getLote(params.idOrSlug).catch(() => null);
  if (!lote) return { title: 'Lote' };
  const bem = lote.bem;
  const titulo = bem?.siteTitulo || nomeRef(bem?.tipo) || `Lote ${lote.numeroString || lote.numero}`;
  const loc = bem?.localizacao;
  const local = loc ? [loc.cidade, loc.uf].filter(Boolean).join('/') : '';
  const desc = `${titulo}${local ? ` — ${local}` : ''}. Lance inicial ${moeda(lote.valorInicial)}. Participe do leilão online.`;
  const img = bem?.fotos?.[0]?.url || urlImagem(bem?.image, 'full') || undefined;
  return pageMeta({ title: titulo, description: desc, path: `/lote/${lote.slug || lote.id}`, image: img });
}

export default async function LotePage({ params }: { params: { idOrSlug: string } }) {
  let lote: Lote;
  try { lote = await getLote(params.idOrSlug); }
  catch (e) { if (e instanceof ApiException && e.status === 404) notFound(); throw e; }

  const bem = lote.bem;
  const leilao = lote.leilao as Leilao;
  const leilaoId = leilao?.id;

  const safe = async <T,>(pr: Promise<T>, fb: T) => { try { return await pr; } catch { return fb; } };
  const [vizinhos, user, config, leilaoFull] = await Promise.all([
    safe(getLoteVizinhos(lote.id), { anterior: null, proximo: null } as { anterior: { slug: string | null; id: number } | null; proximo: { slug: string | null; id: number } | null }),
    getSessionUser().catch(() => null),
    safe(getSiteConfig(), null as never),
    leilaoId ? safe(getLeilao(leilaoId), null as Leilao | null) : Promise.resolve(null as Leilao | null),
  ]);
  const anterior = vizinhos.anterior;
  const proximo = vizinhos.proximo;
  const editalUrl = (leilaoFull?._urls as { edital?: string | null } | undefined)?.edital || null;
  const auditorioUrl = (leilaoFull?._urls as { auditorio?: string | null } | undefined)?.auditorio || null;
  const realtime = (config?.realtime ?? { url: null, clientId: null }) as { url: string | null; clientId: string | null };

  const inst = leilao?.instancia ?? 1;
  const praca = leilao?.praca ?? 1;
  const modalidade = leilao?.vendaDireta ? 'Venda Direta' : leilao?.judicial ? 'Judicial' : 'Extrajudicial';
  const fase = inst === 1 ? 'Leilão Único' : praca === 1 ? '1º Leilão' : praca === 2 ? '2º Leilão' : 'Leilão Único';
  const podeLance = lote.status === 1 || lote.status === 2;
  // Cronômetro: em MODO_EXEMPLO, se a data do pregão já passou (dados de demonstração), projeta
  // uma data futura estável (por leilão) só pra o contador demonstrar. Fora do modo exemplo usa a real.
  const encerraReal = leilao?.dataProximoLeilao ?? null;
  const dataEncerra = MODO_EXEMPLO && (!encerraReal || dataNoPassado(encerraReal))
    ? new Date(Date.now() + (((leilaoId ?? 1) % 9) + 2) * 86400000 + 5 * 3600000).toISOString()
    : encerraReal;
  const titulo = bem?.siteTitulo || nomeRef(bem?.tipo) || `Lote ${lote.numeroString || lote.numero}`;
  const loc = bem?.localizacao;
  const urlEvento = `/leilao/${leilao?.slug || leilaoId}`;
  const fotos = (bem?.fotos || []).map((f) => f.url || f.min || f.thumb).filter(Boolean) as string[];
  if (!fotos.length) { const cap = urlImagem(bem?.image, 'full'); if (cap) fotos.push(cap); }
  const comitente = bem?.comitente?.nome || null;
  const comitenteLogo = urlImagem(bem?.comitente?.image as Imagem | null, 'full') || urlImagem(bem?.comitente?.image as Imagem | null, 'thumb') || null;

  const stt = leilao?.status ?? 0;
  const dataHora = (d?: string | null) => (d ? `${dataBR(d)} ${hora(d)}` : undefined);
  const linhas: { k: string; sub?: string; v: string; tipo?: 'aval'; off?: boolean }[] = [];
  if ((lote.valorAvaliacao ?? 0) > 0 && lote.status !== 100) linhas.push({ k: 'Avaliação', v: moeda(lote.valorAvaliacao), tipo: 'aval' });
  if (inst > 1) {
    linhas.push({ k: '1º Leilão', sub: dataHora(leilao.data1), v: moeda(lote.valorInicial), off: praca > 1 || stt > 5 });
    if (lote.valorInicial2 != null) linhas.push({ k: '2º Leilão', sub: dataHora(leilao.data2), v: moeda(lote.valorInicial2), off: praca > 2 || stt > 5 });
  } else {
    linhas.push({ k: 'Lance inicial', v: moeda(lote.valorInicial) });
  }
  if (lote.valorIncremento) linhas.push({ k: 'Incremento', v: moeda(lote.valorIncremento) });

  const specs: { k: string; v: string }[] = [
    { k: 'Tipo', v: nomeRef(bem?.tipo) || '—' },
    { k: 'Modalidade', v: modalidade },
  ];
  if (!leilao?.vendaDireta) specs.push({ k: 'Leilão', v: praca === 1 ? '1º' : praca === 2 ? '2º' : praca === 3 ? '3º' : 'Único' });
  specs.push({ k: 'Situação', v: lote.statusLabel });
  if ((lote.valorAvaliacao ?? 0) > 0 && lote.status !== 100) specs.push({ k: 'Avaliação', v: moeda(lote.valorAvaliacao) });
  const fmtArea = (v: unknown) => { const s = String(v).trim(); return /m²|m2/i.test(s) ? s : `${s} m²`; };
  if (bem?.areaTerreno) specs.push({ k: 'Área do terreno', v: fmtArea(bem.areaTerreno) });
  if (bem?.areaEdificada) specs.push({ k: 'Área edificada', v: fmtArea(bem.areaEdificada) });
  if (bem?.identificador) specs.push({ k: bem?.isImovel ? 'Matrícula' : 'Identificador', v: bem.identificador });

  const enderecoLinha = loc && (loc.endereco || loc.cidade)
    ? `${loc.endereco || ''}${loc.numero ? ' ' + loc.numero : ''}${loc.bairro ? ', ' + loc.bairro : ''}${loc.cidade ? ', ' + loc.cidade : ''}${loc.uf ? ' - ' + loc.uf : ''}${loc.cep ? '. CEP ' + loc.cep : ''}`
    : null;
  const ocupado = bem?.imovel?.ocupado;
  // Nº do processo (judicial): vem como objeto { numeroFormatado, numero } ou string. Bloco próprio com Copiar.
  const processoRaw = (bem as { processo?: unknown; processoNumero?: unknown } | null)?.processo
    ?? (bem as { processoNumero?: unknown } | null)?.processoNumero;
  const processo = typeof processoRaw === 'string'
    ? processoRaw
    : (processoRaw as { numeroFormatado?: string; numero?: string } | null)?.numeroFormatado
      || (processoRaw as { numero?: string } | null)?.numero
      || null;

  const ldProduto = jsonLd({
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: titulo,
    image: fotos.slice(0, 6),
    description: bem?.siteSubtitulo || `${titulo}${loc?.cidade ? ` em ${loc.cidade}${loc.uf ? '/' + loc.uf : ''}` : ''}`,
    ...(bem?.identificador ? { sku: bem.identificador } : {}),
    offers: {
      '@type': 'Offer',
      price: lote.valorInicial ?? undefined,
      priceCurrency: 'BRL',
      availability: podeLance ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
      url: `${SITE_URL}/lote/${lote.slug || lote.id}`,
    },
  });

  return (
    <div className="lei-lote-wrap">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldProduto }} />
      <div className="lei-lote-crumbrow">
        <div className="lei-lote-crumb">
          <Link href="/">Início</Link> ›{' '}
          <Link href={urlEvento}>Leilão {leilao?.codigo}</Link> ›{' '}
          <b>Lote {lote.numeroString || lote.numero}</b>
        </div>
        <LoteTools url={`/lote/${lote.slug || lote.id}`} titulo={titulo} />
      </div>

      <div className="lei-lote-nav">
        {anterior ? (
          <Link href={`/lote/${anterior.slug || anterior.id}`} className="lei-lote-nav__btn">‹ Lote anterior</Link>
        ) : <span className="lei-lote-nav__btn is-disabled">‹ Lote anterior</span>}
        <Link href={urlEvento} className="lei-lote-nav__center">Todos os lotes do leilão</Link>
        {proximo ? (
          <Link href={`/lote/${proximo.slug || proximo.id}`} className="lei-lote-nav__btn">Próximo lote ›</Link>
        ) : <span className="lei-lote-nav__btn is-disabled">Próximo lote ›</span>}
      </div>

      <div className="lei-lote-grid">
        <div>
          <GaleriaLote fotos={fotos} fase={fase} comitente={comitente} mapEmbed={loc?.mapEmbed} street={loc?.streetView} video={bem?.videos?.[0] || null} />

          <div className="lei-lote-card">
            <h2>Descrição do bem</h2>
            {bem?.siteSubtitulo && <p className="lei-lote-desc" style={{ fontWeight: 600, color: 'var(--brand-accent-ink)' }}>{bem.siteSubtitulo}</p>}
            {bem?.siteDescricao ? <div className="lei-lote-desc" dangerouslySetInnerHTML={{ __html: sanitizeHtml(bem.siteDescricao) }} />
              : lote.descricao ? <div className="lei-lote-desc">{lote.descricao}</div> : null}

            <div className="lei-lote-specs">
              {specs.map((s) => (
                <div className="lei-lote-spec" key={s.k}><div className="lei-lote-spec__k">{s.k}</div><div className="lei-lote-spec__v">{s.v}</div></div>
              ))}
            </div>

            {processo && <ProcessoNum numero={processo} />}

            {ocupado != null && (
              <div className="lei-lote-info" style={{ marginTop: 18 }}>
                <div className="lei-lote-info__ico lei-lote-info__ico--red">i</div>
                <div>
                  <div className="lei-lote-info__tt">{ocupado ? 'Imóvel ocupado' : 'Imóvel desocupado'}</div>
                  <div className="lei-lote-info__tx">Este imóvel encontra-se {ocupado ? 'ocupado' : 'desocupado'} no momento.</div>
                </div>
              </div>
            )}
          </div>

          {bem?.siteObservacao && (
            <div className="lei-lote-card">
              <h2>Observações</h2>
              <div className="lei-lote-desc" dangerouslySetInnerHTML={{ __html: sanitizeHtml(bem.siteObservacao) }} />
            </div>
          )}

          {(leilao?.infoVisitacao || leilao?.infoRetirada) && (
            <div className="lei-lote-card">
              <h2>Visitação e retirada</h2>
              {leilao?.infoVisitacao && (
                <div className="lei-lote-info"><div className="lei-lote-info__ico">📅</div><div><div className="lei-lote-info__tt">Visitação</div><div className="lei-lote-info__tx" dangerouslySetInnerHTML={{ __html: sanitizeHtml(leilao.infoVisitacao) }} /></div></div>
              )}
              {leilao?.infoRetirada && (
                <div className="lei-lote-info"><div className="lei-lote-info__ico">🚚</div><div><div className="lei-lote-info__tt">Retirada</div><div className="lei-lote-info__tx" dangerouslySetInnerHTML={{ __html: sanitizeHtml(leilao.infoRetirada) }} /></div></div>
              )}
            </div>
          )}

          <div className="lei-lote-card">
            <h2>Formas de pagamento</h2>
            <div className="lei-lote-info lei-lote-info--center"><div className="lei-lote-info__ico"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /><path d="M6 12h.01M18 12h.01" /></svg></div><div><div className="lei-lote-info__tt">À vista</div></div></div>
            {leilao?.infoPagamento && <p className="lei-lote-info__tx" style={{ marginTop: 6 }} dangerouslySetInnerHTML={{ __html: sanitizeHtml(leilao.infoPagamento) }} />}
          </div>

          {loc?.mapEmbed && (
            <div className="lei-lote-card">
              <div className="lei-lote-card__head">
                <h2>Localização do imóvel</h2>
                {loc.cidade && <span>📍 {loc.cidade}{loc.uf ? ` - ${loc.uf}` : ''}</span>}
              </div>
              {enderecoLinha && <p className="lei-lote-desc">{enderecoLinha}</p>}
              <div className="lei-lote-map"><iframe src={loc.mapEmbed} loading="lazy" referrerPolicy="no-referrer-when-downgrade" allowFullScreen /></div>
            </div>
          )}
        </div>

        <div className="lei-lote-aside">
          <div className="lei-lote-panel">
            <div className="lei-lote-panel__meta">Lote {lote.numeroString || lote.numero}{nomeRef(bem?.tipo) ? ` · ${nomeRef(bem?.tipo)}` : ''}</div>
            <h1 className="lei-lote-panel__title">{titulo}</h1>
            {loc?.cidade && <div className="lei-lote-panel__loc">📍 {loc.cidade}{loc.uf ? ` - ${loc.uf}` : ''}</div>}

            <LanceBoxLote
              loteId={lote.id}
              leilaoId={leilaoId}
              valorInicial={lote.valorInicial}
              valorIncremento={lote.valorIncremento}
              valorLanceAtual={lote.valorLanceAtual}
              totalLances={lote.totalLances}
              podeLance={podeLance}
              logado={!!user}
              loginHash={user?.loginHash}
              clientId={realtime.clientId ?? undefined}
              realtimeUrl={realtime.url ?? undefined}
              dataEncerra={dataEncerra}
              status={leilao?.status}
              vendaDireta={leilao?.vendaDireta}
              dataLimitePropostas={(leilao as { dataLimitePropostas?: string | null })?.dataLimitePropostas ?? null}
              statusLabel={lote.statusLabel}
              linhas={linhas}
              statsVisitas={(lote as unknown as { statsVisitas?: number }).statsVisitas ?? 0}
              habilitados={(leilao as unknown as { habilitados?: number })?.habilitados ?? 0}
            />

            {auditorioUrl && ![96, 97, 98, 99].includes((leilaoFull?.status ?? leilao?.status) as number) && (
              <a href={auditorioUrl} target="_blank" rel="noopener noreferrer" className="lei-lote-cta-audit">Acesse o Auditório Virtual</a>
            )}
          </div>

          <div className="lei-lote-com">
            <div className="lei-lote-com__grid">
              {comitente && (
                <div className="lei-lote-com__col">
                  <div className="lei-lote-com__label">Comitente</div>
                  <div className="lei-lote-com__logo">
                    {comitenteLogo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={comitenteLogo} alt={comitente} /> : <span>{comitente}</span>}
                  </div>
                </div>
              )}
              <div className="lei-lote-com__col">
                <div className="lei-lote-com__label">Leiloeiro Público Oficial</div>
                <div className="lei-lote-com__leiloeiro">
                  {leilao?.leiloeiro?.nome || 'Leiloeiro Oficial'}
                  <span className="lei-lote-com__matricula">{leilao?.leiloeiro?.matricula || 'JUCE 000'}</span>
                </div>
              </div>
            </div>
          </div>

          {editalUrl && (
            <div className="lei-lote-com">
              <div className="lei-lote-com__label">Documentos</div>
              <a href={editalUrl} target="_blank" rel="noopener noreferrer" className="lei-lote-doc">
                <span className="lei-lote-doc__pdf">PDF</span>
                <span className="lei-lote-doc__nome">Edital do leilão</span>
                <svg className="lei-lote-doc__dl" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              </a>
            </div>
          )}
        </div>
      </div>

      {!leilao?.vendaDireta && <HistoricoLances loteId={lote.id} />}
    </div>
  );
}
