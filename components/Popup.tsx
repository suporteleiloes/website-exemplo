'use client';
import { useEffect, useState } from 'react';
import type { Banner } from '@/lib/types';
import { urlImagem } from '@/lib/img';

// Popup promocional = Banner secao='popup' (GUIA §3). Mostra 1x por sessão.
export default function Popup({ banners }: { banners: Banner[] }) {
  const [aberto, setAberto] = useState(false);
  const b = banners.find((x) => urlImagem(x.image, 'full'));

  useEffect(() => {
    if (!b) return;
    if (sessionStorage.getItem('popup_visto')) return;
    setAberto(true);
    sessionStorage.setItem('popup_visto', '1');
  }, [b]);

  if (!aberto || !b) return null;
  const img = urlImagem(b.image, 'full')!;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setAberto(false)}>
      <div className="relative max-w-lg" onClick={(e) => e.stopPropagation()}>
        <button onClick={() => setAberto(false)} aria-label="Fechar"
          className="absolute -right-3 -top-3 h-8 w-8 rounded-full bg-white text-gray-700 shadow">✕</button>
        {b.url ? (
          <a href={b.url}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={img} alt={b.titulo || 'promo'} className="rounded-lg" /></a>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt={b.titulo || 'promo'} className="rounded-lg" />
        )}
      </div>
    </div>
  );
}
