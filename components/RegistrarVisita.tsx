'use client';
import { useEffect, useRef } from 'react';

// ID persistente do visitante (por browser) usado no anti-flood da visita — o IP não serve
// porque o site faz proxy (todos chegam com o mesmo IP na API).
function visitorId(): string {
  try {
    let v = localStorage.getItem('sl_visitor');
    if (!v) {
      v = (crypto?.randomUUID?.() || String(Date.now()) + Math.floor(Math.random() * 1e9).toString(36)).replace(/[^a-zA-Z0-9-]/g, '');
      localStorage.setItem('sl_visitor', v);
    }
    return v;
  } catch {
    return '';
  }
}

// Registra 1 visita ao abrir a página (client-side, pra não contar prefetch/bot do SSR).
// tipo 'lote' → statsVisitas do lote; tipo 'leilao' → statsVisitas do leilão.
export default function RegistrarVisita({ tipo = 'lote', id }: { tipo?: 'lote' | 'leilao'; id: number }) {
  const disparado = useRef(false);
  useEffect(() => {
    if (disparado.current || !id) return;
    disparado.current = true;
    const path = tipo === 'leilao' ? `leiloes/${id}/visita` : `lotes/${id}/visita`;
    fetch(`/api/proxy/website/v2/${path}`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ v: visitorId() }),
    }).catch(() => {});
  }, [tipo, id]);
  return null;
}
