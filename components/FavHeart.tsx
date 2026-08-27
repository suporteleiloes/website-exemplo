'use client';
import { useState } from 'react';

// Botão de favoritar (visual) no card do lote. Fica dentro do <Link> do card, então
// preventDefault/stopPropagation evitam navegar ao clicar no coração.
export default function FavHeart() {
  const [on, setOn] = useState(false);
  return (
    <button
      type="button"
      aria-label="Favoritar lote"
      className={`lei-lote__fav${on ? ' is-on' : ''}`}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOn((v) => !v); }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill={on ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M12 21C5 14 3 9.5 6 6.5 8 4.5 11 5 12 7c1-2 4-2.5 6-.5 3 3 1 7.5-6 14.5z" />
      </svg>
    </button>
  );
}
