'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

const SITUACOES = [
  { v: '', label: 'Situação' },
  { v: 'andamento', label: 'Em andamento' },
  { v: 'proximos', label: 'Próximos' },
  { v: 'encerrados', label: 'Encerrados' },
];
const NATUREZAS = [
  { v: '', label: 'Natureza' },
  { v: 'judicial', label: 'Judicial' },
  { v: 'extrajudicial', label: 'Extrajudicial' },
  { v: 'vendaDireta', label: 'Venda direta' },
];
const SORTS = [
  { v: 'dataProximoLeilao', label: 'Data do leilão' },
  { v: 'codigo', label: 'Código' },
  { v: 'totalLotes', label: 'Nº de lotes' },
];

// Barra horizontal de filtros da LISTAGEM de leilões (estilo template). Escreve nos searchParams.
export default function FiltroBarLeilao({ total }: { total: number }) {
  const router = useRouter();
  const sp = useSearchParams();
  const get = (k: string) => sp.get(k) || '';
  const [busca, setBusca] = useState(get('search'));
  const [ano, setAno] = useState(get('ano'));

  function nav(patch: Record<string, string | undefined>) {
    const q = new URLSearchParams(sp.toString());
    q.delete('page');
    for (const [k, v] of Object.entries(patch)) { if (v) q.set(k, v); else q.delete(k); }
    router.push(`/leiloes?${q.toString()}`);
  }

  return (
    <>
      <div className="lei-lf-toolbar">
        <span className="lei-lf-count"><b>{total}</b> {total === 1 ? 'leilão' : 'leilões'}</span>
        <div className="lei-lf-toolbar__right">
          <select className="lei-lf-sort" value={get('sortBy') || 'dataProximoLeilao'} onChange={(e) => nav({ sortBy: e.target.value })}>
            {SORTS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="lei-lf-bar">
        <div className="lei-lf-grid">
          <form className="lei-lf-search" onSubmit={(e) => { e.preventDefault(); nav({ search: busca || undefined }); }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4-4" /></svg>
            <input placeholder="Título do leilão…" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </form>
          <select className="lei-lf-sel" value={get('situacao')} onChange={(e) => nav({ situacao: e.target.value || undefined })}>
            {SITUACOES.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
          </select>
          <select className="lei-lf-sel" value={get('natureza')} onChange={(e) => nav({ natureza: e.target.value || undefined })}>
            {NATUREZAS.map((s) => <option key={s.v} value={s.v}>{s.label}</option>)}
          </select>
          <input className="lei-lf-sel" placeholder="Ano (ex.: 2026)" value={ano} inputMode="numeric"
            onChange={(e) => setAno(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') nav({ ano: ano || undefined }); }}
            onBlur={() => { if (ano !== get('ano')) nav({ ano: ano || undefined }); }} />
        </div>
      </div>
    </>
  );
}
