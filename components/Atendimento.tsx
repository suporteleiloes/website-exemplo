'use client';
import { useEffect, useRef, useState } from 'react';

type Msg = { role: 'user' | 'bot' | 'sys'; text: string };

// Render leve de markdown (o bot responde em markdown). Sem libs, sem innerHTML:
// trata #/##/### (título), -/* (lista), --- (divisor) e **negrito** inline.
function inlineBold(s: string, key: number) {
  const parts = s.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? <strong key={`${key}-${i}`}>{p.slice(2, -2)}</strong> : <span key={`${key}-${i}`}>{p}</span>
  );
}
function Markdown({ text }: { text: string }) {
  const linhas = text.split('\n');
  return (
    <>
      {linhas.map((ln, i) => {
        const t = ln.trim();
        if (t === '---' || t === '___') return <hr key={i} className="my-1 border-gray-200" />;
        if (/^#{1,6}\s/.test(t)) return <p key={i} className="mt-1 font-semibold">{inlineBold(t.replace(/^#{1,6}\s/, ''), i)}</p>;
        if (/^[-*]\s/.test(t)) return <p key={i} className="ml-3">• {inlineBold(t.replace(/^[-*]\s/, ''), i)}</p>;
        if (/^\d+\.\s/.test(t)) return <p key={i} className="ml-3">{inlineBold(t, i)}</p>;
        if (t === '') return <span key={i} className="block h-1" />;
        return <p key={i}>{inlineBold(ln, i)}</p>;
      })}
    </>
  );
}

interface Props {
  slug: string;
  habilitado: boolean;          // site/config.features.permitirChat
  boasVindas?: string;
}

// Widget de atendimento do site — usa o MESMO motor do CRM (POST /api/public/inbound/webchat,
// bot Anthropic responde inline). Sem iframe externo; o chat é nativo. Canal único/unificado
// (omnichannel no CRM) — sem botão de WhatsApp separado.
export default function Atendimento({ slug, habilitado, boasVindas }: Props) {
  const [aberto, setAberto] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const sessionRef = useRef<string>('');
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    let sid = localStorage.getItem('atendimento_sid');
    if (!sid) { sid = (crypto.randomUUID?.() || String(Date.now()) + Math.random()); localStorage.setItem('atendimento_sid', sid); }
    sessionRef.current = sid;
  }, []);

  useEffect(() => { fimRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, aberto]);

  function abrir() {
    setAberto(true);
    if (msgs.length === 0) {
      setMsgs([{ role: 'bot', text: boasVindas || 'Olá! Como podemos ajudar você hoje?' }]);
    }
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || enviando) return;
    setTexto('');
    setMsgs((m) => [...m, { role: 'user', text: t }]);
    setEnviando(true);
    try {
      const r = await fetch('/api/proxy/public/inbound/webchat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, session_id: sessionRef.current, text: t }),
      });
      const d = await r.json().catch(() => ({}));
      if (d?.replied && d?.reply_text) {
        setMsgs((m) => [...m, { role: 'bot', text: d.reply_text }]);
      } else if (d?.status === 'aguardando_humano' || d?.ok) {
        setMsgs((m) => [...m, { role: 'sys', text: 'Recebemos sua mensagem. Um atendente vai responder em breve.' }]);
      } else {
        setMsgs((m) => [...m, { role: 'sys', text: d?.motivo === 'widget_disabled' ? 'Atendimento indisponível no momento.' : 'Não foi possível enviar. Tente novamente.' }]);
      }
    } catch {
      setMsgs((m) => [...m, { role: 'sys', text: 'Erro de conexão. Tente novamente.' }]);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {/* Painel do chat */}
      {aberto && habilitado && (
        <div className="flex h-[460px] w-[340px] max-w-[90vw] flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-marca px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">Atendimento</p>
              <p className="text-xs opacity-80">Online agora</p>
            </div>
            <button onClick={() => setAberto(false)} aria-label="Fechar" className="text-white/80 hover:text-white">✕</button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto bg-gray-50 p-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${
                  m.role === 'user' ? 'whitespace-pre-line bg-marca text-white' : m.role === 'sys' ? 'bg-amber-100 text-amber-800' : 'space-y-0.5 bg-white text-gray-700 shadow-sm'
                }`}>{m.role === 'bot' ? <Markdown text={m.text} /> : m.text}</div>
              </div>
            ))}
            {enviando && <div className="flex justify-start"><div className="rounded-2xl bg-white px-3 py-2 text-sm text-gray-400 shadow-sm">digitando…</div></div>}
            <div ref={fimRef} />
          </div>
          <form onSubmit={enviar} className="flex gap-2 border-t border-gray-100 p-2">
            <input className="input flex-1" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva sua mensagem…" disabled={enviando} />
            <button type="submit" className="btn-primary px-3" disabled={enviando || !texto.trim()}>➤</button>
          </form>
        </div>
      )}

      {/* Botão flutuante do atendimento (canal único) */}
      {habilitado && (
        <button onClick={() => (aberto ? setAberto(false) : abrir())}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-marca text-white shadow-lg transition hover:scale-105" aria-label="Abrir atendimento">
          {aberto ? <span className="text-2xl">✕</span> : (
            <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
          )}
        </button>
      )}
    </div>
  );
}
