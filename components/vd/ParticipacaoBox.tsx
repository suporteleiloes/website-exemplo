'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { moeda, dataHora } from '@/lib/format';
import type { Modos, OfertaPublica } from '@/lib/vd';

interface Props {
  anuncioId: number;
  precoMinimo: number | null;
  ofertaAtual: number | null;
  totalOfertas: number;
  incremento: number | null;
  modos: Modos;
  podeParticipar: boolean; // evento não encerrado e item disponível
  vendido?: boolean;       // item já vendido (status 100)
  logado: boolean;
}

type Aba = 'oferta' | 'compraDireta' | 'proposta';

// Caixa de participação na venda direta. Sem termos de leilão.
// As 3 modalidades (oferta / compre já / proposta) seguem o que o evento habilita.
export default function ParticipacaoBox(p: Props) {
  const abas: Aba[] = [];
  if (p.modos.oferta) abas.push('oferta');
  if (p.modos.compraDireta) abas.push('compraDireta');
  if (p.modos.proposta) abas.push('proposta');

  const [aba, setAba] = useState<Aba>(abas[0] || 'oferta');
  const [ofertas, setOfertas] = useState<OfertaPublica[]>([]);
  const [atual, setAtual] = useState<number | null>(p.ofertaAtual ?? p.precoMinimo);
  const [total, setTotal] = useState<number>(p.totalOfertas);

  const minimoOferta = (atual ?? p.precoMinimo ?? 0) + (p.incremento || 0);
  const [valorOferta, setValorOferta] = useState<string>(String(minimoOferta || ''));
  const [valorProposta, setValorProposta] = useState<string>('');
  const [mensagem, setMensagem] = useState<string>('');
  const [enviando, setEnviando] = useState(false);
  const [msg, setMsg] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null);

  async function carregarOfertas() {
    try {
      const r = await fetch(`/api/proxy/website/v2/venda-direta/anuncios/${p.anuncioId}/ofertas-publicas`, { cache: 'no-store' });
      if (!r.ok) return;
      const d = await r.json();
      if (Array.isArray(d?.result)) {
        setOfertas(d.result);
        setTotal(d.total ?? d.result.length);
        if (d.result[0]?.valor) setAtual(d.result[0].valor);
      }
    } catch { /* ignora */ }
  }

  useEffect(() => { carregarOfertas(); /* eslint-disable-next-line */ }, [p.anuncioId]);

  async function post(path: string, body: unknown) {
    setEnviando(true);
    setMsg(null);
    try {
      const r = await fetch(`/api/proxy/website/v2/venda-direta/anuncios/${p.anuncioId}/${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMsg({ tipo: 'erro', texto: d?.message || `Não foi possível concluir (HTTP ${r.status}).` });
      } else {
        setMsg({ tipo: 'ok', texto: d?.mensagem || 'Tudo certo!' });
        carregarOfertas();
      }
    } catch {
      setMsg({ tipo: 'erro', texto: 'Erro de rede. Tente novamente.' });
    } finally {
      setEnviando(false);
    }
  }

  const rotulo: Record<Aba, string> = { oferta: 'Fazer oferta', compraDireta: 'Compre Já', proposta: 'Enviar proposta' };

  if (abas.length === 0) {
    return <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">Este anúncio não está aceitando participações no momento.</div>;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div>
        <p className="text-xs text-gray-500">{atual ? 'Maior oferta' : 'Preço pretendido'}</p>
        <p className="text-2xl font-bold text-marca">{moeda(atual ?? p.precoMinimo)}</p>
        <p className="text-xs text-gray-500">{total} oferta(s){p.incremento ? ` · incremento ${moeda(p.incremento)}` : ''}</p>
      </div>

      {!p.podeParticipar ? (
        <p className="mt-4 rounded bg-gray-50 p-3 text-sm text-gray-600">{p.vendido ? 'Este item já foi vendido.' : 'O prazo deste evento já encerrou.'}</p>
      ) : !p.logado ? (
        <Link href="/login" className="btn-primary mt-4 w-full">Entrar para participar</Link>
      ) : (
        <div className="mt-4">
          {abas.length > 1 && (
            <div className="mb-3 flex gap-1 rounded-lg bg-gray-100 p-1 text-sm">
              {abas.map((a) => (
                <button key={a} onClick={() => { setAba(a); setMsg(null); }}
                  className={`flex-1 rounded-md px-2 py-1.5 font-medium ${aba === a ? 'bg-white text-marca shadow-sm' : 'text-gray-500'}`}>
                  {rotulo[a]}
                </button>
              ))}
            </div>
          )}

          {aba === 'oferta' && (
            <form onSubmit={(e) => { e.preventDefault(); post('oferta', { valor: Number(valorOferta) }); }} className="space-y-2">
              <label className="label">Sua oferta (mín. {moeda(minimoOferta)})</label>
              <div className="flex gap-2">
                <input className="input" value={valorOferta} onChange={(e) => setValorOferta(e.target.value)} inputMode="decimal" />
                <button type="submit" className="btn-destaque whitespace-nowrap" disabled={enviando}>{enviando ? 'Enviando…' : 'Ofertar'}</button>
              </div>
              <p className="text-xs text-gray-400">A oferta é vinculante. A API valida regras e prazo do evento.</p>
            </form>
          )}

          {aba === 'compraDireta' && (
            <div className="space-y-2">
              <p className="text-sm text-gray-600">Compre agora pelo preço de venda <strong>{moeda(p.precoMinimo)}</strong>, sem esperar o encerramento.</p>
              <button onClick={() => post('compre-ja', {})} className="btn-primary w-full" disabled={enviando}>{enviando ? 'Processando…' : 'Comprar agora'}</button>
            </div>
          )}

          {aba === 'proposta' && (
            <form onSubmit={(e) => { e.preventDefault(); post('proposta', { valor: Number(valorProposta), mensagem }); }} className="space-y-2">
              <label className="label">Valor da sua proposta</label>
              <input className="input" value={valorProposta} onChange={(e) => setValorProposta(e.target.value)} inputMode="decimal" placeholder="R$" />
              <label className="label">Mensagem (opcional)</label>
              <textarea className="input" rows={3} value={mensagem} onChange={(e) => setMensagem(e.target.value)} placeholder="Condições, prazo de pagamento…" />
              <button type="submit" className="btn-outline w-full" disabled={enviando}>{enviando ? 'Enviando…' : 'Enviar proposta'}</button>
              <p className="text-xs text-gray-400">A proposta é uma negociação; a equipe analisa e responde.</p>
            </form>
          )}

          {msg && <p className={`mt-2 rounded p-2 text-sm ${msg.tipo === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{msg.texto}</p>}
        </div>
      )}

      <div className="mt-4">
        <p className="mb-1 text-sm font-semibold text-gray-700">Ofertas recebidas</p>
        {ofertas.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhuma oferta ainda.</p>
        ) : (
          <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
            {ofertas.map((o, i) => (
              <li key={i} className="flex justify-between border-b border-gray-100 py-1">
                <span className="text-gray-600">{o.apelido || 'Interessado'}<span className="ml-2 text-xs text-gray-400">{dataHora(o.data)}</span></span>
                <span className="font-semibold">{moeda(o.valor)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
