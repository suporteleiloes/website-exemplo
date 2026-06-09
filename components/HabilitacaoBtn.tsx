'use client';
import Link from 'next/link';
import { useState } from 'react';

// Fluxo de habilitação (GUIA §5.2). GET status + POST habilitar, via BFF /api/proxy.
// Endpoint real: /api/public/arrematantes/service/leiloes/{id}/habilitar (autenticado).
export default function HabilitacaoBtn({ leilaoId, logado }: { leilaoId: number; logado: boolean }) {
  const [estado, setEstado] = useState<'idle' | 'loading' | 'ok' | 'analise' | 'erro'>('idle');
  const [msg, setMsg] = useState('');
  const [aceito, setAceito] = useState(false);

  if (!logado) {
    return <Link href="/login" className="btn-primary w-full">Entrar para se habilitar</Link>;
  }

  async function habilitar() {
    setEstado('loading'); setMsg('');
    try {
      const r = await fetch(`/api/proxy/public/arrematantes/service/leiloes/${leilaoId}/habilitar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ direitoPreferencia: false, lotesPreferencia: [] }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setEstado('erro'); setMsg(d?.message || `Erro (HTTP ${r.status}).`); return; }
      if (d?.status === true) { setEstado('ok'); setMsg('Você está habilitado!'); }
      else { setEstado('analise'); setMsg('Habilitação enviada — em análise.'); }
    } catch { setEstado('erro'); setMsg('Erro de rede.'); }
  }

  return (
    <div className="space-y-2">
      <label className="flex items-start gap-2 text-xs text-gray-600">
        <input type="checkbox" checked={aceito} onChange={(e) => setAceito(e.target.checked)} className="mt-0.5" />
        Declaro que li e aceito as condições do leilão.
      </label>
      <button onClick={habilitar} disabled={!aceito || estado === 'loading'} className="btn-primary w-full disabled:opacity-50">
        {estado === 'loading' ? 'Enviando…' : 'Habilitar-se neste leilão'}
      </button>
      {msg && (
        <p className={`rounded p-2 text-sm ${estado === 'ok' ? 'bg-green-50 text-green-700' : estado === 'erro' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{msg}</p>
      )}
    </div>
  );
}
