'use client';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState } from 'react';
import type { Filtros, FacetItem } from '@/lib/types';

const opt = (f: FacetItem) => ({ id: String(f.id ?? f.value ?? ''), nome: f.nome || f.label || String(f.id ?? f.value) });

// Filtros ricos de LOTES (API /lotes). Reutilizado na busca e dentro do leilão.
// Preserva o param `leilao` quando presente (filtrar lotes de um leilão específico).
export default function FiltrosLotes({ filtros }: { filtros: Filtros }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const get = (k: string) => sp.get(k) || '';

  const [st, setSt] = useState({
    search: get('search'), categoria: get('categoria'), subcategoria: get('subcategoria'),
    uf: get('uf'), cidade: get('cidade'), comitente: get('comitente'),
    valorMinimo: get('valorMinimo'), valorMaximo: get('valorMaximo'), sortBy: get('sortBy') || 'numero',
  });
  const set = (k: string, v: string) => setSt((s) => ({ ...s, [k]: v }));

  function aplicar(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams();
    const leilao = sp.get('leilao');
    if (leilao) q.set('leilao', leilao);
    Object.entries(st).forEach(([k, v]) => { if (v) q.set(k, v); });
    router.push(`${pathname}?${q.toString()}`);
  }

  return (
    <form onSubmit={aplicar} className="space-y-3 rounded-lg border border-gray-200 bg-white p-4">
      <div>
        <label className="label">Busca</label>
        <input className="input" value={st.search} onChange={(e) => set('search', e.target.value)} placeholder="Título, descrição…" />
      </div>
      <div>
        <label className="label">Categoria</label>
        <select className="input" value={st.categoria} onChange={(e) => set('categoria', e.target.value)}>
          <option value="">Todas</option>
          {filtros.categorias?.map(opt).map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
        </select>
      </div>
      {filtros.subcategorias?.length > 0 && (
        <div>
          <label className="label">Subcategoria</label>
          <select className="input" value={st.subcategoria} onChange={(e) => set('subcategoria', e.target.value)}>
            <option value="">Todas</option>
            {filtros.subcategorias.map(opt).map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">UF</label>
          <select className="input" value={st.uf} onChange={(e) => set('uf', e.target.value)}>
            <option value="">Todas</option>
            {filtros.ufs?.map(opt).map((o) => <option key={o.id} value={o.nome}>{o.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Cidade</label>
          <input className="input" value={st.cidade} onChange={(e) => set('cidade', e.target.value)} placeholder="Cidade" />
        </div>
      </div>
      {filtros.comitentes?.length > 0 && (
        <div>
          <label className="label">Comitente</label>
          <select className="input" value={st.comitente} onChange={(e) => set('comitente', e.target.value)}>
            <option value="">Todos</option>
            {filtros.comitentes.map(opt).map((o) => <option key={o.id} value={o.id}>{o.nome}</option>)}
          </select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="label">Valor mín.</label>
          <input className="input" value={st.valorMinimo} onChange={(e) => set('valorMinimo', e.target.value)} inputMode="numeric" />
        </div>
        <div>
          <label className="label">Valor máx.</label>
          <input className="input" value={st.valorMaximo} onChange={(e) => set('valorMaximo', e.target.value)} inputMode="numeric" />
        </div>
      </div>
      <div>
        <label className="label">Ordenar por</label>
        <select className="input" value={st.sortBy} onChange={(e) => set('sortBy', e.target.value)}>
          <option value="numero">Número do lote</option>
          <option value="menorValor">Menor preço</option>
          <option value="maiorValor">Maior preço</option>
          <option value="maisVistos">Mais vistos</option>
        </select>
      </div>
      <button type="submit" className="btn-primary w-full">Aplicar filtros</button>
    </form>
  );
}
