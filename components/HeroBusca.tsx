'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { FacetItem } from '@/lib/types';

// Card de busca do hero (Home). Monta a query e leva para /leiloes, como a busca de hoje.
// Inclui a linha "Mais filtros" (modalidade, comitente, faixa de valor, nº) e "somente com foto".
export default function HeroBusca({ categorias, ufs, comitentes }: { categorias: FacetItem[]; ufs: FacetItem[]; comitentes: FacetItem[] }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [uf, setUf] = useState('');
  const [mod, setMod] = useState('');
  const [com, setCom] = useState('');
  const [vmin, setVmin] = useState('');
  const [vmax, setVmax] = useState('');
  const [num, setNum] = useState('');
  const [comFoto, setComFoto] = useState(false);
  const [mais, setMais] = useState(false);

  function pesquisar(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q.trim()) p.set('busca', q.trim());
    if (cat) p.set('categoria', cat);
    if (uf) p.set('uf', uf);
    if (mod) p.set('natureza', mod);
    if (com) p.set('comitente', com);
    if (vmin) p.set('valorMin', vmin);
    if (vmax) p.set('valorMax', vmax);
    if (num) p.set('numero', num);
    if (comFoto) p.set('comFoto', '1');
    const qs = p.toString();
    router.push(`/leiloes${qs ? `?${qs}` : ''}`);
  }

  return (
    <form className="lei-search" onSubmit={pesquisar}>
      <div className="lei-search__row">
        <div className="lei-field" style={{ minWidth: 190 }}>
          <label>Palavra-chave</label>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Bem, comitente ou nº do processo" />
        </div>
        <div className="lei-field">
          <label>Categoria</label>
          <select value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">Todas as categorias</option>
            {categorias.map((c) => <option key={String(c.id ?? c.nome)} value={String(c.id ?? c.nome)}>{c.nome}{c.total != null ? ` (${c.total})` : ''}</option>)}
          </select>
        </div>
        <div className="lei-field">
          <label>Localização</label>
          <select value={uf} onChange={(e) => setUf(e.target.value)}>
            <option value="">Todo o Brasil</option>
            {ufs.map((u) => <option key={String(u.id ?? u.nome)} value={String(u.id ?? u.nome)}>{u.nome}{u.total != null ? ` (${u.total})` : ''}</option>)}
          </select>
        </div>
        <button type="submit" className="lei-search__submit">Pesquisar</button>
      </div>

      {mais && (
        <div className="lei-search__row" style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #edeae2' }}>
          <div className="lei-field">
            <label>Modalidade</label>
            <select value={mod} onChange={(e) => setMod(e.target.value)}>
              <option value="">Todas as modalidades</option>
              <option value="judicial">Judicial</option>
              <option value="extrajudicial">Extrajudicial</option>
              <option value="vendaDireta">Venda direta</option>
            </select>
          </div>
          <div className="lei-field">
            <label>Comitente</label>
            <select value={com} onChange={(e) => setCom(e.target.value)}>
              <option value="">Todos os comitentes</option>
              {comitentes.map((c) => <option key={String(c.id ?? c.nome)} value={String(c.id ?? c.nome)}>{c.nome}{c.total != null ? ` (${c.total})` : ''}</option>)}
            </select>
          </div>
          <div className="lei-field">
            <label>Faixa de valor</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <input value={vmin} onChange={(e) => setVmin(e.target.value)} placeholder="R$ 0,00" inputMode="numeric" />
              <span style={{ fontSize: 13.5, color: '#6b6a63', flex: 'none' }}>até</span>
              <input value={vmax} onChange={(e) => setVmax(e.target.value)} placeholder="R$ 0,00" inputMode="numeric" />
            </div>
          </div>
          <div className="lei-field">
            <label>Nº do lote ou leilão</label>
            <input value={num} onChange={(e) => setNum(e.target.value)} placeholder="Ex.: 0148 ou 03" />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', marginTop: 14 }}>
        <button type="button" onClick={() => setMais((v) => !v)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--brand-accent-ink)', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', padding: 0 }}>
          {mais ? 'Menos filtros' : 'Mais filtros'}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" style={{ transform: mais ? 'rotate(180deg)' : 'none', transition: 'transform .15s' }}><path d="M6 9l6 6 6-6" /></svg>
        </button>
        <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13.5, color: '#5a6270', cursor: 'pointer' }}>
          <input type="checkbox" checked={comFoto} onChange={(e) => setComFoto(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--brand-primary)' }} />
          Somente lotes com foto
        </label>
      </div>
    </form>
  );
}
