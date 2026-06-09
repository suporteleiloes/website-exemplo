'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { moeda } from '@/lib/format';
import { connectRealtime, type RealtimeEvent } from '@/lib/realtime';
import type { LancePublico } from '@/lib/types';

interface Props {
  loteId: number;
  leilaoId: number;
  valorInicial: number | null;
  valorIncremento: number | null;
  valorLanceAtual: number | null;
  totalLances: number | null;
  podeLance: boolean;       // leilão em status 3/4
  logado: boolean;
  loginHash?: string;
  clientId?: string;
}

// Área de lance + histórico + tempo real. Lance é REST (POST via BFF /api/proxy);
// o WebSocket só atualiza a tela (GUIA §5.3, §9). Sem WS → polling do snapshot público.
export default function LanceBox(p: Props) {
  const [atual, setAtual] = useState<number | null>(p.valorLanceAtual ?? p.valorInicial);
  const [total, setTotal] = useState<number>(p.totalLances ?? 0);
  const [lances, setLances] = useState<LancePublico[]>([]);
  const incremento = p.valorIncremento || 0;
  const proximo = (atual ?? 0) + (incremento || 0);
  const [valor, setValor] = useState<string>(String(proximo || ''));
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const [rtOn, setRtOn] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function carregarLances() {
    try {
      const r = await fetch(`/api/proxy/website/v2/lotes/${p.loteId}/lances-publicos`, { cache: 'no-store' });
      if (!r.ok) return;
      const d = await r.json();
      if (Array.isArray(d?.result)) {
        setLances(d.result);
        setTotal(d.total ?? d.result.length);
        if (d.result[0]?.valor) setAtual(d.result[0].valor);
      }
    } catch { /* ignora */ }
  }

  useEffect(() => {
    carregarLances();
    // Tempo real: atualiza ao receber evento `lance` deste lote; senão faz polling.
    const h = connectRealtime({
      loginHash: p.loginHash,
      clientId: p.clientId,
      onStatus: (s) => setRtOn(s === 'open'),
      onEvent: (ev: RealtimeEvent) => {
        const d: any = ev.data || {};
        const loteEv = d.lote?.id ?? d.pregao?.lote?.id;
        if (ev.type === 'lance' && loteEv === p.loteId) {
          const lc = d.lote?.lance;
          if (lc?.valor) setAtual(lc.valor);
          carregarLances();
        }
        if ((ev.type === 'lancesZerados' || ev.type === 'lanceDeletado') && loteEv === p.loteId) carregarLances();
      },
    });
    if (!h.enabled) {
      pollRef.current = setInterval(carregarLances, 8000); // fallback polling
    }
    return () => { h.close(); if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.loteId]);

  async function enviarLance(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setEnviando(true);
    try {
      const r = await fetch(`/api/proxy/lotes/${p.loteId}/lance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor: Number(valor) }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMsg({ tipo: 'erro', texto: d?.message || `Não foi possível enviar o lance (HTTP ${r.status}).` });
      } else {
        setMsg({ tipo: 'ok', texto: 'Lance enviado!' });
        carregarLances();
      }
    } catch (err) {
      setMsg({ tipo: 'erro', texto: 'Erro de rede ao enviar lance.' });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs text-gray-500">{atual ? 'Lance atual' : 'Lance inicial'}</p>
          <p className="text-2xl font-bold text-marca">{moeda(atual)}</p>
          <p className="text-xs text-gray-500">{total} lance(s){incremento ? ` · incremento ${moeda(incremento)}` : ''}</p>
        </div>
        <span className={`badge ${rtOn ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
          {rtOn ? '● ao vivo' : '○ atualização periódica'}
        </span>
      </div>

      <div className="mt-4">
        {!p.podeLance ? (
          <p className="rounded bg-gray-50 p-3 text-sm text-gray-600">Este leilão não está aberto para lances no momento.</p>
        ) : !p.logado ? (
          <Link href="/login" className="btn-primary w-full">Entrar para dar lance</Link>
        ) : (
          <form onSubmit={enviarLance} className="space-y-2">
            <label className="label">Seu lance (mín. {moeda(proximo)})</label>
            <div className="flex gap-2">
              <input className="input" value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" />
              <button type="submit" className="btn-destaque whitespace-nowrap" disabled={enviando}>
                {enviando ? 'Enviando…' : 'Dar lance'}
              </button>
            </div>
            <p className="text-xs text-gray-400">Requer habilitação no leilão. A API valida habilitação/regras e retorna erro se não permitido.</p>
          </form>
        )}
        {msg && (
          <p className={`mt-2 rounded p-2 text-sm ${msg.tipo === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.texto}</p>
        )}
      </div>

      <div className="mt-4">
        <p className="mb-1 text-sm font-semibold text-gray-700">Histórico de lances</p>
        {lances.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum lance ainda.</p>
        ) : (
          <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
            {lances.map((l, i) => (
              <li key={i} className="flex justify-between border-b border-gray-100 py-1">
                <span className="text-gray-600">{l.apelido || 'Licitante'}</span>
                <span className="font-semibold">{moeda(l.valor)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
