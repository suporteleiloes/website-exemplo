'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { moeda, data as dataBR, hora, prazoLeilao } from '@/lib/format';
import { connectRealtime, criarDedup, type RealtimeEvent } from '@/lib/realtime';
import type { LancePublico } from '@/lib/types';

interface LinhaValor { k: string; sub?: string; v: string; tipo?: 'aval'; off?: boolean }
interface Props {
  loteId: number;
  leilaoId: number;
  valorInicial: number | null;
  valorIncremento: number | null;
  valorLanceAtual: number | null;
  totalLances: number | null;
  podeLance: boolean;
  logado: boolean;
  loginHash?: string;
  clientId?: string;
  realtimeUrl?: string;
  dataEncerra?: string | null;
  status?: number;
  vendaDireta?: boolean;
  dataLimitePropostas?: string | null;
  statusLabel?: string;
  linhas?: LinhaValor[];
  statsVisitas?: number;
  habilitados?: number;
}

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  const s = Math.floor(ms / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60, ended: ms <= 0 };
}

const fmtBRL = (n: number) => (n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const maskBRL = (v: string) => {
  const d = v.replace(/\D/g, '');
  return d ? (parseInt(d, 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
};
const parseBRL = (v: string) => {
  const d = v.replace(/\D/g, '');
  return d ? parseInt(d, 10) / 100 : 0;
};
const plural = (n: number, sing: string, plur: string) => `${n} ${n === 1 ? sing : plur}`;

export default function LanceBoxLote(p: Props) {
  const [atual, setAtual] = useState<number | null>(p.valorLanceAtual ?? p.valorInicial);
  const [total, setTotal] = useState<number>(p.totalLances ?? 0);
  const incremento = p.valorIncremento || 0;
  const proximo = (atual ?? 0) + (incremento || 0);
  const [valor, setValor] = useState<string>(proximo ? fmtBRL(proximo) : '');
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const prazo = prazoLeilao(p.status ?? 0, p.dataEncerra ?? null);
  const alvo = p.dataEncerra ? new Date(p.dataEncerra).getTime() : 0;
  const [tick, setTick] = useState(alvo ? diff(alvo) : null);
  useEffect(() => {
    if (!alvo) return;
    const iv = setInterval(() => setTick(diff(alvo)), 1000);
    return () => clearInterval(iv);
  }, [alvo]);

  async function carregarLances() {
    try {
      const r = await fetch(`/api/proxy/website/v2/lotes/${p.loteId}/lances-publicos`, { cache: 'no-store' });
      if (!r.ok) return;
      const d = await r.json();
      if (Array.isArray(d?.result)) {
        setTotal(d.total ?? d.result.length);
        if (d.result[0]?.valor) setAtual(d.result[0].valor);
      }
    } catch { /* ignora */ }
  }

  useEffect(() => {
    carregarLances();
    const novo = criarDedup();
    const h = connectRealtime({
      url: p.realtimeUrl, loginHash: p.loginHash, clientId: p.clientId,
      channels: [`leilao:${p.leilaoId}`],
      onEvent: (ev: RealtimeEvent) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const d: any = ev.data || {};
        const loteEv = d.lote?.id ?? d.pregao?.lote?.id;
        if (ev.type === 'lance' && loteEv === p.loteId) {
          const lc = d.lote?.lance;
          if (!novo(lc?.id)) return;
          if (lc?.valor) setAtual(lc.valor);
          carregarLances();
        }
        if ((ev.type === 'lancesZerados' || ev.type === 'lanceDeletado') && loteEv === p.loteId) carregarLances();
      },
    });
    if (!h.enabled) pollRef.current = setInterval(carregarLances, 8000);
    return () => { h.close(); if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.loteId, p.leilaoId]);

  async function enviarLance(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null); setEnviando(true);
    try {
      const r = await fetch(`/api/proxy/lotes/${p.loteId}/lance`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ valor: parseBRL(valor) }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        if (typeof d?.message === 'string' && d.message.includes('#ER-COMMIT')) {
          await carregarLances();
          setMsg({ tipo: 'erro', texto: 'Outro lance chegou primeiro. O valor foi atualizado — tente novamente.' });
        } else {
          setMsg({ tipo: 'erro', texto: d?.message || `Não foi possível enviar o lance (HTTP ${r.status}).` });
        }
      } else {
        setMsg({ tipo: 'ok', texto: 'Lance enviado!' });
        carregarLances();
      }
    } catch {
      setMsg({ tipo: 'erro', texto: 'Erro de rede ao enviar lance.' });
    } finally { setEnviando(false); }
  }

  return (
    <>
      {p.vendaDireta ? (
        <div className="lei-lp-timer">
          <p className="lei-lp-timer__vd">Venda Direta</p>
          <div className="lei-lp-timer__lbl">Envie sua proposta até <strong>{dataBR(p.dataLimitePropostas || p.dataEncerra)}</strong></div>
        </div>
      ) : alvo > 0 && tick && prazo.modo === 'contador' ? (
        <div className="lei-lp-timer">
          <div className="lei-lp-timer__lbl">{prazo.rotulo} <strong>{dataBR(p.dataEncerra)}</strong> a partir das <strong>{hora(p.dataEncerra)}</strong></div>
          <div className="lei-lp-count">
            {[['d', 'Dias'], ['h', 'Horas'], ['m', 'Minutos'], ['s', 'Segundos']].map(([k, u]) => (
              <div className="lei-lp-count__box" key={k}>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <span className="lei-lp-count__n" suppressHydrationWarning>{String((tick as any)[k]).padStart(2, '0')}</span>
                <span className="lei-lp-count__u">{u}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="lei-lp-timer">
          <div className="lei-lp-timer__lbl">{prazo.rotulo}{prazo.modo === 'data' && p.dataEncerra ? <> <strong>{dataBR(p.dataEncerra)}</strong></> : null}</div>
        </div>
      )}

      <div className="lei-lp-stats">
        <span title="Visitas">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></svg>
          {plural(p.statsVisitas ?? 0, 'visita', 'visitas')}
        </span>
        <span title="Participantes">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          {plural(p.habilitados ?? 0, 'participante', 'participantes')}
        </span>
        <span title="Lances">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m14 13-8.5 8.5a2.1 2.1 0 0 1-3-3L11 10" /><path d="m16 16 6-6" /><path d="m9 7 8 8" /></svg>
          {plural(total, 'lance', 'lances')}
        </span>
      </div>

      <div className="lei-lp-rows">
        {(p.linhas || []).map((l, i) => (
          <div className={`lei-lp-row${l.tipo === 'aval' ? ' lei-lp-row--aval' : ''}${l.off ? ' is-off' : ''}`} key={i}>
            <div className="lei-lp-row__k">{l.k}{l.sub ? <small>{l.sub}</small> : null}</div>
            <div className="lei-lp-row__v">{l.v}</div>
          </div>
        ))}
        <div className="lei-lp-row lei-lp-row--atual">
          <div className="lei-lp-row__k">Lance atual</div>
          <div className="lei-lp-row__v">{total > 0 ? moeda(atual) : '—'}</div>
        </div>
        {p.statusLabel && (
          <div className="lei-lp-row">
            <div className="lei-lp-row__k">Status do Lote</div>
            <div className="lei-lp-row__v" style={{ color: [1, 2, 3, 4].includes(p.status ?? 0) ? '#1f7a44' : 'var(--color-danger)' }}><strong>{p.statusLabel}</strong></div>
          </div>
        )}
      </div>

      <div className="lei-lp-form">
        {!p.podeLance ? (
          <div className="lei-lp-msg" style={{ background: '#f6f7f5', color: '#5a6270' }}>Este leilão não está aberto para lances no momento.</div>
        ) : !p.logado ? (
          <Link href="/login" className="lei-lp-cta">Entrar para dar lance</Link>
        ) : (
          <form onSubmit={enviarLance}>
            <div className="lei-lp-form__row">
              <input value={valor} onChange={(e) => setValor(maskBRL(e.target.value))} inputMode="decimal" />
              <button type="submit" className="lei-lp-cta lei-lp-cta--bid" disabled={enviando}>
                {enviando ? 'Enviando…' : 'Dar lance'}
              </button>
            </div>
            <p className="lei-lp-note">Lance mínimo {moeda(proximo)}. Requer habilitação no leilão.</p>
          </form>
        )}
        {msg && <div className={`lei-lp-msg ${msg.tipo}`}>{msg.texto}</div>}
      </div>
    </>
  );
}
