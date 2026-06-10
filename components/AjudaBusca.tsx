'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** Busca da Central de Ajuda — submete navegando pra /ajuda?busca=... (SSR refaz a query). */
export default function AjudaBusca({ initial = '' }: { initial?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = q.trim();
    router.push(v ? `/ajuda?busca=${encodeURIComponent(v)}` : '/ajuda');
  }

  return (
    <form onSubmit={submit} className="mx-auto mt-7 flex w-full max-w-xl items-center gap-2 rounded-2xl bg-white/95 p-1.5 shadow-xl shadow-black/10 ring-1 ring-black/5">
      <svg className="ml-3 h-5 w-5 shrink-0 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        type="search"
        placeholder="Buscar artigos, dúvidas, como fazer…"
        className="min-w-0 flex-1 bg-transparent px-1 py-2.5 text-[15px] text-gray-800 outline-none placeholder:text-gray-400"
        autoComplete="off"
      />
      <button type="submit" className="shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110" style={{ background: 'var(--cor-primaria, #15224B)' }}>
        Buscar
      </button>
    </form>
  );
}
