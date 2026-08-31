'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState } from 'react';
import type { Filtros, FacetItem } from '@/lib/types';
import { mascaraMoedaBR, moedaParaNumero, reaisParaMascara } from '@/lib/format';

const opt = (f: FacetItem) => ({ id: String(f.id ?? f.value ?? ''), nome: f.nome || f.label || String(f.id ?? f.value) });

const SITUACOES = [
  { v: '', label: 'Situação' },
  { v: '1', label: 'Aberto para lances' },
  { v: '2', label: 'Em leilão' },
  { v: '100', label: 'Vendido' },
  { v: '10', label: 'Retirado' },
];

const SORTS = [
  { v: 'numero', label: 'Nº do lote' },
  { v: 'menorValor', label: 'Menor valor' },
  { v: 'maiorValor', label: 'Maior valor' },
  { v: 'maisVistos', label: 'Mais vistos' },
];

// Barra de filtros HORIZONTAL do template (toolbar + filtros) para a página do leilão.
// Lê/escreve searchParams (server refetch). O param `leilao` é implícito na rota /leilao/[idOrSlug].
export default function FiltroBarLote({ filtros, total, totalGeral }: { filtros: Filtros; total: number; totalGeral: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const get = (k: string) => sp.get(k) || '';

  const [busca, setBusca] = useState(get('search'));
  const [aberto, setAberto] = useState(false);
  const [vista, setVista] = useState<'grade' | 'lista'>('grade');
  // Máscara R$ enquanto digita; inicializa a partir do valor (em reais) que veio na URL.
  const [vmin, setVmin] = useState(() => reaisParaMascara(get('valorMinimo')));
  const [vmax, setVmax] = useState(() => reaisParaMascara(get('valorMaximo')));

  // Navega mantendo os params atuais, sobrescrevendo os informados (undefined = remove).
  function nav(patch: Record<string, string | undefined>) {
    const q = new URLSearchParams(sp.toString());
    q.delete('page');
    for (const [k, v] of Object.entries(patch)) { if (v) q.set(k, v); else q.delete(k); }
    router.push(`${pathname}?${q.toString()}`);
  }

  function toggleVista(v: 'grade' | 'lista') {
    setVista(v);
    document.getElementById('loteGrid')?.classList.toggle('is-lista', v === 'lista');
  }

  return (
    <>
      {/* toolbar: contagem + vista + ordenação */}
      <div className="lei-lf-toolbar">
        <span className="lei-lf-count"><b>{total}</b> de {totalGeral} lotes</span>
        <div className="lei-lf-toolbar__right">
          <div className="lei-lf-view">
            <button type="button" aria-label="Grade" className={vista === 'grade' ? 'is-active' : ''} onClick={() => toggleVista('grade')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="1.6" /><rect x="13" y="3" width="8" height="8" rx="1.6" /><rect x="3" y="13" width="8" height="8" rx="1.6" /><rect x="13" y="13" width="8" height="8" rx="1.6" /></svg>
            </button>
            <button type="button" aria-label="Lista" className={vista === 'lista' ? 'is-active' : ''} onClick={() => toggleVista('lista')}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></svg>
            </button>
          </div>
          <select className="lei-lf-sort" value={get('sortBy') || 'numero'} onChange={(e) => nav({ sortBy: e.target.value })}>
            {SORTS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* barra de filtros */}
      <div className="lei-lf-bar">
        <div className="lei-lf-grid">
          <form className="lei-lf-search" onSubmit={(e) => { e.preventDefault(); nav({ search: busca || undefined }); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
            <input placeholder="Ex.: apartamento, Gol" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </form>
          <select className="lei-lf-sel" value={get('categoria')} onChange={(e) => nav({ categoria: e.target.value || undefined })}>
            <option value="">Tipo de bem</option>
            {filtros.categorias?.map(opt).map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>
          <select className="lei-lf-sel" value={get('status')} onChange={(e) => nav({ status: e.target.value || undefined })}>
            {SITUACOES.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
          </select>
          <select className="lei-lf-sel" value={get('uf')} onChange={(e) => nav({ uf: e.target.value || undefined })}>
            <option value="">Localização</option>
            {filtros.ufs?.map(opt).map((o) => <option key={o.id} value={o.nome}>{o.nome}</option>)}
          </select>
          <button type="button" className="lei-lf-btn" onClick={() => setAberto((a) => !a)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="9" cy="6" r="2" fill="currentColor" /><circle cx="15" cy="12" r="2" fill="currentColor" /><circle cx="8" cy="18" r="2" fill="currentColor" /></svg>
            Filtros
          </button>
        </div>

        {aberto && (
          <div className="lei-lf-expand">
            {filtros.comitentes?.length > 0 && (
              <div>
                <div className="lei-lf-expand__lbl">Comitente</div>
                <select className="lei-lf-sel" style={{ width: '100%' }} value={get('comitente')} onChange={(e) => nav({ comitente: e.target.value || undefined })}>
                  <option value="">Todos</option>
                  {filtros.comitentes.map(opt).map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
                </select>
              </div>
            )}
            {filtros.cidades?.length > 0 && (
              <div>
                <div className="lei-lf-expand__lbl">Cidade</div>
                <select className="lei-lf-sel" style={{ width: '100%' }} value={get('cidade')} onChange={(e) => nav({ cidade: e.target.value || undefined })}>
                  <option value="">Todas</option>
                  {filtros.cidades.map(opt).map((o) => <option key={o.id} value={o.nome}>{o.nome}</option>)}
                </select>
              </div>
            )}
            <div>
              <div className="lei-lf-expand__lbl">Faixa de valor</div>
              <div className="lei-lf-faixa">
                <input placeholder="R$ mín." value={vmin} onChange={(e) => setVmin(mascaraMoedaBR(e.target.value))} inputMode="numeric" />
                <span>—</span>
                <input placeholder="R$ máx." value={vmax} onChange={(e) => setVmax(mascaraMoedaBR(e.target.value))} inputMode="numeric" />
                <button type="button" onClick={() => nav({ valorMinimo: moedaParaNumero(vmin) || undefined, valorMaximo: moedaParaNumero(vmax) || undefined })}>OK</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
