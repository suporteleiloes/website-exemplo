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

// Registra 1 visita ao lote ao abrir a página (client-side, pra não contar prefetch/bot do SSR).
export default function RegistrarVisita({ loteId }: { loteId: number }) {
  const disparado = useRef(false);
  useEffect(() => {
    if (disparado.current || !loteId) return;
    disparado.current = true;
    fetch(`/api/proxy/website/v2/lotes/${loteId}/visita`, {
      method: 'POST',
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ v: visitorId() }),
    }).catch(() => {});
  }, [loteId]);
  return null;
}
