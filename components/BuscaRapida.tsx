'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function BuscaRapida({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); router.push(`/lotes?search=${encodeURIComponent(q)}`); }}
      className={compact ? 'flex w-full gap-2' : 'flex w-full max-w-xl gap-2'}
    >
      <input
        className="input"
        placeholder="Buscar lote, veículo, imóvel…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        aria-label="Busca rápida"
      />
      <button type="submit" className="btn-primary whitespace-nowrap">Buscar</button>
    </form>
  );
}
