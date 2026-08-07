'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { PAINEL_URL } from '@/lib/config';

/**
 * ── SESSÃO ÚNICA SITE + PAINEL (2026-08-07) ─────────────────────────────────
 * Logar no site tem de logar TAMBÉM no painel do arrematante (app-cliente, outro
 * domínio). Como cookie não atravessa domínio, mandamos o navegador pelo handoff
 * SSO com `?voltar=<url do site>`: o painel resgata o código de uso único, grava
 * a sessão dele e devolve o visitante exatamente pra onde ele ia. Sem isso, o
 * arrematante logado no site chegava DESLOGADO no auditório.
 * É navegação de página inteira (window.location), não `router.push` — o destino
 * é outro domínio. Se o handoff falhar, o BFF devolve pro site do mesmo jeito, e
 * os links continuam cobertos pelo handoff em cada clique (ver lib/painel.ts).
 */
export default function LoginForm() {
  const router = useRouter();
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErro(''); setLoading(true);
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user, pass }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setErro(d?.message || 'Não foi possível entrar.'); return; }
      if (PAINEL_URL) {
        // Passa pelo painel pra propagar a sessão e volta pro destino no site.
        window.location.href = `/api/sso/handoff?redirect=/&voltar=${encodeURIComponent('/conta')}`;
        return;
      }
      router.push('/conta');
      router.refresh();
    } catch { setErro('Erro de rede.'); }
    finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="label">E-mail ou usuário</label>
        <input className="input" value={user} onChange={(e) => setUser(e.target.value)} autoComplete="username" />
      </div>
      <div>
        <label className="label">Senha</label>
        <input type="password" className="input" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
      </div>
      {erro && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{erro}</p>}
      <button type="submit" className="btn-primary w-full" disabled={loading}>{loading ? 'Entrando…' : 'Entrar'}</button>
    </form>
  );
}
