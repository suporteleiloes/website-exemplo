'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

// Filtros da listagem de LEILÕES — só os que a API /leiloes realmente suporta.
// (UF/cidade/categoria filtram LOTES, não leilões — ver PENDENCIAS-API.md.)
export default function FiltrosLeiloes() {
  const router = useRouter();
  const sp = useSearchParams();
  const [search, setSearch] = useState(sp.get('search') || '');
  const [situacao, setSituacao] = useState(sp.get('situacao') || '');
  const [natureza, setNatureza] = useState(sp.get('natureza') || '');
  const [ano, setAno] = useState(sp.get('ano') || '');
  const [ordenar, setOrdenar] = useState(sp.get('sortBy') || 'dataProximoLeilao');

  function aplicar(e: React.FormEvent) {
    e.preventDefault();
    const q = new URLSearchParams();
    if (search) q.set('search', search);
    if (situacao) q.set('situacao', situacao);
    if (natureza) q.set('natureza', natureza);
    if (ano) q.set('ano', ano);
    if (ordenar) q.set('sortBy', ordenar);
    router.push(`/leiloes?${q.toString()}`);
  }

  return (
    <form onSubmit={aplicar} className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      <div>
        <label className="label">Busca</label>
        <input className="input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Título do leilão…" />
      </div>
      <div>
        <label className="label">Situação</label>
        <select className="input" value={situacao} onChange={(e) => setSituacao(e.target.value)}>
          <option value="">Todas</option>
          <option value="andamento">Em andamento</option>
          <option value="proximos">Próximos</option>
          <option value="encerrados">Encerrados</option>
        </select>
      </div>
      <div>
        <label className="label">Natureza</label>
        <select className="input" value={natureza} onChange={(e) => setNatureza(e.target.value)}>
          <option value="">Todas</option>
          <option value="judicial">Judicial</option>
          <option value="extrajudicial">Extrajudicial</option>
          <option value="vendaDireta">Venda direta</option>
        </select>
      </div>
      <div>
        <label className="label">Ano</label>
        <input className="input" value={ano} onChange={(e) => setAno(e.target.value)} placeholder="2026" inputMode="numeric" />
      </div>
      <div>
        <label className="label">Ordenar por</label>
        <select className="input" value={ordenar} onChange={(e) => setOrdenar(e.target.value)}>
          <option value="dataProximoLeilao">Data do leilão</option>
          <option value="codigo">Código</option>
          <option value="totalLotes">Nº de lotes</option>
        </select>
      </div>
      <button type="submit" className="btn-primary w-full">Aplicar filtros</button>
    </form>
  );
}
