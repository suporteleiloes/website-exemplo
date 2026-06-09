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
  whatsapp?: string | null;
  habilitado: boolean;          // site/config.features.permitirChat
  boasVindas?: string;
}

// Widget de atendimento do site — usa o MESMO motor do CRM (POST /api/public/inbound/webchat,
// bot Anthropic responde inline). Sem iframe externo; o chat é nativo. Botão WhatsApp à parte.
export default function Atendimento({ slug, whatsapp, habilitado, boasVindas }: Props) {
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

      {/* Botões flutuantes */}
      <div className="flex flex-col items-end gap-2">
        {whatsapp && (
          <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noopener noreferrer"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-2xl text-white shadow-lg transition hover:scale-105" aria-label="WhatsApp">
            <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 018.413 3.488 11.824 11.824 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.51 5.26l-.999 3.648 3.477-.915zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
          </a>
        )}
        {habilitado && (
          <button onClick={() => (aberto ? setAberto(false) : abrir())}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-marca text-white shadow-lg transition hover:scale-105" aria-label="Abrir atendimento">
            {aberto ? <span className="text-2xl">✕</span> : (
              <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
