'use client';
import { useState } from 'react';
import type { Foto } from '@/lib/types';
import { PLACEHOLDER } from '@/lib/img';

export default function Galeria({ fotos, alt }: { fotos: Foto[]; alt: string }) {
  const imgs = (fotos || []).map((f) => f.url || f.min || f.thumb).filter(Boolean) as string[];
  const [sel, setSel] = useState(0);
  const main = imgs[sel] || PLACEHOLDER;

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={main} alt={alt} className="h-72 w-full object-contain sm:h-96" />
      </div>
      {imgs.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {imgs.map((src, i) => (
            <button key={i} onClick={() => setSel(i)}
              className={`h-16 w-20 flex-none overflow-hidden rounded border ${i === sel ? 'border-marca ring-1 ring-marca' : 'border-gray-200'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${alt} ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
