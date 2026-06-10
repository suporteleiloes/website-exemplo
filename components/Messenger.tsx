'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import {
  getBootstrap, getAjuda, getArtigo, getHistorico, enviarMensagem, getProativas,
  type WidgetBootstrap, type AjudaArtigoRef, type AjudaColecao, type AjudaArtigo, type ConversaMsg, type Proativa,
} from '@/lib/widget';

type View = 'inicio' | 'conversa' | 'ajuda' | 'artigo' | 'novidades';

// ── Render leve de markdown (respostas do bot/artigos) ───────────────
function inlineBold(s: string, k: number) {
  return s.split(/(\*\*[^*]+\*\*)/g).map((p, i) =>
    p.startsWith('**') && p.endsWith('**') ? <strong key={`${k}-${i}`}>{p.slice(2, -2)}</strong> : <span key={`${k}-${i}`}>{p}</span>);
}
function Markdown({ text }: { text: string }) {
  return (
    <>{text.split('\n').map((ln, i) => {
      const t = ln.trim();
      if (t === '---') return <hr key={i} className="my-2 border-white/10" />;
      if (/^#{1,6}\s/.test(t)) return <p key={i} className="mt-2 font-semibold">{inlineBold(t.replace(/^#{1,6}\s/, ''), i)}</p>;
      if (/^[-*]\s/.test(t)) return <p key={i} className="ml-3">• {inlineBold(t.replace(/^[-*]\s/, ''), i)}</p>;
      if (t === '') return <span key={i} className="block h-1.5" />;
      return <p key={i}>{inlineBold(ln, i)}</p>;
    })}</>
  );
}

const ICON = {
  inicio: 'M3 11.5 12 4l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  mensagens: 'M21 11.5a8.4 8.4 0 0 1-9 8.4 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5z',
  ajuda: 'M12 18h.01M12 14a2.5 2.5 0 1 0-2.4-3M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
  novidades: 'M3 11v2a1 1 0 0 0 1 1h2l4 4V6L6 10H4a1 1 0 0 0-1 1zM16 8a4 4 0 0 1 0 8',
};

export default function Messenger({ slug }: { slug: string }) {
  const [boot, setBoot] = useState<WidgetBootstrap | null>(null);
  const [aberto, setAberto] = useState(false);
  const [view, setView] = useState<View>('inicio');
  // conversa
  const [msgs, setMsgs] = useState<ConversaMsg[]>([]);
  const [statusConv, setStatusConv] = useState<string | null>(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const sessionRef = useRef('');
  const enviandoRef = useRef(false);
  const fimRef = useRef<HTMLDivElement>(null);
  // ajuda
  const [busca, setBusca] = useState('');
  const [colecoes, setColecoes] = useState<AjudaColecao[]>([]);
  const [artigos, setArtigos] = useState<AjudaArtigoRef[]>([]);
  const [artigo, setArtigo] = useState<AjudaArtigo | null>(null);
  // proativas (outbound)
  const [proativa, setProativa] = useState<Proativa | null>(null);
  const [proativaFechada, setProativaFechada] = useState(false);

  // bootstrap + session
  useEffect(() => {
    getBootstrap(slug).then(setBoot);
    if (typeof window !== 'undefined') {
      let sid = localStorage.getItem('copilotsl_sid');
      if (!sid) { sid = crypto.randomUUID?.() || String(Date.now()) + Math.random(); localStorage.setItem('copilotsl_sid', sid); }
      sessionRef.current = sid;
    }
  }, [slug]);

  useEffect(() => { fimRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, view]);

  // ── Mensagens proativas / outbound: busca as regras e avalia no client ──
  // (tempo na página, path da URL, segmento via localStorage). A 1ª regra que
  // casa vira um balão discreto acima do launcher. Só dispara com o widget
  // fechado e se o visitante não dispensou.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelado = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Segmento simples: 1ª visita (novo) × recorrente, persistido em localStorage.
    const jaVisitou = localStorage.getItem('copilotsl_visitou') === '1';
    const segmento = jaVisitou ? 'retornantes' : 'novos';
    localStorage.setItem('copilotsl_visitou', '1');

    getProativas(slug).then((lista) => {
      if (cancelado || !lista.length) return;
      const url = window.location.pathname + window.location.search;

      const exibir = (p: Proativa) => {
        if (cancelado) return;
        setProativa((atual) => atual ?? p); // mantém a 1ª que disparou
      };

      for (const p of lista) {
        const { evento, valor } = p.regra || ({} as Proativa['regra']);
        if (evento === 'pagina') {
          const alvo = String(valor || '').trim();
          if (alvo === '' || url.toLowerCase().includes(alvo.toLowerCase())) exibir(p);
        } else if (evento === 'segmento') {
          const alvo = String(valor || 'todos');
          if (alvo === 'todos' || alvo === segmento) exibir(p);
        } else {
          // tempo (default): aguarda N segundos na página
          const segs = Math.max(0, parseInt(String(valor ?? 0), 10) || 0);
          timers.push(setTimeout(() => exibir(p), segs * 1000));
        }
      }
    });

    return () => { cancelado = true; timers.forEach(clearTimeout); };
  }, [slug]);

  function abrirDaProativa() {
    setProativa(null);
    setAberto(true);
    abrirConversa();
  }

  const carregarHistorico = useCallback(async () => {
    if (!sessionRef.current) return;
    const { status, messages } = await getHistorico(slug, sessionRef.current);
    setStatusConv(status);
    if (messages.length) setMsgs((prev) => (JSON.stringify(prev) === JSON.stringify(messages) ? prev : messages));
  }, [slug]);

  // polling LAZY: só na aba conversa e com o widget aberto
  useEffect(() => {
    if (!aberto || view !== 'conversa') return;
    carregarHistorico();
    const t = setInterval(() => { if (!enviandoRef.current) carregarHistorico(); }, 4000);
    return () => clearInterval(t);
  }, [aberto, view, carregarHistorico]);

  async function abrirConversa() {
    setView('conversa');
    if (msgs.length === 0 && boot) setMsgs([{ role: 'support', text: boot.boasVindas }]);
    carregarHistorico();
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t || enviando) return;
    setTexto('');
    setMsgs((m) => [...m.filter((x) => !(m.length === 1 && x.role === 'support' && x.text === boot?.boasVindas)), { role: 'user', text: t }]);
    setEnviando(true); enviandoRef.current = true;
    const d = await enviarMensagem(slug, sessionRef.current, t);
    if (!d.ok && d.motivo === 'widget_disabled') setMsgs((m) => [...m, { role: 'support', text: 'Atendimento indisponível no momento.' }]);
    else await carregarHistorico();
    setEnviando(false); enviandoRef.current = false;
  }

  const carregarAjuda = useCallback(async (q = '') => {
    const { colecoes, artigos } = await getAjuda(slug, q);
    setColecoes(colecoes); setArtigos(artigos);
  }, [slug]);

  function irAjuda() { setView('ajuda'); if (artigos.length === 0) carregarAjuda(); }
  async function abrirArtigo(id: number) { const a = await getArtigo(slug, id); setArtigo(a); setView('artigo'); }

  if (!boot || boot.botAtivo === undefined) return null;

  const prim = boot.corPrimaria, sec = boot.corSecundaria;
  const ladoDireita = boot.posicao !== 'esquerda';
  const grad = `linear-gradient(135deg, ${prim} 0%, ${sec} 100%)`;
  const abas: View[] = (['inicio', 'mensagens', 'ajuda', 'novidades'] as const)
    .filter((a) => (boot.abas as any)[a]).map((a) => (a === 'mensagens' ? 'conversa' : a) as View);

  const Avatar = ({ size = 36 }: { size?: number }) => (
    boot.avatarUrl
      ? <img src={boot.avatarUrl} alt={boot.agente} width={size} height={size} className="rounded-full object-cover" />
      : <div className="flex items-center justify-center rounded-full font-bold text-white" style={{ width: size, height: size, background: grad }}>{boot.agente.slice(0, 2)}</div>
  );

  return (
    <div className={`fixed bottom-4 z-50 flex flex-col items-end gap-3 ${ladoDireita ? 'right-4' : 'left-4'}`}>
      {aberto && (
        <div className="flex h-[600px] max-h-[80vh] w-[380px] max-w-[92vw] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0c1322] text-slate-100 shadow-2xl">
          {/* HEADER */}
          <div className="relative px-5 pb-5 pt-4" style={{ background: grad }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {boot.logoUrl ? <img src={boot.logoUrl} alt={boot.nome} className="h-7 w-auto" /> : <span className="text-sm font-semibold text-white/90">{boot.nome}</span>}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">{[0, 1, 2].map((i) => <div key={i} className="h-7 w-7 rounded-full border-2 border-white/30 bg-white/20" />)}</div>
                <button onClick={() => setAberto(false)} aria-label="Fechar" className="ml-1 text-white/80 hover:text-white">✕</button>
              </div>
            </div>
            {view === 'inicio' && (
              <div className="mt-5 text-white">
                <p className="text-2xl font-bold leading-tight">{boot.saudacao}</p>
                <p className="mt-1 text-lg font-medium text-white/90">{boot.boasVindas}</p>
              </div>
            )}
            {(view === 'conversa' || view === 'ajuda' || view === 'artigo' || view === 'novidades') && (
              <div className="mt-3 flex items-center gap-2 text-white">
                {(view === 'artigo') && <button onClick={() => setView('ajuda')} className="text-white/80 hover:text-white">‹</button>}
                {view === 'conversa' && <Avatar size={32} />}
                <div>
                  <p className="text-sm font-semibold">
                    {view === 'conversa' ? boot.agente : view === 'ajuda' || view === 'artigo' ? 'Central de Ajuda' : 'Novidades'}
                  </p>
                  {view === 'conversa' && (
                    <p className="text-xs text-white/80">
                      {statusConv === 'em_atendimento' ? 'Falando com a equipe' : statusConv === 'aguardando_humano' ? 'Conectando a um atendente…' : boot.horario.aberto ? 'Online agora' : 'Fora do horário'}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* CORPO */}
          <div className="flex-1 overflow-y-auto bg-[#0c1322]">
            {/* INÍCIO */}
            {view === 'inicio' && (
              <div className="space-y-3 p-4">
                <button onClick={abrirConversa} className="w-full rounded-xl border border-white/10 bg-[#141d31] p-4 text-left transition hover:border-white/20 hover:bg-[#18233b]">
                  <div className="flex items-center justify-between">
                    <div><p className="font-semibold">Enviar uma mensagem</p><p className="text-sm text-slate-400">Nosso time e o {boot.agente} respondem</p></div>
                    <span className="text-xl" style={{ color: sec }}>›</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2"><Avatar size={28} /><span className="rounded-full px-3 py-1 text-sm text-white" style={{ background: grad }}>Iniciar conversa</span></div>
                </button>
                {boot.abas.ajuda && (
                  <button onClick={irAjuda} className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-[#141d31] p-4 text-left transition hover:border-white/20">
                    <div className="flex items-center gap-3">
                      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={sec} strokeWidth="2"><path d={ICON.ajuda} /></svg>
                      <div><p className="font-semibold">Buscar na Central de Ajuda</p><p className="text-sm text-slate-400">Artigos e respostas rápidas</p></div>
                    </div>
                    <span className="text-xl text-slate-500">›</span>
                  </button>
                )}
                {boot.abas.novidades && boot.novidades.length > 0 && (
                  <div className="rounded-xl border border-white/10 bg-[#141d31] p-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Novidades</p>
                    {boot.novidades.slice(0, 2).map((n, i) => (
                      <div key={i} className="border-t border-white/5 py-2 first:border-0 first:pt-0">
                        <p className="text-sm font-medium">{n.titulo}</p><p className="text-xs text-slate-400">{n.resumo}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* CONVERSA */}
            {view === 'conversa' && (
              <div className="space-y-2.5 p-4">
                {msgs.map((m, i) => (
                  <div key={m.id ?? `l-${i}`} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start gap-2'}`}>
                    {m.role === 'support' && <div className="mt-auto"><Avatar size={24} /></div>}
                    <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === 'user' ? 'whitespace-pre-line text-white' : 'space-y-0.5 bg-[#1b2740] text-slate-100'}`} style={m.role === 'user' ? { background: prim } : undefined}>
                      {m.role === 'support' ? <Markdown text={m.text} /> : m.text}
                    </div>
                  </div>
                ))}
                {!boot.horario.aberto && statusConv !== 'em_atendimento' && (
                  <p className="rounded-lg bg-amber-500/10 p-2 text-center text-xs text-amber-300">{boot.horario.foraMsg}</p>
                )}
                {(statusConv === 'aguardando_humano' || statusConv === 'em_atendimento') && (
                  <p className="text-center text-xs text-slate-500">{statusConv === 'aguardando_humano' ? 'Encaminhado para um atendente.' : 'Em atendimento com a equipe.'}</p>
                )}
                {enviando && <div className="flex justify-start gap-2"><div className="mt-auto"><Avatar size={24} /></div><div className="rounded-2xl bg-[#1b2740] px-3 py-2 text-sm text-slate-400">digitando…</div></div>}
                <div ref={fimRef} />
              </div>
            )}

            {/* AJUDA */}
            {view === 'ajuda' && (
              <div className="p-4">
                <div className="relative mb-3">
                  <input value={busca} onChange={(e) => { setBusca(e.target.value); carregarAjuda(e.target.value); }}
                    placeholder="Buscar artigos…" className="w-full rounded-xl border border-white/10 bg-[#141d31] py-2.5 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-white/25" />
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#64748b" strokeWidth="2" className="absolute left-3 top-3"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
                </div>
                {!busca && colecoes.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {colecoes.map((c) => <span key={c.categoria} className="rounded-full border border-white/10 bg-[#141d31] px-3 py-1 text-xs text-slate-300">{c.categoria} · {c.total}</span>)}
                  </div>
                )}
                <div className="space-y-2">
                  {artigos.map((a) => (
                    <button key={a.id} onClick={() => abrirArtigo(a.id)} className="w-full rounded-xl border border-white/10 bg-[#141d31] p-3 text-left transition hover:border-white/20">
                      <p className="text-sm font-medium">{a.titulo}</p><p className="line-clamp-1 text-xs text-slate-400">{a.resumo}</p>
                    </button>
                  ))}
                  {artigos.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Nenhum artigo encontrado.</p>}
                </div>
              </div>
            )}

            {/* ARTIGO */}
            {view === 'artigo' && artigo && (
              <div className="p-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide" style={{ color: sec }}>{artigo.categoria}</p>
                <h3 className="mb-3 text-lg font-bold">{artigo.titulo}</h3>
                <div className="space-y-1 text-sm leading-relaxed text-slate-300"><Markdown text={artigo.corpo} /></div>
                <button onClick={abrirConversa} className="mt-5 w-full rounded-xl py-2.5 text-sm font-semibold text-white" style={{ background: grad }}>Ainda precisa de ajuda? Fale conosco</button>
              </div>
            )}

            {/* NOVIDADES */}
            {view === 'novidades' && (
              <div className="space-y-3 p-4">
                {boot.novidades.length === 0 && <p className="py-8 text-center text-sm text-slate-500">Sem novidades por enquanto.</p>}
                {boot.novidades.map((n, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-[#141d31] p-4">
                    <p className="font-semibold">{n.titulo}</p><p className="mt-1 text-sm text-slate-400">{n.resumo}</p>
                    {n.data && <p className="mt-2 text-xs text-slate-500">{n.data}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* COMPOSER (só conversa) */}
          {view === 'conversa' && (
            <form onSubmit={enviar} className="flex items-center gap-2 border-t border-white/10 bg-[#0c1322] p-2.5">
              <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Escreva sua mensagem…" disabled={enviando}
                className="flex-1 rounded-full border border-white/10 bg-[#141d31] px-4 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-white/25" />
              <button type="submit" disabled={enviando || !texto.trim()} className="flex h-9 w-9 items-center justify-center rounded-full text-white disabled:opacity-40" style={{ background: prim }} aria-label="Enviar">↑</button>
            </form>
          )}

          {/* BOTTOM NAV */}
          <div className="flex border-t border-white/10 bg-[#0c1322]">
            {abas.map((a) => {
              const key = a === 'conversa' ? 'mensagens' : a;
              const ativo = view === a || (a === 'conversa' && view === 'conversa') || (a === 'ajuda' && view === 'artigo');
              const label = { inicio: 'Início', conversa: 'Mensagens', ajuda: 'Ajuda', novidades: 'Novidades' }[a as string] || a;
              return (
                <button key={a} onClick={() => { if (a === 'conversa') abrirConversa(); else if (a === 'ajuda') irAjuda(); else setView(a); }}
                  className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] ${ativo ? 'text-white' : 'text-slate-500'}`}>
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={ativo ? 2.2 : 1.8} style={ativo ? { color: sec } : undefined}><path d={(ICON as any)[key]} /></svg>
                  <span style={ativo ? { color: '#fff' } : undefined}>{label}</span>
                </button>
              );
            })}
          </div>
          <div className="bg-[#0c1322] pb-2 text-center text-[10px] text-slate-600">Powered by {boot.agente}</div>
        </div>
      )}

      {/* MENSAGEM PROATIVA (outbound) — balão discreto acima do launcher */}
      {!aberto && proativa && !proativaFechada && (
        <div className="relative w-[300px] max-w-[80vw] animate-[fadeIn_.25s_ease]" data-test="proativa-balao">
          <button
            onClick={() => { setProativa(null); setProativaFechada(true); }}
            aria-label="Dispensar"
            className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#1b2740] text-xs text-slate-300 shadow-md hover:text-white"
          >✕</button>
          <button
            onClick={abrirDaProativa}
            className="flex w-full items-start gap-2.5 rounded-2xl border border-white/10 bg-[#0c1322] p-3.5 text-left shadow-2xl transition hover:border-white/20"
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: grad }}>
              {boot.agente.slice(0, 2)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-100">{proativa.titulo}</p>
              <p className="mt-0.5 text-xs leading-snug text-slate-400">{proativa.corpo}</p>
            </div>
          </button>
        </div>
      )}

      {/* LAUNCHER */}
      <button onClick={() => setAberto(!aberto)} aria-label="Abrir atendimento"
        className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition hover:scale-105" style={{ background: grad }}>
        {aberto ? <span className="text-2xl">✕</span> : (
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2"><path d={ICON.mensagens} /></svg>
        )}
      </button>
    </div>
  );
}
