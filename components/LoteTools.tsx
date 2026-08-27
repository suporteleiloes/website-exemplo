'use client';
import { useState } from 'react';

// Botões Compartilhar + Favoritar do topo da página do lote (porta os do template html).
export default function LoteTools({ url, titulo }: { url: string; titulo: string }) {
  const [fav, setFav] = useState(false);
  const [copiado, setCopiado] = useState(false);

  async function compartilhar() {
    const full = typeof window !== 'undefined' ? `${window.location.origin}${url}` : url;
    try {
      if (navigator.share) { await navigator.share({ title: titulo, url: full }); return; }
      await navigator.clipboard.writeText(full);
      setCopiado(true); setTimeout(() => setCopiado(false), 1800);
    } catch { /* cancelado */ }
  }

  return (
    <div className="lei-lote-tools">
      <button type="button" className="lei-lote-tool" onClick={compartilhar}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand-accent-ink)" strokeWidth="2"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" /></svg>
        {copiado ? 'Link copiado' : 'Compartilhar'}
      </button>
      <button type="button" className={`lei-lote-tool${fav ? ' is-on' : ''}`} onClick={() => setFav((v) => !v)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2"><path d="M12 21C5 14 3 9.5 6 6.5 8 4.5 11 5 12 7c1-2 4-2.5 6-.5 3 3 1 7.5-6 14.5z" /></svg>
        Favoritar
      </button>
    </div>
  );
}
