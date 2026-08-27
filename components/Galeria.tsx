'use client';
import { useState } from 'react';
import type { Foto } from '@/lib/types';
import { PLACEHOLDER } from '@/lib/img';

export default function Galeria({ fotos, alt }: { fotos: Foto[]; alt: string }) {
  const imgs = (fotos || []).map((f) => f.url || f.min || f.thumb).filter(Boolean) as string[];
  const [sel, setSel] = useState(0);
  const main = imgs[sel] || PLACEHOLDER;
  const thumbs = imgs.slice(0, 5);
  const extra = imgs.length - thumbs.length;

  return (
    <div>
      <div className="lei-gal__main">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={main} alt={alt} />
      </div>
      {imgs.length > 1 && (
        <div className="lei-gal__thumbs">
          {thumbs.map((src, i) => (
            <button key={i} onClick={() => setSel(i)} className={`lei-gal__thumb${i === sel ? ' is-active' : ''}`} aria-label={`Foto ${i + 1}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`${alt} ${i + 1}`} loading="lazy" />
            </button>
          ))}
          {extra > 0 && (
            <button onClick={() => setSel(5)} className="lei-gal__thumb lei-gal__more">+{extra}</button>
          )}
        </div>
      )}
    </div>
  );
}
