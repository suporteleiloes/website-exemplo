'use client';
import { useEffect, useRef } from 'react';
import { API_BASE, TENANT } from '@/lib/config';

// Leilão "Em leilão" (pregão rodando): não conta visita — é o pico de acesso e o número não
// ajuda ninguém durante o pregão.
const LEILAO_EM_PREGAO = 4;

// ID persistente do visitante (por browser) usado no anti-repetição da visita (a mesma pessoa
// no mesmo lote conta de novo após 60 s). Não é dado pessoal.
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

/**
 * Registra 1 visita ao abrir a página (client-side, pra não contar prefetch/bot do SSR).
 * Vai DIRETO do navegador para a borda da Cloudflare (`/api/website/v2/visitas/registrar`):
 * responde 204 na hora e a borda manda em lote para a API — sem BFF, sem PHP por clique.
 * `text/plain` = sem preflight; o tenant vai no corpo (`mi`) porque o sendBeacon não manda header.
 * Ver GUIA-WEBSITE-V2 → "Visitas".
 */
export default function RegistrarVisita({ tipo = 'lote', id, leilaoStatus }: { tipo?: 'lote' | 'leilao'; id: number; leilaoStatus?: number | null }) {
  const disparado = useRef(false);
  useEffect(() => {
    if (disparado.current || !id || Number(leilaoStatus) === LEILAO_EM_PREGAO) return;
    disparado.current = true;
    const url = `${API_BASE}/api/website/v2/visitas/registrar`;
    const corpo = JSON.stringify({ t: tipo, id, v: visitorId(), mi: TENANT });
    try {
      if (navigator.sendBeacon?.(url, new Blob([corpo], { type: 'text/plain' }))) return;
    } catch {
      /* cai pro fetch */
    }
    fetch(url, { method: 'POST', keepalive: true, cache: 'no-store', credentials: 'omit', headers: { 'Content-Type': 'text/plain' }, body: corpo }).catch(() => {});
  }, [tipo, id, leilaoStatus]);
  return null;
}
