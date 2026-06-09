'use client';
import { useEffect, useState } from 'react';
import type { Banner as TBanner } from '@/lib/types';
import { urlImagem } from '@/lib/img';

// Carrossel simples de banners (secao=home). Auto-rotaciona quando há mais de um.
export default function Banner({ banners }: { banners: TBanner[] }) {
  const [i, setI] = useState(0);
  const valid = banners.filter((b) => urlImagem(b.image, 'full'));
  useEffect(() => {
    if (valid.length <= 1) return;
    const t = setInterval(() => setI((x) => (x + 1) % valid.length), 5000);
    return () => clearInterval(t);
  }, [valid.length]);

  if (valid.length === 0) {
    // Fallback institucional quando o tenant não tem banners.
    return (
      <div className="rounded-xl bg-gradient-to-r from-marca to-marca-2 p-10 text-white">
        <h1 className="text-2xl font-bold sm:text-3xl">Leilões com segurança e transparência</h1>
        <p className="mt-2 max-w-2xl text-white/90">Veículos, imóveis e oportunidades. Participe online dos nossos leilões.</p>
      </div>
    );
  }

  const b = valid[i];
  const img = urlImagem(b.image, 'full')!;
  const inner = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={img} alt={b.titulo || 'banner'} className="h-48 w-full rounded-xl object-cover sm:h-64 md:h-80" />
  );
  return (
    <div className="relative">
      {b.url ? <a href={b.url}>{inner}</a> : inner}
      {valid.length > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
          {valid.map((_, k) => (
            <button key={k} aria-label={`Banner ${k + 1}`} onClick={() => setI(k)}
              className={`h-2 w-2 rounded-full ${k === i ? 'bg-white' : 'bg-white/50'}`} />
          ))}
        </div>
      )}
    </div>
  );
}
