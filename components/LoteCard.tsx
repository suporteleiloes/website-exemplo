import Link from 'next/link';
import type { Lote, Leilao, Ref } from '@/lib/types';
import { moeda } from '@/lib/format';
import { fotoBem } from '@/lib/img';
import { MODO_EXEMPLO } from '@/lib/config';
import FavHeart from './FavHeart';

const nomeRef = (r: Ref | string | null | undefined): string =>
  !r ? '' : typeof r === 'string' ? r : r.nome || '';

function praca(ll: Leilao | undefined): string {
  const inst = ll?.instancia ?? 1;
  if (ll?.vendaDireta) return 'Venda Direta';
  if (inst === 1) return 'Leilão único';
  if (ll?.praca === 1) return '1º Leilão';
  if (ll?.praca === 2) return '2º Leilão';
  return 'Leilão único';
}

const fmt = (n: number) => n.toLocaleString('pt-BR');

// Card de lote — porta a lógica do kleiloes-v2: vendido/cancelado/sem-licitante fica CINZA
// (cancelado não é clicável), mostra Lance inicial + Lance atual e os stats (visitas · habilitados · lances).
export default function LoteCard({ lote, compact = false }: { lote: Lote; compact?: boolean }) {
  const bem = lote.bem;
  const ll = lote.leilao as Leilao;
  const foto = fotoBem(bem);
  const cat = nomeRef(bem?.tipoPai) || nomeRef(bem?.tipo) || 'Bem';
  const cidade = bem?.localizacao?.cidade;
  const uf = bem?.localizacao?.uf;
  const catLocal = [cat, cidade ? `${cidade}${uf ? `/${uf}` : ''}` : ''].filter(Boolean).join(' · ');
  const titulo = bem?.siteTitulo || lote.descricao || `Lote ${lote.numeroString || lote.numero}`;

  const inativo = [8, 10, 11, 100].includes(lote.status);
  const cancelado = lote.status === 11;
  const temLanceAtual = lote.valorLanceAtual != null && !inativo;

  const ex = (mult: number, mod: number, add: number) => add + (Math.abs(lote.id) * mult) % mod;
  const visitas = (lote as { statsVisitas?: number }).statsVisitas ?? (MODO_EXEMPLO ? ex(53, 1800, 120) : 0);
  const habil = (ll as { habilitados?: number })?.habilitados ?? (MODO_EXEMPLO ? ex(7, 90, 3) : 0);
  const lances = lote.totalLances ?? (MODO_EXEMPLO ? ex(11, 60, 0) : 0);

  return (
    <Link
      href={`/lote/${lote.slug || lote.id}`}
      className={`lei-lote${inativo ? ' is-inativo' : ''}${cancelado ? ' is-cancelado' : ''}`}
      {...(cancelado ? { 'aria-disabled': true, tabIndex: -1 } : {})}
    >
      <div className="lei-lote__img">
        {foto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={foto} alt={titulo} loading="lazy" />
        ) : (
          <div className="lei-noimg">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#B7B1A0" strokeWidth="1.5"><rect x="3" y="4.5" width="18" height="15" rx="2" /><circle cx="8.5" cy="10" r="1.6" /><path d="M21 15.5l-4.5-4.5L9 18.5" /></svg>
            <span>Sem imagem</span>
          </div>
        )}
        {inativo
          ? <span className={`lei-lote__cancel${cancelado ? ' is-cancelado' : ''}`}>{lote.statusLabel}</span>
          : <span className="lei-lote__praca">{praca(ll)}</span>}
        <FavHeart />
      </div>

      <div className="lei-lote__body">
        <div className="lei-lote__cat">{catLocal}</div>
        <h3 className="lei-lote__title">{titulo}</h3>

        <div className="lei-lote__prices">
          <div className="lei-lote__pcol">
            <span className="lei-lote__rlbl">Lance inicial</span>
            <span className="lei-lote__pval">{moeda(lote.valorInicial)}</span>
          </div>
          {temLanceAtual && (
            <div className="lei-lote__pcol">
              <span className="lei-lote__rlbl">Lance atual</span>
              <span className="lei-lote__pval lei-lote__pval--atual">{moeda(lote.valorLanceAtual)}</span>
            </div>
          )}
        </div>

        {!compact && (
          <div className="lei-lote__foot2">
            <div className="lei-lote__stats">
              <span title="Visualizações">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
                {fmt(visitas)}
              </span>
              <span title="Habilitados">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                {fmt(habil)}
              </span>
              <span title="Lances">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m14 13-8.5 8.5a2.1 2.1 0 0 1-3-3L11 10" /><path d="m16 16 6-6" /><path d="m9 7 8 8" /></svg>
                {fmt(lances)}
              </span>
            </div>
            <span className="lei-lote__det">Detalhes</span>
          </div>
        )}
      </div>
    </Link>
  );
}
