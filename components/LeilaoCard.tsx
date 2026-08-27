import Link from 'next/link';
import { Fragment } from 'react';
import { MODO_EXEMPLO } from '@/lib/config';
import type { Leilao, SiteConfig } from '@/lib/types';
import { moeda, data as dataBR } from '@/lib/format';
import { fotoLeilao } from '@/lib/img';

function praca(l: Leilao): string {
  const inst = l.instancia ?? 1;
  if (inst === 1) return 'Leilão Único';
  if (l.praca === 1) return '1º Leilão';
  if (l.praca === 2) return '2º Leilão';
  return 'Leilão Único';
}

// Acesso defensivo a stats que a API pode ou não trazer no objeto de leilão.
function num(l: Leilao, k: string): number | null {
  const v = (l as unknown as Record<string, unknown>)[k];
  return typeof v === 'number' ? v : null;
}

// `leilao.local` vem como STRING em alguns tenants e como OBJETO {cidade,uf,...} em outros.
function textoLocal(loc: unknown): string {
  if (!loc) return '';
  if (typeof loc === 'string') return loc;
  const o = loc as Record<string, string | null>;
  return [o.cidade, o.uf].filter(Boolean).join(' - ');
}

const IcoLotes = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M20 7l-8-4-8 4v10l8 4 8-4V7z" /><path d="M4 7l8 4 8-4M12 11v10" /></svg>;
const IcoOlho = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" /><circle cx="12" cy="12" r="3" /></svg>;
const IcoUsers = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20" /><circle cx="10" cy="8" r="3.5" /><path d="M19.5 20v-1.4a3.5 3.5 0 0 0-2.6-3.4M15.5 4.6a3.5 3.5 0 0 1 0 6.8" /></svg>;
const IcoGavel = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21h9" /><path d="M8.5 17.5 15 11" /><path d="m13.2 5.6 5.2 5.2-2.4 2.4-5.2-5.2z" /><path d="M16.4 2.4 21.6 7.6" /></svg>;

// Card de leilão (rico) — porta o card do template com stats e CTA.
export default function LeilaoCard({ leilao, features }: { leilao: Leilao; features?: SiteConfig['features'] }) {
  const foto = fotoLeilao(leilao);
  const modalidade = leilao.vendaDireta ? 'Venda Direta' : leilao.judicial ? 'Judicial' : 'Extrajudicial';
  // Leilões de EXEMPLO (MODO_EXEMPLO) têm id negativo e slug `exemplo-N`, que não existe na API.
  // Clicar num card de exemplo leva à lista de leilões reais em vez de 404 no detalhe.
  const ehExemplo = leilao.id < 0;
  const href = ehExemplo ? '/leiloes' : `/leilao/${leilao.slug || leilao.id}`;
  const aberto = leilao.status === 3 || leilao.status === 4;
  const stCor = aberto ? 'var(--color-success)' : '#8A8A82';
  const titulo = leilao.comitentes?.[0]?.nome || leilao.titulo || 'Leilão';
  const local = textoLocal(leilao.local) || leilao.comitentes?.[0]?.apelido || '';
  const codigo = leilao.codigo || (leilao.numero ? `${leilao.numero}${leilao.ano ? '/' + leilao.ano : ''}` : '');
  const nLotes = leilao.totalLotes ?? (MODO_EXEMPLO ? 4 + (Math.abs(leilao.id) * 3) % 40 : null);
  const aPartir = num(leilao, 'valorInicialMenor') ?? num(leilao, 'valorInicial');

  // Stats do leilão: usa o dado real da API; onde a API não expõe (nesta API local só vem
  // totalLotes), no MODO_EXEMPLO cai num valor de exemplo determinístico (estável por leilão),
  // pra a tela ficar completa como o template. Fora do modo exemplo mostra o real (ou 0).
  const ex = (mult: number, mod: number, add: number) => add + (Math.abs(leilao.id) * mult) % mod;
  const fmt = (n: number) => n.toLocaleString('pt-BR');
  const lotes = leilao.totalLotes ?? (MODO_EXEMPLO ? ex(3, 40, 4) : 0);
  const vis = num(leilao, 'statsVisitas') ?? num(leilao, 'visualizacoes') ?? (MODO_EXEMPLO ? ex(53, 1800, 200) : 0);
  const hab = num(leilao, 'habilitados') ?? (MODO_EXEMPLO ? ex(7, 90, 3) : 0);
  const lances = num(leilao, 'totalLances') ?? (MODO_EXEMPLO ? ex(11, 60, 0) : 0);
  // Gate por feature do ERP: mostrarVisitas / mostrarHabilitados / mostrarLances (lotes sempre).
  const stats: [React.ReactNode, string][] = [[<IcoLotes key="l" />, fmt(lotes)]];
  if (features?.mostrarVisitas !== false) stats.push([<IcoOlho key="v" />, fmt(vis)]);
  if (features?.mostrarHabilitados !== false) stats.push([<IcoUsers key="h" />, fmt(hab)]);
  if (features?.mostrarLances !== false) stats.push([<IcoGavel key="g" />, fmt(lances)]);

  return (
    <Link href={href} className="lei-leilao">
      <div className="lei-leilao__img">
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt={titulo} loading="lazy" />
        ) : (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="88" height="88" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent)" strokeWidth=".85" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: .5 }}><rect x="3" y="19.4" width="10" height="2" rx="1" /><g transform="rotate(45 10 7.5)"><rect x="6.6" y="3" width="6.6" height="4" rx="1.1" /><rect x="9.3" y="6.8" width="1.3" height="7.6" rx=".65" /></g><path d="M4 21.6h16" /></svg>
          </div>
        )}
        <div className="lei-leilao__shade" />
        <div className="lei-leilao__tags">
          <span className="lei-leilao__praca">{praca(leilao)}</span>
          <span className="lei-leilao__mod">{modalidade}</span>
        </div>
        {aPartir != null && (
          <div className="lei-leilao__price">
            <div className="lei-leilao__price-lbl">A partir de</div>
            <div className="lei-leilao__price-val">{moeda(aPartir)}</div>
          </div>
        )}
      </div>

      <div className="lei-leilao__body">
        <span className="lei-leilao__status" style={{ color: stCor }}>
          <i style={{ background: stCor }} />{leilao.statusLabel || (aberto ? 'Aberto' : '')}
        </span>

        <div>
          <h3 className="lei-leilao__title">{titulo}</h3>
          {local && (
            <div className="lei-leilao__loc">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent-ink)" strokeWidth="1.8" style={{ flex: 'none' }}><path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" /><circle cx="12" cy="9" r="2.5" /></svg>
              <span>{local}</span>
            </div>
          )}
          {(codigo || nLotes != null) && (
            <div className="lei-leilao__code">
              {codigo ? `Leilão ${codigo}` : ''}{codigo && nLotes != null ? ' · ' : ''}{nLotes != null ? `${nLotes} ${nLotes === 1 ? 'lote' : 'lotes'}` : ''}
            </div>
          )}
        </div>

        {leilao.dataProximoLeilao && (
          <div className="lei-leilao__date">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent-ink)" strokeWidth="1.7" style={{ flex: 'none' }}><rect x="3" y="4.5" width="18" height="17" rx="2.5" /><path d="M3 9.5h18M8 2.5v4M16 2.5v4" /></svg>
            <span style={{ minWidth: 0 }}>
              <span className="lei-leilao__date-lbl">{leilao.instancia && leilao.instancia > 1 ? `${leilao.praca}º leilão` : 'Data do leilão'}</span>
              <span className="lei-leilao__date-v">{dataBR(leilao.dataProximoLeilao)}</span>
            </span>
          </div>
        )}

        {stats.length > 0 && (
          <div className="lei-leilao__stats">
            {stats.map(([ico, val], i) => (
              <Fragment key={i}>
                {i > 0 && <span className="lei-leilao__sep" />}
                <span className="lei-leilao__stat">{ico}{val}</span>
              </Fragment>
            ))}
          </div>
        )}

        <span className="lei-leilao__cta">Ver leilão</span>
      </div>
    </Link>
  );
}
